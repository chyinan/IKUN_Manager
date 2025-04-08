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

// 错误处理中间件
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
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    console.log('[Auth] No token provided.');
    // Return 401 Unauthorized if no token is provided for a protected route
    return res.status(401).json({ code: 401, message: '用户未认证，请求需要Token' });
  }

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
      return res.status(403).json({ code: 403, message: message });
    }
    // Token is valid, attach decoded payload (user info) to request
    req.user = decoded; // decoded payload usually contains user id, username, etc.
    console.log(`[Auth] Token verified successfully. User ID: ${req.user?.id}, Username: ${req.user?.username}`); // Log user ID and username
    next(); // Proceed to the next middleware/route handler ONLY if token is valid
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
app.get('/api/employee/list', async (req, res) => {
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

app.get('/api/employee/:id', async (req, res) => {
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
  console.log(`[Login Route] Received login attempt for username: ${username}, Password provided: ${password ? 'Yes' : 'No'}`); // Log received data (don't log password value)

  if (!username || !password) {
    console.log('[Login Route] Username or password missing in request body.');
    return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
  }

  try {
    // 1. Find user by username
    const user = await userService.findUserByUsername(username);
    if (!user) {
      console.log(`[Login Route] Authentication failed: User '${username}' not found.`);
      return res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }

    // 2. Compare password
    console.log(`[Login Route] Comparing password for user: ${username}`);
    const isPasswordValid = await userService.comparePassword(password, user.password);
    if (!isPasswordValid) {
      console.log(`[Login Route] Authentication failed: Password mismatch for user '${username}'.`);
      return res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }
    
    console.log(`[Login Route] Authentication successful for user: ${username}`);

    // 3. Generate JWT 
    // Include essential, non-sensitive user info in the payload
    const payload = {
      id: user.id,
      username: user.username,
      // Add roles or other permissions if applicable
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }); // Token expires in 1 hour
    console.log(`[Login Route] JWT generated for user: ${username}`);

    // 4. Send token and user info (excluding password)
    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
          // Include other relevant user details here
        }
      }
    });

  } catch (error) {
    console.error(`[Login Route] Error during login process for user '${username}':`, error);
    res.status(500).json({ code: 500, message: '登录失败，服务器内部错误' });
  }
}); 

// 新增：修改密码路由 (Apply middleware for authentication)
app.post(`${apiPrefix}/user/update-password`, authenticateToken, async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  const userId = req.user?.id; // Get user ID from authenticated token

  console.log(`[Update Password Route] Received request for user ID: ${userId}`);

  // Basic validation
  if (!userId) {
    console.error('[Update Password Route] Error: User ID not found in token.');
    return res.status(401).json({ code: 401, message: '用户未登录或认证无效' });
  }
  if (!oldPassword || !newPassword || !confirmPassword) {
    console.log('[Update Password Route] Validation failed: Missing fields.');
    return res.status(400).json({ code: 400, message: '所有密码字段不能为空' });
  }
  if (newPassword !== confirmPassword) {
    console.log('[Update Password Route] Validation failed: New passwords do not match.');
    return res.status(400).json({ code: 400, message: '新密码和确认密码不一致' });
  }
  if (newPassword.length < 6) { // Basic length check
      console.log('[Update Password Route] Validation failed: New password too short.');
      return res.status(400).json({ code: 400, message: '新密码长度不能少于6位' });
  }

  try {
    // 1. Find user by ID (more secure than using username from request body)
    const user = await userService.findUserById(userId); // Assume userService has findUserById
    if (!user) {
      console.log(`[Update Password Route] Error: User with ID ${userId} not found.`);
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }

    // 2. Compare old password
    console.log(`[Update Password Route] Comparing old password for user ID: ${userId}`);
    const isOldPasswordValid = await userService.comparePassword(oldPassword, user.password);
    if (!isOldPasswordValid) {
      console.log(`[Update Password Route] Failed: Old password incorrect for user ID: ${userId}.`);
      return res.status(400).json({ code: 400, message: '原密码错误' }); 
      // --- Add diagnostic log --- 
      console.log('!!! CRITICAL: Code continued after sending 400 response for incorrect old password! !!!'); 
    }

    // If the code reaches here, old password MUST be valid
    console.log(`[Update Password Route] Old password verified for user ID: ${userId}. Hashing new password.`);
    // 3. Hash new password
    const newPasswordHash = await userService.hashPassword(newPassword); // Assume userService has hashPassword

    // 4. Update password in database
    console.log(`[Update Password Route] Updating password in DB for user ID: ${userId}`);
    const updateSuccess = await userService.updateUserPassword(userId, newPasswordHash); // Assume userService has updateUserPassword

    if (!updateSuccess) {
        console.error(`[Update Password Route] Failed to update password in DB for user ID: ${userId}.`);
        throw new Error('数据库更新密码失败');
    }

    console.log(`[Update Password Route] Password updated successfully for user ID: ${userId}.`);
    // --- Add Logging ---
    logService.addLog({
      type: 'security', // Or 'system'
      operation: '修改密码',
      content: `用户: ID=${userId}`, // Avoid logging username if possible
      operator: user.username // Or use userId directly
    });
    // --- End Logging ---
    
    res.json({
      code: 200,
      message: '密码修改成功'
    });

  } catch (error) {
    console.error(`[Update Password Route] Error during password update for user ID ${userId}:`, error);
    res.status(500).json({ code: 500, message: `密码修改失败: ${error.message || '服务器内部错误'}` });
  }
}); 

// --- New: Update User Info Route ---
app.put(`${apiPrefix}/user/info`, authenticateToken, async (req, res) => {
  const userId = req.user?.id;
  const { email } = req.body; // Expecting email in the body

  console.log(`[Update Info Route] Received request for user ID: ${userId}, Email: ${email}`);

  // Validation
  if (!userId) {
    return res.status(401).json({ code: 401, message: '用户未登录或认证无效' });
  }
  if (typeof email !== 'string' || email.trim() === '') {
    return res.status(400).json({ code: 400, message: '邮箱不能为空' });
  }
  // Basic format check (more thorough check is in userService)
  if (email.length > 100 || !email.includes('@')) { 
    return res.status(400).json({ code: 400, message: '邮箱格式不正确' });
  }

  try {
    // Call the service function to update the email
    const success = await userService.updateUserEmail(userId, email.trim());

    if (success) {
      console.log(`[Update Info Route] Email updated successfully for user ID: ${userId}`);
      // --- Add Logging ---
      logService.addLog({
        type: 'security', // or 'system'
        operation: '更新信息',
        content: `用户: ID=${userId} 更新邮箱`, 
        operator: req.user?.username || `User ${userId}`
      });
      // --- End Logging ---
      res.json({ 
        code: 200, 
        message: '用户信息更新成功',
        // Optionally return updated user info if needed
        data: { email: email.trim() } 
      });
    } else {
      // This might happen if the user ID doesn't exist (unlikely if authenticated)
      console.warn(`[Update Info Route] userService.updateUserEmail returned false for user ID: ${userId}`);
      res.status(404).json({ code: 404, message: '更新失败，未找到用户' });
    }

  } catch (error) {
    console.error(`[Update Info Route] Error updating info for user ID ${userId}:`, error);
    // Handle specific errors like email already exists
    if (error.message && error.message.includes('邮箱已被')) {
        return res.status(400).json({ code: 400, message: error.message });
    }
    if (error.message && error.message.includes('无效的邮箱格式')) {
        return res.status(400).json({ code: 400, message: error.message });
    }
    res.status(500).json({ code: 500, message: `用户信息更新失败: ${error.message || '服务器内部错误'}` });
  }
});
// --- End Update User Info Route ---

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