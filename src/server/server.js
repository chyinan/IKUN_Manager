// 服务器入口文件
const express = require('express');
const http = require('http'); // Import http module
const { Server } = require("socket.io"); // Import Socket.IO Server class
const cors = require('cors');
const bodyParser = require('body-parser');
const config = require('./config');
const db = require('./db');
const employeeService = require('./employeeService');
const examService = require('./examService');
const deptService = require('./deptService');
const classService = require('./classService');
const studentService = require('./studentService');
const scoreService = require('./scoreService');
const logService = require('./logService');
const jwt = require('jsonwebtoken'); // Import jsonwebtoken
const userService = require('./userService'); // Import userService
const path = require('path'); // <-- Add path module
const fs = require('fs'); // <-- Add fs module for directory check
const multer = require('multer'); // <-- Add multer module
const xlsx = require('xlsx');
const papaparse = require('papaparse');

// --- Simple Middleware for Debugging ---
const simpleAuthLogger = (req, res, next) => {
  console.log('[DEBUG] simpleAuthLogger executed for export route.');
  next();
};
// --- End Simple Middleware ---

// 创建Express应用
const app = express();
const httpServer = http.createServer(app); // Create HTTP server

// Configure Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: config.cors.origin || "*", // Use origin from config or allow all
    methods: ["GET", "POST"],
    // credentials: true // Usually not needed unless using cookies/sessions with sockets
  }
});

// Function to broadcast logs - DEFINED EARLIER
global.broadcastLog = (logEntry) => {
  if (io) { // Ensure io is initialized
    io.emit('serverLog', logEntry); // Emit to all connected clients
    console.log('Broadcasting log entry via Socket.IO:', logEntry);
  } else {
      console.error('Attempted to broadcast log but Socket.IO server (io) is not initialized.');
  }
};

// 中间件
app.use(cors(config.cors));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// --- Static File Serving ---
// Serve files from the /uploads directory relative to server.js
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); 
console.log(`Serving static files from: ${path.join(__dirname, 'uploads')}`);
// --- End Static File Serving ---

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// --- Multer Configuration for Import (Moved to Top) ---
const importUpload = multer({
    storage: multer.memoryStorage(), // Store file in memory buffer
    limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size (e.g., 10MB)
    fileFilter: function (req, file, cb) {
        const allowedTypes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
          'application/vnd.ms-excel', // .xls
          'text/csv' // .csv
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            console.warn(`[Import Filter] Rejected file type: ${file.mimetype}`);
            cb(new Error('仅支持上传 Excel (.xlsx, .xls) 或 CSV (.csv) 文件'), false);
        }
    }
});
// --- End Multer Configuration for Import ---

// 错误处理中间件 (Keep it here or move to the very end)
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    data: null
  });
});

// API前缀
const apiPrefix = '/api';

// 测试路由
app.get(`${apiPrefix}/test`, (req, res) => {
  res.json({
    code: 200,
    data: { message: '服务器连接成功!' },
    message: 'success'
  });
});

// 员工统计API
app.get(`${apiPrefix}/employee/stats`, async (req, res) => {
  try {
    console.log('收到员工统计数据请求');
    const stats = await employeeService.getEmployeeStats();
    console.log('员工统计数据:', stats);
    res.json({
      code: 200,
      data: stats,
      message: 'success'
    });
  } catch (error) {
    console.error('获取员工统计数据失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取员工统计数据失败',
      data: null
    });
  }
});

// 考试统计API
app.get(`${apiPrefix}/exam/stats`, async (req, res) => {
  try {
    console.log('获取考试统计数据');
    const stats = await examService.getExamStats();
    res.json({
      code: 200,
      data: stats,
      message: 'success'
    });
  } catch (error) {
    console.error('获取考试统计数据失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取考试统计数据失败',
      data: null
    });
  }
});

// 获取考试列表
app.get(`${apiPrefix}/exam/list`, async (req, res) => {
  try {
    console.log('获取考试列表, 参数:', req.query);
    const examData = await examService.getExamList(req.query);

    res.json({
      code: 200,
      message: '获取成功',
      data: examData
    });
  } catch (error) {
    console.error('获取考试列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取考试列表时发生内部错误: ' + error.message,
      data: null
    });
  }
});

// --- Define specific routes BEFORE general routes with parameters ---

// 获取考试类型选项 (Moved from end of file to BEFORE /exam/:id)
app.get('/api/exam/types', async (req, res) => {
  console.log('[Correct Position] 获取所有考试类型列表'); 
  try {
    // Call the correctly exported function from examService
    const types = await examService.getDistinctExamTypes(); 
    res.json({ code: 200, message: '获取成功', data: types });
  } catch (error) {
    console.error('获取所有考试类型列表失败:', error);
    res.status(500).json({ code: 500, message: '获取所有考试类型列表失败' });
  }
});

// 获取科目选项 (Moved from end of file to BEFORE /exam/:id)
app.get('/api/exam/subjects', async (req, res) => {
  try {
    console.log('[Correct Position] 获取科目选项'); // Updated log marker
    const subjects = await examService.getSubjectOptions();
    res.json({
      code: 200,
      data: subjects,
      message: 'success'
    });
  } catch (error) {
    console.error('获取科目选项失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取科目选项失败',
      data: null
    });
  }
});

// --- General route with :id parameter ---
// 获取考试详情 (Now correctly AFTER /api/exam/types)
app.get('/api/exam/:id', async (req, res) => {
  const examId = req.params.id;
  console.log(`[/:id Path] Checking examId: ${examId}`); // Updated log marker
  if (!/^[0-9]+$/.test(examId)) { 
      console.log(`[/:id Path] Invalid ID format: ${examId}`);
      return res.status(400).json({ code: 400, message: '无效的考试ID格式' });
  }
  console.log(`[/:id Path] 获取考试详情, id: ${examId}`);
  try {
    const exam = await examService.getExamById(parseInt(examId, 10));
    if (exam) {
      res.json({ code: 200, data: exam, message: 'success' });
    } else {
      res.status(404).json({ code: 404, message: '考试不存在', data: null });
    }
  } catch (error) {
    console.error(`获取考试详情失败, id: ${examId}:`, error);
    res.status(500).json({
      code: 500,
      message: '获取考试详情失败',
      data: null
    });
  }
});

// --- JWT Secret (IMPORTANT: Use environment variable in production!) ---
const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_TEMPORARY_SECRET_KEY_CHANGE_ME'; 
if (JWT_SECRET === 'YOUR_TEMPORARY_SECRET_KEY_CHANGE_ME') {
    console.warn('WARNING: Using default JWT secret. Please set a secure JWT_SECRET environment variable in production!');
}

// --- Authentication Middleware (Updated with JWT Verification) ---
const authenticateToken = (req, res, next) => {
  console.log('[Auth DEBUG] authenticateToken middleware started.'); // <-- 添加日志
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    console.log('[Auth] No token provided.');
    // Return 401 Unauthorized if no token is provided for a protected route
    return res.status(401).json({ code: 401, message: '用户未认证，请求需要Token' });
  }

  console.log('[Auth DEBUG] Token found, attempting verification...'); // <-- 添加日志
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('[Auth] Token verification failed:', err.message);
      // Return 403 Forbidden if token is invalid or expired
      let message = 'Token无效或已过期';
      if (err.name === 'TokenExpiredError') {
          message = '登录已过期，请重新登录';
      } else if (err.name === 'JsonWebTokenError') {
          message = '无效的Token';
      }
      // Ensure response is sent ONLY if headers haven't been sent already
      if (!res.headersSent) {
        return res.status(403).json({ code: 403, message: message });
      }
      return; // Stop execution if headers were already sent
    }
    
    // --- Added try-catch around decoded/next() --- 
    try {
        // Token is valid, attach decoded payload (user info) to request
        req.user = decoded; // decoded payload usually contains user id, username, etc.
        console.log(`[Auth] Token verified successfully. User ID: ${req.user?.id}, Username: ${req.user?.username}`); // Log user ID and username
        console.log('[Auth DEBUG] Calling next()...'); // <-- 添加日志
        next(); // Proceed to the next middleware/route handler ONLY if token is valid
    } catch (nextError) {
        console.error('[Auth DEBUG] Error occurred AFTER token verification but BEFORE/DURING next():', nextError);
        // Pass the error to the Express global error handler
        next(nextError); 
    }
    // --- End added try-catch ---
  });
};

// 新增考试 (Apply middleware)
app.post(`${apiPrefix}/exam/add`, authenticateToken, async (req, res) => {
  try {
    const examData = req.body;
    console.log('收到新增考试请求, 数据:', examData);
    // Assuming examService.addExam exists and handles data insertion
    const newExam = await examService.addExam(examData);
    // --- Add Logging ---
    logService.addLog({
      type: 'database',
      operation: '新增',
      content: `新增 考试: 名称=${newExam?.exam_name || '(未知)'}`,
      operator: req.user?.username || 'system'
    });
    // --- End Logging ---
    res.status(201).json({
      code: 201,
      message: '考试新增成功',
      data: newExam
    });
  } catch (error) {
    console.error('新增考试失败:', error);
    // Basic error handling, refine as needed
    const statusCode = error.message.includes('不能为空') ? 400 : 500;
    res.status(statusCode).json({
      code: statusCode,
      message: `新增考试失败: ${error.message}`,
      data: null
    });
  }
});

// 新增：更新考试信息 (Apply middleware)
app.put(`${apiPrefix}/exam/:id`, authenticateToken, async (req, res) => {
  try {
    const examId = parseInt(req.params.id);
    const examData = req.body;

    if (isNaN(examId)) {
      return res.status(400).json({ code: 400, message: '无效的考试ID' });
    }

    // 调用 examService 中的更新函数 (假设存在 updateExam 函数)
    const updatedExam = await examService.updateExam(examId, examData);
    // --- Add Logging ---
    logService.addLog({
      type: 'database',
      operation: '更新',
      content: `更新 考试: ID=${examId}`,
      operator: req.user?.username || 'system'
    });
    // --- End Logging ---
    res.json({
      code: 200,
      message: '考试信息更新成功',
      data: updatedExam
    });
  } catch (error) {
    console.error(`更新考试 ID ${req.params.id} 失败:`, error);
    const statusCode = error.message.includes('未找到') ? 404 : 500;
    res.status(statusCode).json({
      code: statusCode,
      message: `更新考试失败: ${error.message}`,
      data: null
    });
  }
});

// 删除考试 (Apply middleware)
app.delete(`${apiPrefix}/exam/:id`, authenticateToken, async (req, res) => {
  try {
    const examId = parseInt(req.params.id);
    const success = await examService.deleteExam(examId);
    
    if (!success) {
      return res.status(404).json({
        code: 404,
        message: '考试不存在',
        data: null
      });
    }
    
    // --- Add Logging ---
    logService.addLog({
      type: 'database',
      operation: '删除',
      content: `删除 考试: ID=${examId}`,
      operator: req.user?.username || 'system'
    });
    // --- End Logging ---
    res.json({
      code: 200,
      message: '删除考试成功',
      data: null
    });
  } catch (error) {
    console.error('删除考试失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除考试失败: ' + error.message,
      data: null
    });
  }
});

// API路由
// 员工相关API
app.get('/api/employee/list', authenticateToken, async (req, res) => { // Added authenticateToken
  try {
    const employees = await employeeService.getEmployeeList(req.query);
    res.json({
      code: 200,
      message: '获取员工列表成功',
      data: employees
    });
  } catch (error) {
    console.error('获取员工列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取员工列表失败: ' + error.message,
      data: null
    });
  }
});
// --- End /list Route ---

// --- Employee Export Route (Restored) ---
// GET /api/employee/export
// Restore authenticateToken and the original async handler
app.get(`${apiPrefix}/employee/export`, authenticateToken, async (req, res) => { 
  // **** 添加日志：确认路由处理器被调用 ****
  console.log(`[Export Route DEBUG - CORRECT ORDER] Handler function for ${req.method} ${req.path} was called.`);
  // **** 结束日志 ****
  try {
    console.log('[Export Route - CORRECT ORDER] Received export request with query:', req.query);
    // 1. 获取需要导出的员工数据，应用查询参数进行过滤
    const employees = await employeeService.getEmployeesForExport(req.query);
    console.log(`[Export Route - CORRECT ORDER] Got ${employees.length} employees to export.`);
    // **** 添加日志：打印从 Service 获取的第一条原始数据 ****
    if (employees.length > 0) {
      console.log('[Export Route DEBUG - CORRECT ORDER] First raw employee data from service:', JSON.stringify(employees[0]));
    }
    // **** 结束日志 ****

    if (employees.length === 0) {
      // 如果没有数据，可以返回一个空文件或错误提示
      // 这里选择返回 404 (或者可以发送一个空的 Excel 文件)
      return res.status(404).json({ code: 404, message: '没有符合条件的员工数据可以导出' });
    }

    // 2. 定义 Excel 表头 (使用中文，与导入格式对应)
    const headers = [
      "工号", "姓名", "性别", "年龄", "职位", "所属部门",
      "薪资", "状态", "联系电话", "邮箱", "入职时间"
    ];

    // 3. 准备工作表数据 (对象数组转换为数组的数组，并添加表头)
    const worksheetData = [
      headers,
      ...employees.map((emp, index) => {
        // **** 添加日志：打印映射前的 emp 对象和映射后的数组 ****
        const mappedRow = [
            emp.emp_id, emp.name, emp.gender, emp.age, emp.position,
            emp.dept_name, emp.salary, emp.status, emp.phone, emp.email, emp.join_date
        ];
        if (index === 0) { // 只打印第一行的数据用于调试
            console.log(`[Export Route DEBUG - CORRECT ORDER] Mapping row ${index}:`, JSON.stringify(emp));
            console.log(`[Export Route DEBUG - CORRECT ORDER] Mapped row ${index}:`, JSON.stringify(mappedRow));
        }
        // **** 结束日志 ****
        return mappedRow;
      })
    ];
    // **** 添加日志：打印最终要写入 Excel 的数据结构 (部分) ****
    console.log('[Export Route DEBUG - CORRECT ORDER] Final worksheetData (first 2 rows):', JSON.stringify(worksheetData.slice(0, 2)));
    // **** 结束日志 ****
    console.log('[Export Route - CORRECT ORDER] Worksheet data prepared.');

    // 4. 创建工作簿和工作表
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);

    // (可选) 调整列宽
    const colWidths = headers.map((_, i) => ({ wch: i === 1 || i === 4 || i === 5 || i === 9 || i === 10 ? 20 : 15 })); // 给姓名、职位、部门、邮箱、入职时间更宽的列
    worksheet['!cols'] = colWidths;

    xlsx.utils.book_append_sheet(workbook, worksheet, "员工数据");
    console.log('[Export Route - CORRECT ORDER] Workbook created.');

    // 5. 生成 Excel 文件 buffer
    // type: 'buffer' 生成 Buffer 对象
    const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    console.log('[Export Route - CORRECT ORDER] Excel buffer generated.');

    // 6. 设置响应头，告诉浏览器这是一个 Excel 文件下载
    const fileName = `employees_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    // 7. 发送 buffer
    res.send(excelBuffer);
    console.log(`[Export Route - CORRECT ORDER] Sent Excel file: ${fileName}`);

  } catch (error) {
    console.error('[Export Route - CORRECT ORDER] Error during export:', error);
    // **** 添加日志 ****
    console.error('[Export Route DEBUG - CORRECT ORDER] Error caught in handler:', error);
    // **** 结束日志 ****
    // 如果捕获到错误，确保发送错误响应，而不是让请求挂起
    if (!res.headersSent) {
       res.status(500).json({ code: 500, message: `导出失败: ${error.message}` });
    }
  }
});
// --- End Restored Export Route ---

app.get('/api/employee/:id', authenticateToken, async (req, res) => { // Added authenticateToken
  try {
    const id = parseInt(req.params.id);
    const employee = await employeeService.getEmployeeDetail(id);
    
    if (!employee) {
      return res.status(404).json({
        code: 404,
        message: '员工不存在',
        data: null
      });
    }
    
    res.json({
      code: 200,
      message: '获取员工详情成功',
      data: employee
    });
  } catch (error) {
    console.error('获取员工详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取员工详情失败: ' + error.message,
      data: null
    });
  }
});
// --- End /:id Route ---

app.post('/api/employee/add', authenticateToken, async (req, res) => {
  try {
    const employeeData = req.body;
    // Call the service function
    const newEmployee = await employeeService.addEmployee(employeeData);

    // --- Log ONLY AFTER successful insertion --- 
    logService.addLog({
      type: 'database',
      operation: '新增',
      content: `员工: 工号=${newEmployee?.emp_id || '(未知)'}`,
      operator: req.user?.username || 'system'
    });
    
    // Send success response
    res.json({
      code: 200,
      message: '添加员工成功',
      data: newEmployee
    });
  } catch (error) {
    console.error('添加员工失败:', error);
    // --- Improved Error Handling ---
    let statusCode = 500;
    let message = '添加员工失败: 服务器内部错误';

    if (error.code === 'ER_DUP_ENTRY') {
      statusCode = 400; // Bad Request due to duplicate entry
      message = `添加员工失败: 工号 ${req.body?.emp_id || ''} 已存在`;
    } else if (error.message) {
      // Keep other specific error messages if they exist
      message = `添加员工失败: ${error.message}`;
      if (error.message.includes('不能为空')) { // Example check
          statusCode = 400;
      }
    }
    
    res.status(statusCode).json({
      code: statusCode,
      message: message,
      data: null
    });
  }
});

app.put('/api/employee/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const employeeData = req.body;
    const updatedEmployee = await employeeService.updateEmployee(id, employeeData);
    
    if (!updatedEmployee) {
      return res.status(404).json({
        code: 404,
        message: '员工不存在',
        data: null
      });
    }
    
    // --- Add Logging ---
    logService.addLog({
      type: 'database',
      operation: '更新',
      content: `员工: ID=${id}`,
      operator: req.user?.username || 'system'
    });
    // --- End Logging ---
    res.json({
      code: 200,
      message: '更新员工成功',
      data: updatedEmployee
    });
  } catch (error) {
    console.error('更新员工失败:', error);
    res.status(500).json({
      code: 500,
      message: '更新员工失败: ' + error.message,
      data: null
    });
  }
});

app.delete('/api/employee/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Call the modified service function which returns { success, emp_id }
    const deleteResult = await employeeService.deleteEmployee(id); 
    
    if (!deleteResult.success) {
      return res.status(404).json({
        code: 404,
        message: '员工不存在或删除失败', // More accurate message
        data: null
      });
    }
    
    // --- Add Logging using the returned emp_id ---
    logService.addLog({
      type: 'database',
      operation: '删除',
      // Use emp_id for content, fallback to ID if emp_id was null (shouldn't happen if found)
      content: `员工: 工号=${deleteResult.emp_id || '(ID: ' + id + ')'}`,
      operator: req.user?.username || 'system'
    });
    // --- End Logging ---
    
    res.json({
      code: 200,
      message: '删除员工成功',
      data: null
    });
  } catch (error) {
    console.error('删除员工失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除员工失败: ' + error.message,
      data: null
    });
  }
});

app.delete('/api/employee/batch', authenticateToken, async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '无效的员工ID列表',
        data: null
      });
    }
    
    const success = await employeeService.batchDeleteEmployee(ids);
    
    // --- Add Logging ---
    logService.addLog({
      type: 'database',
      operation: '批量删除',
      content: `员工: IDs=${ids.join(', ')}`,
      operator: req.user?.username || 'system'
    });
    // --- End Logging ---
    res.json({
      code: 200,
      message: '批量删除员工成功',
      data: null
    });
  } catch (error) {
    console.error('批量删除员工失败:', error);
    res.status(500).json({
      code: 500,
      message: '批量删除员工失败: ' + error.message,
      data: null
    });
  }
});

// 部门相关API
app.get(`${apiPrefix}/dept/list`, async (req, res) => {
  try {
    console.log('收到部门列表请求, 参数:', req.query);
    const departments = await deptService.getDeptList(req.query);
    res.json({
      code: 200,
      message: '获取部门列表成功',
      data: departments
    });
  } catch (error) {
    console.error('获取部门列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取部门列表失败: ' + error.message,
      data: null
    });
  }
});

app.get(`${apiPrefix}/dept/:id`, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`收到部门详情请求, ID: ${id}`);
    const department = await deptService.getDeptDetail(id);
    
    if (!department) {
      return res.status(404).json({
        code: 404,
        message: '部门不存在',
        data: null
      });
    }
    
    res.json({
      code: 200,
      message: '获取部门详情成功',
      data: department
    });
  } catch (error) {
    console.error('获取部门详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取部门详情失败: ' + error.message,
      data: null
    });
  }
});

// 新增部门 (Apply middleware)
app.post(`${apiPrefix}/dept/add`, authenticateToken, async (req, res) => {
  try {
    const deptData = req.body;
    console.log('收到新增部门请求, 数据:', deptData);

    // 调用 deptService 中的 addDept 函数
    const newDept = await deptService.addDept(deptData);
    // --- Add Logging ---
    logService.addLog({
      type: 'database',
      operation: '新增',
      content: `部门: 名称=${newDept?.dept_name || '(未知)'}`,
      operator: req.user?.username || 'system'
    });
    // --- End Logging ---
    res.status(201).json({
      code: 201, // 201 Created
      message: '部门新增成功',
      data: newDept // 返回新增的部门信息（包含ID）
    });
  } catch (error) {
    console.error('新增部门失败:', error);
    const statusCode = error.message.includes('不能为空') || error.message.includes('已存在') ? 400 : 500;
    res.status(statusCode).json({
      code: statusCode,
      message: `新增部门失败: ${error.message}`,
      data: null
    });
  }
});

// 更新部门 (Apply middleware)
app.put(`${apiPrefix}/dept/:id`, authenticateToken, async (req, res) => {
  console.log(`[ROUTE HANDLER] Received PUT request for /api/dept/${req.params.id}`); // 添加日志
  try {
    const id = parseInt(req.params.id);
    const deptData = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ code: 400, message: '无效的部门ID' });
    }
    console.log(`收到更新部门请求, ID: ${id}, 数据:`, deptData);

    // 调用 deptService 中的 updateDept 函数
    const updatedDept = await deptService.updateDept(id, deptData);
    // --- Add Logging ---
    logService.addLog({
      type: 'database',
      operation: '更新',
      content: `部门: ID=${id}`,
      operator: req.user?.username || 'system'
    });
    // --- End Logging ---
    res.json({
      code: 200,
      message: '部门更新成功',
      data: updatedDept
    });
  } catch (error) {
    console.error(`更新部门失败 (ID: ${req.params.id}):`, error);
    const statusCode = error.message.includes('不能为空') || error.message.includes('已存在') || error.message.includes('未找到') ? 400 : 500;
    res.status(statusCode).json({
      code: statusCode,
      message: `更新部门失败: ${error.message}`,
      data: null
    });
  }
});

// 删除部门 (Apply middleware)
app.delete(`${apiPrefix}/dept/:id`, authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ code: 400, message: '无效的部门ID' });
    }
    console.log(`收到删除部门请求, ID: ${id}`);

    // 调用 deptService 中的 deleteDept 函数
    const deleteResult = await deptService.deleteDept(id);

    if (deleteResult.success) {
      // --- Add Logging ---
      logService.addLog({
        type: 'database',
        operation: '删除',
        content: `部门: 名称=${deleteResult.dept_name || '(ID: ' + id + ')'}`,
        operator: req.user?.username || 'system'
      });
      // --- End Logging ---
      res.json({ code: 200, message: '部门删除成功', data: null });
    } else {
      // 如果 service 返回 false，说明部门未找到
      res.status(404).json({ code: 404, message: '部门不存在', data: null });
    }
  } catch (error) {
    console.error(`删除部门失败 (ID: ${req.params.id}):`, error);
    // 如果错误消息包含特定文本，返回400，否则500
    const statusCode = error.message.includes('无法删除') ? 400 : 500;
    res.status(statusCode).json({
      code: statusCode,
      message: `删除部门失败: ${error.message}`,
      data: null
    });
  }
});

// --- Department Import Route --- 
// POST /api/dept/import
app.post(`${apiPrefix}/dept/import`, authenticateToken, importUpload.single('file'), async (req, res) => {
  console.log('[Dept Import Route] Received file import request.');

  if (!req.file) {
    console.log('[Dept Import Route] No file uploaded.');
    return res.status(400).json({ code: 400, message: '没有文件被上传' });
  }

  console.log(`[Dept Import Route] Processing file: ${req.file.originalname}, Type: ${req.file.mimetype}, Size: ${req.file.size} bytes`);

  let rawData = [];
  const validationErrors = [];

  try {
    // 1. 解析文件 (Excel 或 CSV)
    if (req.file.mimetype.includes('spreadsheetml') || req.file.mimetype.includes('ms-excel')) {
      console.log('[Dept Import Route] Parsing Excel file...');
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      // *** 修正 header 映射，确保 description 对应 Excel 的第 5 列 ***
      rawData = xlsx.utils.sheet_to_json(sheet, { 
        header: ["dept_name", "manager", "member_count_ignored", "create_time_ignored", "description"], 
        range: 1, 
        rawNumbers: false // 保留此选项，以防万一
      });
      console.log(`[Dept Import Route] Parsed ${rawData.length} rows from Excel.`);
    } else if (req.file.mimetype === 'text/csv') {
      console.log('[Dept Import Route] Parsing CSV file...');
      const csvString = req.file.buffer.toString('utf-8');
      const parseResult = papaparse.parse(csvString, { header: true, skipEmptyLines: true });
      if (parseResult.errors.length > 0) {
          throw new Error(`CSV文件解析错误: ${parseResult.errors[0].message} (行: ${parseResult.errors[0].row})`);
      }
      // CSV 需要映射表头
      const headerMap = {
         '部门名称': 'dept_name',
         '部门主管': 'manager',
         '部门描述': 'description'
       };
       rawData = parseResult.data.map(row => {
           const newRow = {};
           for (const key in row) {
               if (headerMap[key.trim()]) {
                   newRow[headerMap[key.trim()]] = row[key];
               }
           }
           return newRow;
       });
      console.log(`[Dept Import Route] Parsed ${rawData.length} rows from CSV.`);
    } else {
      throw new Error('不支持的文件类型');
    }

    // 2. 验证数据
    console.log('[Dept Import Route] Validating data...');
    const deptsToInsert = [];
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const rowNum = i + 2; // Excel/CSV 行号 (假设有表头)
      const errorsInRow = [];

      if (!row.dept_name || String(row.dept_name).trim() === '') {
        errorsInRow.push('部门名称不能为空');
      }
       if (!row.manager || String(row.manager).trim() === '') {
        errorsInRow.push('部门主管不能为空');
      }
      // description 是可选的

      if (errorsInRow.length > 0) {
        validationErrors.push({ row: rowNum, errors: errorsInRow, rowData: row });
      } else {
        // *** 添加日志：检查解析后的原始行数据 ***
        console.log(`[Dept Import DEBUG] Row ${rowNum} raw data from parser:`, JSON.stringify(row)); 
        
        // 准备插入数据库的数据
        const deptToInsert = {
          dept_name: String(row.dept_name).trim(),
          manager: String(row.manager).trim(),
          description: row.description ? String(row.description).trim() : null
        };
        
        // *** 添加日志：检查准备传递给 Service 的数据 ***
        console.log(`[Dept Import DEBUG] Row ${rowNum} data prepared for service:`, JSON.stringify(deptToInsert)); 
        
        deptsToInsert.push(deptToInsert);
      }
    }

    // 3. 如果有验证错误，则返回
    if (validationErrors.length > 0) {
      console.warn(`[Dept Import Route] Validation failed for ${validationErrors.length} rows.`);
      return res.status(400).json({
        code: 400,
        message: `导入文件中存在 ${validationErrors.length} 条数据错误，请修正后重试`,
        data: { errors: validationErrors }
      });
    }

    // 4. 调用 Service 进行批量添加或更新
    const importResult = await deptService.batchAddDepts(deptsToInsert);
    console.log('[Dept Import Route] Service Result:', importResult);

    // 5. 构建响应
    if (importResult.success) {
      let message = `成功处理 ${importResult.processedCount} 条部门数据。`; // Use processedCount
      if (importResult.errors.length > 0) {
        message += ` 跳过 ${importResult.errors.length} 条错误数据。`;
        res.status(200).json({
          code: 200, 
          message: message,
          data: { errors: importResult.errors } // Send back errors for detailed feedback
        });
      } else {
        res.status(200).json({ code: 200, message: message });
      }
    } else {
      res.status(500).json({
        code: 500,
        message: '导入过程中发生数据库错误',
        data: { errors: importResult.errors }
      });
    }

  } catch (error) {
    console.error('[Dept Import Route] Error processing import file:', error);
    res.status(500).json({ code: 500, message: `部门导入处理失败: ${error.message}` });
  }
  // Note: No finally block to delete file as we use memoryStorage
});
// --- End Department Import Route ---

// 班级相关API
app.get(`${apiPrefix}/class/list`, async (req, res) => {
  try {
    console.log('收到班级列表请求, 参数:', req.query);
    const classes = await classService.getClassList(req.query);
    res.json({
      code: 200,
      message: '获取班级列表成功',
      data: classes
    });
  } catch (error) {
    console.error('获取班级列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取班级列表失败: ' + error.message,
      data: null
    });
  }
});

app.get(`${apiPrefix}/class/:id`, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`收到班级详情请求, ID: ${id}`);
    const classInfo = await classService.getClassDetail(id);
    
    if (!classInfo) {
      return res.status(404).json({
        code: 404,
        message: '班级不存在',
        data: null
      });
    }
    
    res.json({
      code: 200,
      message: '获取班级详情成功',
      data: classInfo
    });
  } catch (error) {
    console.error('获取班级详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取班级详情失败: ' + error.message,
      data: null
    });
  }
});

app.get(`${apiPrefix}/class/:id/students`, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`收到班级学生列表请求, 班级ID: ${id}`);
    const students = await classService.getStudentsInClass(id);
    
    res.json({
      code: 200,
      message: '获取班级学生列表成功',
      data: students
    });
  } catch (error) {
    console.error('获取班级学生列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取班级学生列表失败: ' + error.message,
      data: null
    });
  }
});

// 新增班级 (Apply middleware)
app.post(`${apiPrefix}/class/add`, authenticateToken, async (req, res) => {
  try {
    const classData = req.body;
    console.log('收到新增班级请求, 数据:', classData);

    // 注意：前端发送的是驼峰命名 (className)，后端服务需要下划线 (class_name)
    // 在这里进行转换或确保 classService.addClass 能处理
    // 假设 classService.addClass 期望下划线命名
    const backendClassData = {
        class_name: classData.className, // 转换
        teacher: classData.teacher,
        description: classData.description
    };

    // 调用 classService 中的 addClass 函数
    const newClass = await classService.addClass(backendClassData);
    // --- Add Logging ---
    logService.addLog({
      type: 'database',
      operation: '新增',
      content: `班级: 名称=${newClass?.class_name || '(未知)'}`,
      operator: req.user?.username || 'system'
    });
    // --- End Logging ---
    res.status(201).json({
      code: 201, // 201 Created
      message: '班级新增成功',
      data: newClass // 返回新增的班级信息（包含ID）
    });
  } catch (error) {
    console.error('新增班级失败:', error);
    const statusCode = error.message.includes('不能为空') || error.message.includes('已存在') ? 400 : 500;
    res.status(statusCode).json({
      code: statusCode,
      message: `新增班级失败: ${error.message}`,
      data: null
    });
  }
});

// 删除班级 (Apply middleware)
app.delete(`${apiPrefix}/class/:id`, authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ code: 400, message: '无效的班级ID' });
    }
    console.log(`收到删除班级请求, ID: ${id}`);

    // 调用 classService 中的 deleteClass 函数
    const deleteResult = await classService.deleteClass(id);

    if (deleteResult.success) {
      // --- Add Logging ---
      logService.addLog({
        type: 'database',
        operation: '删除',
        content: `班级: 名称=${deleteResult.class_name || '(ID: ' + id + ')'}`,
        operator: req.user?.username || 'system'
      });
      // --- End Logging ---
      res.json({ code: 200, message: '班级删除成功', data: null });
    } else {
      // 如果 service 返回 false，说明班级未找到
      res.status(404).json({ code: 404, message: '班级不存在', data: null });
    }
  } catch (error) {
    console.error(`删除班级失败 (ID: ${req.params.id}):`, error);
    // 可以根据错误类型返回不同状态码，例如外键约束错误返回 400
    const statusCode = error.message.includes('外键约束') ? 400 : 500;
    res.status(statusCode).json({
      code: statusCode,
      message: `删除班级失败: ${error.message}`,
      data: null
    });
  }
});

// 学生相关API
app.get(`${apiPrefix}/student/list`, async (req, res) => {
  try {
    console.log('收到学生列表请求, 参数:', req.query);
    const students = await studentService.getStudentList(req.query);
    res.json({
      code: 200,
      message: '获取学生列表成功',
      data: students
    });
  } catch (error) {
    console.error('获取学生列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取学生列表失败: ' + error.message,
      data: null
    });
  }
});

app.get(`${apiPrefix}/student/:id`, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`收到学生详情请求, ID: ${id}`);
    const student = await studentService.getStudentDetail(id);
    
    if (!student) {
      return res.status(404).json({
        code: 404,
        message: '学生不存在',
        data: null
      });
    }
    
    res.json({
      code: 200,
      message: '获取学生详情成功',
      data: student
    });
  } catch (error) {
    console.error('获取学生详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取学生详情失败: ' + error.message,
      data: null
    });
  }
});

app.post(`${apiPrefix}/student/add`, authenticateToken, async (req, res) => {
  try {
    console.log('收到添加学生请求, 数据:', req.body);
    const studentData = req.body;
    const newStudent = await studentService.addStudent(studentData);
    // --- Add Logging ---
    logService.addLog({
      type: 'database',
      operation: '新增',
      content: `学生: 学号=${newStudent?.student_id || '(未知)'}`,
      operator: req.user?.username || 'system'
    });
    // --- End Logging ---
    res.json({
      code: 200,
      message: '添加学生成功',
      data: newStudent
    });
  } catch (error) {
    console.error('添加学生失败:', error);
    res.status(500).json({
      code: 500,
      message: '添加学生失败: ' + error.message,
      data: null
    });
  }
});

app.put(`${apiPrefix}/student/:id`, authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`收到更新学生请求, ID: ${id}, 数据:`, req.body);
    const studentData = req.body;
    const updatedStudent = await studentService.updateStudent(id, studentData);
    // --- Add Logging ---
    logService.addLog({
      type: 'database',
      operation: '更新',
      content: `学生: ID=${id}`,
      operator: req.user?.username || 'system'
    });
    // --- End Logging ---
    res.json({
      code: 200,
      message: '更新学生成功',
      data: updatedStudent
    });
  } catch (error) {
    console.error('更新学生失败:', error);
    res.status(500).json({
      code: 500,
      message: '更新学生失败: ' + error.message,
      data: null
    });
  }
});

app.delete(`${apiPrefix}/student/:id`, authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`收到删除学生请求, ID: ${id}`);
    const deleteResult = await studentService.deleteStudent(id);
    
    if (!deleteResult.success) {
      return res.status(404).json({
        code: 404,
        message: '学生不存在或删除失败', 
        data: null
      });
    }
    
    logService.addLog({
      type: 'database',
      operation: '删除',
      content: `学生: 学号=${deleteResult.student_id_str || '(ID: ' + id + ')'}`,
      operator: req.user?.username || 'system'
    });
    
    res.json({
      code: 200,
      message: '删除学生成功',
      data: null
    });
  } catch (error) {
    console.error('删除学生失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除学生失败: ' + error.message,
      data: null
    });
  }
});

app.delete(`${apiPrefix}/student/batch`, authenticateToken, async (req, res) => {
  try {
    console.log('收到批量删除学生请求, 数据:', req.body);
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '无效的学生ID列表',
        data: null
      });
    }
    
    const success = await studentService.batchDeleteStudent(ids);
    
    logService.addLog({
      type: 'database',
      operation: '批量删除',
      content: `学生: IDs=${ids.join(', ')}`,
      operator: req.user?.username || 'system'
    });
    res.json({
      code: 200,
      message: '批量删除学生成功',
      data: null
    });
  } catch (error) {
    console.error('批量删除学生失败:', error);
    res.status(500).json({
      code: 500,
      message: '批量删除学生失败: ' + error.message,
      data: null
    });
  }
});

app.get(`${apiPrefix}/student/stats`, async (req, res) => {
  try {
    console.log('收到学生统计数据请求');
    const stats = await studentService.getStudentStats();
    
    res.json({
      code: 200,
      message: '获取学生统计数据成功',
      data: stats
    });
  } catch (error) {
    console.error('获取学生统计数据失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取学生统计数据失败: ' + error.message,
      data: null
    });
  }
});

app.get(`${apiPrefix}/student/max-id`, async (req, res) => {
  try {
    console.log('收到获取最大学生ID请求');
    const maxId = await studentService.getMaxStudentId();
    
    res.json({
      code: 200,
      message: '获取最大学生ID成功',
      data: maxId
    });
  } catch (error) {
    console.error('获取最大学生ID失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取最大学生ID失败: ' + error.message,
      data: null
    });
  }
});

// 测试成绩API连接
app.get(`${apiPrefix}/score/test`, (req, res) => {
  console.log('成绩API连接测试');
  // Return standard format with code, data, and message
  res.json({ 
    code: 200,
    data: true, // Indicate success within the data field
    message: 'Score API connection successful'
    // timestamp is no longer needed here as it's not standard
  });
});

// 获取考试类型列表
app.get(`${apiPrefix}/score/exam-types`, async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT exam_type 
      FROM exam 
      WHERE exam_type IS NOT NULL AND exam_type != '' 
      ORDER BY exam_type
    `;
    const result = await db.query(query);
    const rows = Array.isArray(result) ? (Array.isArray(result[0]) ? result[0] : result) : [];
    
    if (!Array.isArray(rows)) {
      console.error('获取考试类型列表失败: 数据库返回格式不正确', rows);
      return res.status(500).json({ 
        code: 500,
        message: '获取考试类型列表失败: 数据库返回格式不正确'
      });
    }

    const examTypes = rows.map(t => t.exam_type);
    
    console.log('获取考试类型列表成功');
    res.json({ 
      code: 200,
      message: '获取考试类型列表成功', 
      data: examTypes 
    });
  } catch (error) {
    console.error('获取考试类型列表失败:', error);
    res.status(500).json({ 
      code: 500,
      message: `获取考试类型列表失败: ${error.message}`
    });
  }
});

// 根据考试类型获取考试列表
app.get(`${apiPrefix}/score/exams`, async (req, res) => {
  try {
    const { examType } = req.query;
    
    if (!examType) {
      return res.status(400).json({ 
        code: 400,
        message: '考试类型不能为空' 
      });
    }
    
    const query = `
      SELECT id, exam_name, exam_date, status 
      FROM exam 
      WHERE exam_type = ? 
      ORDER BY exam_date DESC
    `;
    
    const exams = await db.query(query, [examType]); 
        
    console.log(`获取考试类型 ${examType} 的考试列表成功，共 ${exams.length} 条记录`);
    res.json({ 
      code: 200,
      message: '获取成功',
      data: exams
    });
  } catch (error) {
    console.error('获取考试列表失败:', error);
    res.status(500).json({ 
      code: 500,
      message: `获取考试列表失败: ${error.message}`
    });
  }
});

// 获取学生成绩（支持两种查询方式：考试ID或考试类型）
app.get(`${apiPrefix}/score/student/:id`, async (req, res) => {
  try {
    const studentId = req.params.id;
    const { examId, examType } = req.query;
    
    let result = null;
    
    if (examId) {
      // 按考试ID查询
      console.log(`按考试ID查询学生 ${studentId} 的成绩`);
      result = await scoreService.getStudentScoreByExamId(studentId, examId);
    } else if (examType) {
      // 按考试类型查询（兼容旧接口）
      console.log(`按考试类型查询学生 ${studentId} 的成绩`);
      result = await scoreService.getStudentScore(studentId, examType);
    } else {
      return res.status(400).json({ 
        code: 400,
        message: '请提供考试ID或考试类型' 
      });
    }
    
    if (!result) {
      return res.status(404).json({ 
        code: 404,
        message: '未找到学生成绩记录' 
      });
    }
    
    res.json({ 
      code: 200,
      message: '获取成功',
      data: result 
    });
  } catch (error) {
    console.error('获取学生成绩失败:', error);
    res.status(500).json({ 
      code: 500,
      message: `获取学生成绩失败: ${error.message}`
    });
  }
});

// 保存学生成绩 (Apply middleware)
app.post(`${apiPrefix}/score/save`, authenticateToken, async (req, res) => {
  try {
    const requestData = req.body;

    // --- Convert relevant keys from camelCase (frontend) to snake_case (backend/service) ---
    const backendData = {
      student_id: requestData.studentId, 
      exam_id: requestData.examId,
      exam_type: requestData.examType, // Keep examType if service uses it
      ...requestData.scores // Spread the scores object directly
    };

    // --- Validate using the converted snake_case keys ---
    if (!backendData || !backendData.student_id || !backendData.exam_id) {
      return res.status(400).json({ 
        code: 400,
        message: '学生ID和考试ID不能为空' 
      });
    }

    console.log(`保存学生ID: ${backendData.student_id}, 考试ID: ${backendData.exam_id} 的成绩`);
    
    // --- Call service with the converted snake_case data ---
    const result = await scoreService.saveStudentScore(backendData); 
    
    if (!result) {
      throw new Error('保存操作未成功完成，请检查服务日志'); 
    }

    // --- Logging (uses snake_case keys from backendData) ---
    logService.addLog({
      type: 'database',
      operation: '保存',
      content: `学生成绩: 学生ID=${backendData.student_id}, 考试ID=${backendData.exam_id}`,
      operator: req.user?.username || 'system'
    });
    // --- End Logging ---

    res.json({ 
      code: 200, 
      message: '保存学生成绩成功',
      success: true 
    });

  } catch (error) {
    console.error('保存学生成绩失败:', error);
    const statusCode = error.message.includes('不能为空') || error.message.includes('未找到') ? 400 : 500; 
    res.status(statusCode).json({ 
      code: statusCode,
      message: `保存学生成绩失败: ${error.message}`,
      success: false
    });
  }
});

app.get(`${apiPrefix}/score/subjects`, (req, res) => {
  res.json({
    code: 200,
    data: ['语文', '数学', '英语', '物理', '化学', '生物'],
    message: 'success'
  });
});

// 获取成绩统计数据
app.get(`${apiPrefix}/score/stats`, async (req, res) => {
  try {
    const stats = await scoreService.getScoreStats();
    res.json({
      code: 200,
      message: '获取成绩统计数据成功',
      data: stats
    });
  } catch (error) {
    console.error('获取成绩统计数据失败:', error);
    res.status(500).json({
      code: 500,
      message: `获取成绩统计数据失败: ${error.message}`
    });
  }
});

// 获取学生成绩详细统计
app.get(`${apiPrefix}/score/student-stats`, async (req, res) => {
  try {
    const params = {
      studentId: req.query.studentId ? parseInt(req.query.studentId) : undefined,
      examId: req.query.examId ? parseInt(req.query.examId) : undefined,
      classId: req.query.classId ? parseInt(req.query.classId) : undefined,
      examType: req.query.examType,
      subject: req.query.subject
    };
    
    console.log('获取学生成绩详细统计, 参数:', params);
    
    const stats = await scoreService.getStudentScoreStats(params);
    res.json({
      code: 200,
      message: '获取学生成绩详细统计成功',
      data: stats
    });
  } catch (error) {
    console.error('获取学生成绩详细统计失败:', error);
    res.status(500).json({
      code: 500,
      message: `获取学生成绩详细统计失败: ${error.message}`
    });
  }
});

// 获取学生成绩汇总
app.get(`${apiPrefix}/score/student-summary`, async (req, res) => {
  try {
    const params = {
      studentId: req.query.studentId ? parseInt(req.query.studentId) : undefined,
      examId: req.query.examId ? parseInt(req.query.examId) : undefined,
      studentNumber: req.query.studentNumber,
      examType: req.query.examType
    };
    
    console.log('获取学生成绩汇总, 参数:', params);
    
    const summary = await scoreService.getStudentScoreSummary(params);
    res.json({
      code: 200,
      message: '获取学生成绩汇总成功',
      data: summary
    });
  } catch (error) {
    console.error('获取学生成绩汇总失败:', error);
    res.status(500).json({
      code: 500,
      message: `获取学生成绩汇总失败: ${error.message}`
    });
  }
});

// 获取班级成绩统计
app.get(`${apiPrefix}/score/class-stats`, async (req, res) => {
  try {
    const params = {
      classId: req.query.classId ? parseInt(req.query.classId) : undefined,
      examId: req.query.examId ? parseInt(req.query.examId) : undefined,
      examType: req.query.examType,
      subject: req.query.subject
    };
    
    console.log('获取班级成绩统计, 参数:', params);
    
    const stats = await scoreService.getClassScoreStats(params);
    res.json({
      code: 200,
      message: '获取班级成绩统计成功',
      data: stats
    });
  } catch (error) {
    console.error('获取班级成绩统计失败:', error);
    res.status(500).json({
      code: 500,
      message: `获取班级成绩统计失败: ${error.message}`
    });
  }
});

// 添加自动创建考试记录的API
app.post(`${apiPrefix}/exam/create-if-not-exists`, async (req, res) => {
  try {
    const { examType } = req.body;
    
    if (!examType) {
      return res.status(400).json({
        code: 400,
        message: '请求参数错误：缺少考试类型',
        data: null
      });
    }
    
    // 检查是否已存在对应类型的考试
    const findExamQuery = `
      SELECT id FROM exam
      WHERE exam_type = ?
      ORDER BY exam_date DESC
      LIMIT 1
    `;
    
    const findExamResult = await db.query(findExamQuery, [examType]);
    
    if (findExamResult.length > 0) {
      // 已存在对应考试记录，直接返回
      return res.json({
        code: 200,
        data: {
          id: findExamResult[0].id,
          isNewCreated: false
        },
        message: `${examType}考试记录已存在`
      });
    }
    
    // 不存在，创建新的考试记录
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const semester = currentMonth >= 2 && currentMonth <= 7 ? '春季' : '秋季';
    const examName = `${currentYear}年${semester}${examType}考试`;
    
    const examDate = new Date();
    let subjects = '语文,数学,英语,物理,化学,生物';
    let duration = 120;
    
    if (examType === '期中' || examType === '期末') {
      duration = 180;
    }
    
    const insertExamQuery = `
      INSERT INTO exam (
        exam_name, exam_type, exam_date, duration, subjects, status
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const insertResult = await db.query(insertExamQuery, [
      examName,
      examType,
      examDate,
      duration,
      subjects,
      0 // 状态：未开始
    ]);
    
    if (insertResult.insertId) {
      // 自动添加所有班级关联
      const classQuery = 'SELECT id FROM class';
      const classes = await db.query(classQuery);
      
      if (classes.length > 0) {
        const examClassValues = classes.map(classItem => [insertResult.insertId, classItem.id]);
        
        const insertExamClassQuery = `
          INSERT INTO exam_class (exam_id, class_id)
          VALUES ?
        `;
        
        await db.query(insertExamClassQuery, [examClassValues]);
      }
      
      res.json({
        code: 200,
        data: {
          id: insertResult.insertId,
          examName,
          examType,
          examDate,
          isNewCreated: true
        },
        message: `成功创建${examType}考试记录`
      });
    } else {
      throw new Error('创建考试记录失败');
    }
  } catch (error) {
    console.error('创建考试记录失败:', error);
    res.status(500).json({
      code: 500,
      message: `创建考试记录失败: ${error.message}`,
      data: null
    });
  }
});

// --- Log Management API Routes ---

// 获取日志列表
app.get(`${apiPrefix}/log/list`, async (req, res) => {
  try {
    console.log('收到日志列表请求, 参数:', req.query);
    const logs = await logService.getLogs(req.query);
    res.json({
      code: 200,
      message: '获取日志列表成功',
      data: logs
    });
  } catch (error) {
    // Error already logged in service
    res.status(500).json({
      code: 500,
      message: '获取日志列表失败: ' + error.message,
      data: null
    });
  }
});

// 批量删除日志 (Apply middleware)
app.delete(`${apiPrefix}/log/batch`, authenticateToken, async (req, res) => {
  try {
    const { ids } = req.body;
    console.log('收到批量删除日志请求, IDs:', ids);
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '无效的日志ID列表'
      });
    }
    const deletedCount = await logService.batchDeleteLog(ids);
    // --- Add Logging ---
    logService.addLog({
        type: 'system',
        operation: '批量删除',
        content: `日志: 数量=${deletedCount}`,
        operator: req.user?.username || 'system'
    });
    // --- End Logging ---
    res.json({
      code: 200,
      message: `批量删除日志成功, 删除了 ${deletedCount} 条记录`,
      data: { deletedCount }
    });
  } catch (error) {
    // Error already logged in service
    res.status(500).json({
      code: 500,
      message: '批量删除日志失败: ' + error.message,
      data: null
    });
  }
});

// 清空日志 (Apply middleware)
app.delete(`${apiPrefix}/log/clear`, authenticateToken, async (req, res) => {
  try {
    console.log('收到清空日志请求');
    await logService.clearLogs();
    // --- Add Logging ---
    logService.addLog({
        type: 'system',
        operation: '清空',
        content: `系统日志`,
        operator: req.user?.username || 'system'
    });
    // --- End Logging ---
    res.json({
      code: 200,
      message: '清空日志成功',
      data: null
    });
  } catch (error) {
    // Error already logged in service
    res.status(500).json({
      code: 500,
      message: '清空日志失败: ' + error.message,
      data: null
    });
  }
});

// --- Socket.IO Connection Handling ---
io.on('connection', (socket) => {
  console.log(`Socket.IO: 客户端已连接: ${socket.id}`);

  // Example: Send a welcome message
  // socket.emit('message', 'Welcome to the log stream!');

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`Socket.IO: 客户端断开连接: ${socket.id}, 原因: ${reason}`);
    // Optional: Log disconnection to database
    // logService.addLog({ type: 'system', operation: 'DISCONNECT', content: `Client disconnected: ${socket.id}`, operator: 'system' });
  });

  // Handle potential errors on the socket
  socket.on('error', (error) => {
    console.error(`Socket.IO Error on socket ${socket.id}:`, error);
  });
});

// 启动服务器 (Use httpServer.listen)
async function startServer() {
  try {
    const dbConnected = await db.testConnection();
    if (!dbConnected) {
      console.error('无法连接到数据库，服务器启动失败');
      process.exit(1);
    }

    const { port, host } = config.server;
    httpServer.listen(port, host, () => { // Use httpServer.listen
      console.log(`服务器已启动 (HTTP + WebSocket)，监听 ${host}:${port}`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});

// --- Login Route --- 
app.post(`${apiPrefix}/user/login`, async (req, res) => {
  const { username, password } = req.body;
  console.log(`[Login Route] Attempting login for username: ${username}`);
  try {
    // 1. Find user by username
    const user = await userService.findUserByUsername(username);
    if (!user) {
      console.log(`[Login Route] User not found: ${username}`);
      return res.status(401).json({ code: 401, message: '用户名或密码错误', data: null });
    }
    console.log(`[Login Route] User found: ${username}, ID: ${user.id}`);

    // 2. Compare password
    const passwordMatch = await userService.comparePassword(password, user.password);
    if (!passwordMatch) {
      console.log(`[Login Route] Password mismatch for user: ${username}`);
      return res.status(401).json({ code: 401, message: '用户名或密码错误', data: null });
    }
    console.log(`[Login Route] Password matched for user: ${username}`);

    // 3. Generate JWT
    // IMPORTANT: Customize payload as needed. Avoid putting sensitive info here.
    const payload = {
      id: user.id,
      username: user.username,
      // Add roles/permissions if needed, but keep payload small
      // roles: user.roles, 
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: config.jwt.expiresIn || '1h' });
    console.log(`[Login Route] JWT generated for user: ${username}`);

    // 4. Prepare response user info (omit password)
    const { password: _, ...safeUserInfo } = user;

    // 5. Send response
    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token: token,
        user: safeUserInfo // Send user info without password
      }
    });

  } catch (error) {
    console.error(`[Login Route] Error during login for ${username}:`, error);
    res.status(500).json({ code: 500, message: '登录过程中发生错误', data: null });
  }
});

// 获取用户信息 (GET /api/user/info)
app.get(`${apiPrefix}/user/info`, authenticateToken, async (req, res) => {
  try {
    // Get user ID from the decoded token attached by the middleware
    const userId = req.user?.id; // Use optional chaining

    if (!userId) {
      console.error('[User Info Route] User ID not found in token payload');
      return res.status(403).json({ code: 403, message: '无法从Token中获取用户ID' });
    }

    console.log(`[User Info Route] Getting info for user ID: ${userId}`);
    // Call userService to find user by ID
    const userInfo = await userService.findUserById(userId);

    if (userInfo) {
      console.log(`[User Info Route] User info found:`, userInfo);
      // IMPORTANT: Omit password before sending back to client
      const { password, ...safeUserInfo } = userInfo;
      res.json({ code: 200, data: safeUserInfo, message: '获取成功' });
    } else {
      console.warn(`[User Info Route] User not found for ID: ${userId}`);
      res.status(404).json({ code: 404, message: '用户不存在' });
    }
  } catch (error) {
    console.error('[User Info Route] Error getting user info:', error);
    res.status(500).json({ code: 500, message: '获取用户信息失败' });
  }
});

// 更新用户信息 (PUT /api/user/info) - 确保 authenticateToken 应用
app.put(`${apiPrefix}/user/info`, authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(403).json({ code: 403, message: '无法从Token中获取用户ID' });
    }

    const updateData = req.body; // e.g., { email: 'new@example.com' }
    console.log(`[Update User Info Route] Attempting update for user ID: ${userId}, data:`, updateData);

    // Filter out disallowed fields (e.g., cannot update ID, username, password via this route)
    const allowedUpdates = {};
    if (updateData.hasOwnProperty('email')) {
      allowedUpdates.email = updateData.email;
    }
    // Add other allowed fields here if necessary
    // if (updateData.hasOwnProperty('some_other_field')) { ... }

    if (Object.keys(allowedUpdates).length === 0) {
      return res.status(400).json({ code: 400, message: '没有提供有效的更新字段' });
    }

    // Validate email format if email is being updated
    if (allowedUpdates.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(allowedUpdates.email)) {
            return res.status(400).json({ code: 400, message: '无效的邮箱格式' });
        }
        // Consider adding uniqueness check here too if userService doesn't handle it
    }

    const success = await userService.updateUser(userId, allowedUpdates);

    if (success) {
      console.log(`[Update User Info Route] Update successful for user ID: ${userId}`);
      res.json({ code: 200, message: '用户信息更新成功' });
    } else {
      console.warn(`[Update User Info Route] Update failed for user ID: ${userId}`);
      // Could be user not found or no changes made
      res.status(400).json({ code: 400, message: '用户信息更新失败' }); 
    }

  } catch (error) {
    console.error('[Update User Info Route] Error updating user info:', error);
    // Send back specific validation errors if available (e.g., from userService)
    res.status(500).json({ code: 500, message: error.message || '更新用户信息时发生错误' });
  }
});

// --- Multer Configuration for Avatar Uploads ---
const avatarUploadDir = path.join(__dirname, 'uploads', 'avatars');

// Ensure the avatar directory exists
if (!fs.existsSync(avatarUploadDir)){
    fs.mkdirSync(avatarUploadDir, { recursive: true });
    console.log(`Created avatar upload directory: ${avatarUploadDir}`);
}

const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, avatarUploadDir); // Save avatars to uploads/avatars
  },
  filename: function (req, file, cb) {
    // Generate a unique filename (e.g., user-<id>-timestamp.<ext>)
    // We need the user ID, so we'll rely on authenticateToken middleware
    const userId = req.user?.id || 'unknown'; 
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `user-${userId}-${uniqueSuffix}${extension}`);
  }
});

// File filter to accept only images
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('仅支持上传图片文件!'), false);
  }
};

const uploadAvatarMiddleware = multer({
  storage: avatarStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB file size limit
}).single('file'); // *** IMPORTANT: Expect a single file with field name 'file' ***

// --- Avatar Upload Route --- 
app.post(`${apiPrefix}/user/avatar`, authenticateToken, (req, res) => {
  // Use the configured multer middleware first
  uploadAvatarMiddleware(req, res, async (err) => {
    // Handle Multer errors (e.g., file size limit, wrong file type)
    if (err instanceof multer.MulterError) {
      console.error('[Avatar Upload] Multer error:', err);
      let message = '上传头像时发生错误';
      if (err.code === 'LIMIT_FILE_SIZE') {
        message = '文件过大，请上传小于 5MB 的图片';
      }
      return res.status(400).json({ code: 400, message: message });
    } else if (err) {
      // Handle other errors (e.g., file filter error)
      console.error('[Avatar Upload] Other upload error:', err);
      return res.status(400).json({ code: 400, message: err.message || '上传头像失败' });
    }

    // --- File should be uploaded at this point --- 
    if (!req.file) {
      console.error('[Avatar Upload] No file received after Multer middleware.');
      return res.status(400).json({ code: 400, message: '未检测到上传的文件' });
    }
    
    // --- Check authentication AFTER Multer --- 
    if (!req.user || !req.user.id) {
        console.error('[Avatar Upload] User not authenticated after file upload.');
        // Optional: Delete the uploaded file if user is not authenticated
        fs.unlink(req.file.path, (unlinkErr) => {
            if (unlinkErr) console.error("[Avatar Upload] Failed to delete orphaned file:", unlinkErr);
        });
        return res.status(401).json({ code: 401, message: '用户未认证，无法上传头像' });
    }

    // --- Construct the URL --- 
    // The URL should be relative to the server's root if served statically
    // Example: /uploads/avatars/user-1-1678886400000-123456789.png
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // --- Update user's avatar URL in the database --- 
    try {
      const userId = req.user.id;
      const success = await userService.updateUser(userId, { avatar: avatarUrl });

      if (!success) {
        // Should not happen if user is authenticated, but handle defensively
         fs.unlink(req.file.path, (unlinkErr) => {
            if (unlinkErr) console.error("[Avatar Upload] Failed to delete file after DB update fail:", unlinkErr);
        });
        return res.status(404).json({ code: 404, message: '用户不存在或更新头像失败' });
      }

      // --- Log the successful update --- 
       logService.addLog({
          type: 'database',
          operation: '更新',
          content: `用户资料: ID=${userId}, 更新头像为 ${avatarUrl}`,
          operator: req.user?.username || 'system'
      });
      
      // --- Send success response --- 
      console.log(`[Avatar Upload] User ${userId} avatar updated to: ${avatarUrl}`);
      res.json({
        code: 200,
        message: '头像上传成功',
        data: { avatarUrl: avatarUrl } // Send back the new URL
      });

    } catch (dbError) {
      console.error('[Avatar Upload] Database update failed:', dbError);
      // Attempt to delete the uploaded file if DB update fails
       fs.unlink(req.file.path, (unlinkErr) => {
            if (unlinkErr) console.error("[Avatar Upload] Failed to delete file after DB error:", unlinkErr);
        });
      res.status(500).json({ code: 500, message: '更新用户头像信息失败' });
    }
  });
});
// --- End Avatar Upload Route --- 

// --- Restoring Employee Import Route (Moved Here) ---
// --- 员工导入路由 ---
// POST /api/employee/import
app.post(`${apiPrefix}/employee/import`, authenticateToken, importUpload.single('file'), async (req, res) => {
  console.log('[Import Route] Received file import request.');

  if (!req.file) {
    console.log('[Import Route] No file uploaded.');
    return res.status(400).json({ code: 400, message: '没有文件被上传' });
  }

  console.log(`[Import Route] Processing file: ${req.file.originalname}, Type: ${req.file.mimetype}, Size: ${req.file.size} bytes`);

  let rawData = [];
  const validationErrors = [];

  try {
    // 1. 解析文件
    if (req.file.mimetype.includes('spreadsheetml') || req.file.mimetype.includes('ms-excel')) {
      // --- 解析 Excel ---
      console.log('[Import Route] Parsing Excel file...');
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer', cellDates: true }); // cellDates: true 尝试解析日期
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      // header: 1 生成数组的数组，更易于映射和验证
      // header: 'A' 会使用列字母做键
      // 默认行为会尝试使用第一行作为 header
       rawData = xlsx.utils.sheet_to_json(sheet, {
         header: ["empId", "name", "gender", "age", "position", "deptName", "salary", "status", "phone", "email", "joinDate"], // 指定预期的列头（与前端对应）
         range: 1 // 跳过标题行 (假设第一行是标题)
         // defval: '' // 可以给空单元格设置默认值
       });
       console.log(`[Import Route] Parsed ${rawData.length} rows from Excel.`);

    } else if (req.file.mimetype === 'text/csv') {
      // --- 解析 CSV ---
      console.log('[Import Route] Parsing CSV file...');
      const csvString = req.file.buffer.toString('utf-8');
      const parseResult = papaparse.parse(csvString, {
        header: true, // 使用第一行作为 header
        skipEmptyLines: true,
        transformHeader: header => header.trim(), // 清理 header 空格
        // dynamicTyping: true // 自动转换类型，但可能不准确，手动验证更好
      });

      if (parseResult.errors.length > 0) {
          console.error('[Import Route] CSV parsing errors:', parseResult.errors);
          // 只取第一个错误信息返回
          throw new Error(`CSV文件解析错误: ${parseResult.errors[0].message} (行: ${parseResult.errors[0].row})`);
      }
      rawData = parseResult.data;
       // 需要将 CSV header 映射到我们的标准字段名
       const headerMap = {
         '工号': 'empId',
         '姓名': 'name',
         '性别': 'gender',
         '年龄': 'age',
         '职位': 'position',
         '所属部门': 'deptName',
         '薪资': 'salary',
         '状态': 'status',
         '联系电话': 'phone',
         '邮箱': 'email',
         '入职时间': 'joinDate'
       };
       rawData = rawData.map(row => {
           const newRow = {};
           for (const key in row) {
               if (headerMap[key.trim()]) {
                   newRow[headerMap[key.trim()]] = row[key];
               }
           }
           return newRow;
       });
      console.log(`[Import Route] Parsed ${rawData.length} rows from CSV.`);
    } else {
      // Should have been caught by fileFilter, but double-check
      throw new Error('不支持的文件类型');
    }

    // 2. 验证和转换数据
    console.log('[Import Route] Validating and transforming data...');
    const employeesToInsert = [];
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const rowNum = i + 2; // 假设第一行是标题行，数据从第二行开始
      const errorsInRow = [];

      // --- 字段存在性和基本类型验证 ---
      if (!row.empId) errorsInRow.push('工号不能为空');
      if (!row.name) errorsInRow.push('姓名不能为空');
      if (!row.gender) errorsInRow.push('性别不能为空');
      if (row.age === undefined || row.age === null) errorsInRow.push('年龄不能为空');
      if (!row.position) errorsInRow.push('职位不能为空');
      if (!row.deptName) errorsInRow.push('所属部门不能为空'); // 部门存在性由 service 检查
      if (row.salary === undefined || row.salary === null) errorsInRow.push('薪资不能为空');
      if (!row.status) errorsInRow.push('状态不能为空');
      if (!row.joinDate) errorsInRow.push('入职时间不能为空');

      // --- 特定值验证 ---
      if (row.gender && !['男', '女'].includes(row.gender)) errorsInRow.push('性别必须是 "男" 或 "女"');
      if (row.status && !['在职', '离职', '休假'].includes(row.status)) errorsInRow.push('状态必须是 "在职", "离职" 或 "休假"');
      const ageNum = Number(row.age);
      if (isNaN(ageNum) || ageNum < 18 || ageNum > 65) errorsInRow.push('年龄必须是 18 到 65 之间的数字');
      const salaryNum = Number(row.salary);
      if (isNaN(salaryNum) || salaryNum < 0) errorsInRow.push('薪资必须是大于等于 0 的数字');

      // --- 日期处理 ---
      let formattedJoinDate = null;
      if (row.joinDate) {
        try {
           // 尝试将各种格式（包括Excel日期序列号）转换为 JS Date 对象
           const date = (typeof row.joinDate === 'number')
             ? xlsx.SSF.parse_date_code(row.joinDate) // Excel 日期序列号
             : new Date(row.joinDate);

           if (isNaN(date.getTime())) { // 检查是否是无效日期
             errorsInRow.push('入职时间格式无效');
           } else {
             // 格式化为 YYYY-MM-DD
             formattedJoinDate = date.toISOString().split('T')[0];
           }
        } catch (dateError) {
          errorsInRow.push('入职时间格式无效');
        }
      } else {
        // joinDate is required, error already added above
      }

      // --- 邮箱和电话格式 (可选) ---
      if (row.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(row.email)) errorsInRow.push('邮箱格式不正确');
      // if (row.phone && !/^1[3-9]\d{9}$/.test(row.phone)) errorsInRow.push('电话号码格式不正确');

      if (errorsInRow.length > 0) {
        validationErrors.push({ row: rowNum, errors: errorsInRow, rowData: row });
      } else {
        // 验证通过，准备插入数据库的数据
        employeesToInsert.push({
          emp_id: String(row.empId).trim(),
          name: String(row.name).trim(),
          gender: row.gender,
          age: ageNum,
          position: String(row.position).trim(),
          deptName: String(row.deptName).trim(), // 传递部门名称给 service
          salary: salaryNum,
          status: row.status,
          phone: row.phone ? String(row.phone).trim() : null,
          email: row.email ? String(row.email).trim() : null,
          join_date: formattedJoinDate // 使用格式化后的日期
        });
      }
    }

    // 3. 如果有验证错误，则返回
    if (validationErrors.length > 0) {
      console.warn(`[Import Route] Validation failed for ${validationErrors.length} rows.`);
      return res.status(400).json({
        code: 400,
        message: `导入文件中存在 ${validationErrors.length} 条数据错误，请修正后重试`,
        data: { errors: validationErrors } // 将详细错误返回给前端
      });
    }

    // 4. 调用 Service 进行批量添加
    console.log(`[Import Route] Validation passed for ${employeesToInsert.length} rows. Calling batchAddEmployees...`);
    const importResult = await employeeService.batchAddEmployees(employeesToInsert);
    console.log('[Import Route] Batch add result:', importResult);

    // 5. 根据 Service 返回结果响应前端
    if (importResult.success) {
      let message = `成功导入 ${importResult.addedCount} 条员工数据。`;
      if (importResult.errors.length > 0) {
        message += ` 跳过了 ${importResult.errors.length} 条数据（例如部门不存在）。`;
        // 可以选择是否将 service 层的错误也返回给前端
         return res.status(200).json({
            code: 200,
            message: message,
            data: { errors: importResult.errors } // 返回部门不存在等错误
        });
      }
       res.status(200).json({ code: 200, message: message });
    } else {
      // 如果 service 层面整体失败 (例如数据库连接问题)
      res.status(500).json({
        code: 500,
        message: '导入过程中发生数据库错误',
        data: { errors: importResult.errors } // 返回 service 层的错误
      });
    }

  } catch (error) {
    console.error('[Import Route] Error processing import file:', error);
    res.status(500).json({ code: 500, message: `导入处理失败: ${error.message}` });
  } finally {
     // 如果需要，可以在这里清理上传的文件
     // if (req.file && req.file.path) {
     //   fs.unlink(req.file.path, (err) => {
     //     if (err) console.error(`[Import Route] Error deleting temp file ${req.file.path}:`, err);
     //     else console.log(`[Import Route] Deleted temp file ${req.file.path}`);
     //   });
     // }
  }
});
// --- End Employee Import Route ---

// ... (Restored export route definition) ...