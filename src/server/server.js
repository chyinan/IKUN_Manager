// 服务器入口文件
const express = require('express');
const http = require('http'); // Import http module
const { Server } = require("socket.io"); // Import Socket.IO Server class
const cors = require('cors');
const bodyParser = require('body-parser');
const config = require('./config');
const db = require('./db'); // db.js now exports config functions
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
const dayjs = require('dayjs'); // Ensure dayjs is required
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore'); // For date validation
dayjs.extend(isSameOrBefore);

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

// --- JWT Secret (IMPORTANT: Use environment variable in production!) ---
// 统一 JWT Secret 来源，优先从 config 文件读取
const JWT_SECRET = process.env.JWT_SECRET || config.jwt.secret || 'YOUR_TEMPORARY_SECRET_KEY_CHANGE_ME'; 
if (JWT_SECRET === 'YOUR_TEMPORARY_SECRET_KEY_CHANGE_ME') {
    console.warn('[Server.js] WARNING: Using default JWT secret. Ensure config.jwt.secret is set or use JWT_SECRET env var.');
}
const JWT_EXPIRES_IN = config.jwt.expiresIn || '24h'; // Also ensure JWT_EXPIRES_IN is defined if needed here, or handle within authenticateToken if required

// --- Authentication Middleware (Updated with JWT Verification) ---
const authenticateToken = (req, res, next) => {
  console.log('[Auth DEBUG] authenticateToken middleware started.');
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    console.log('[Auth DEBUG] No token found.');
    return res.status(401).json({ code: 401, message: '未提供认证令牌' });
  }

  // 使用统一的 JWT_SECRET 进行验证
  jwt.verify(token, JWT_SECRET, (err, user) => { 
    if (err) {
      console.log('[Auth DEBUG] Token verification failed:', err.message);
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ code: 401, message: '令牌已过期' });
      } else if (err.name === 'JsonWebTokenError') {
        // Log the specific error for debugging invalid signature further if needed
        console.error('[Auth DEBUG] JsonWebTokenError details:', err);
        return res.status(403).json({ code: 403, message: '令牌无效' });
      } else {
        return res.status(403).json({ code: 403, message: '令牌验证失败' });
      }
    }
    console.log('[Auth DEBUG] Token verified successfully. User:', user);
    req.user = user; // Attach user info to the request object
    next();
  });
};

// --- Admin Check Middleware ---
const isAdmin = (req, res, next) => {
  if (!req.user) {
    console.log('[Admin Check] User not authenticated.');
    return res.status(401).json({ code: 401, message: '用户未认证' });
  }
  if (req.user.username === 'admin') {
    console.log('[Admin Check] User is admin.');
    next(); // User is admin, proceed
  } else {
    console.log(`[Admin Check] User ${req.user.username} is not admin.`);
    return res.status(403).json({ code: 403, message: '无权访问此资源，需要管理员权限' });
  }
};

// --- API Routes ---

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

// --- User Routes (Login, Info, etc.) ---
app.post(`${apiPrefix}/user/login`, async (req, res) => {
  const { username, password } = req.body;
  console.log(`收到登录请求: 用户名=${username}`); // 记录用户名

  if (!username || !password) {
    return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
  }

  try {
    const result = await userService.loginUser(username, password);
    console.log(`用户 ${username} 登录成功`);
    res.json({
      code: 200,
      message: '登录成功',
      data: result // 应该包含 token 和用户信息
    });
  } catch (error) {
    console.error(`用户 ${username} 登录失败:`, error.message);
    // 根据 userService 抛出的错误类型返回不同的状态码
    if (error.message === '用户不存在' || error.message === '密码错误') {
      res.status(401).json({ code: 401, message: error.message });
    } else {
      res.status(500).json({ code: 500, message: '登录时发生服务器内部错误' });
    }
  }
});

// 获取用户信息 (需要认证)
app.get(`${apiPrefix}/user/info`, authenticateToken, async (req, res) => {
  try {
    // req.user 包含从 authenticateToken 中解码的用户信息（如 id, username）
    const userInfo = await userService.findUserById(req.user.id); 
    if (!userInfo) {
      // 即使用户在Token有效期内被删除，也返回404
      console.warn(`[User Info] User ID ${req.user.id} found in token but not in DB.`);
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }
    // 返回用户信息（不包括密码）
    res.json({ 
      code: 200, 
      data: {
        id: userInfo.id,
        username: userInfo.username,
        email: userInfo.email,
        avatar: userInfo.avatar ? `/uploads/${userInfo.avatar}` : null // 构造完整的头像URL
      },
      message: '获取用户信息成功' 
    });
  } catch (error) {
    console.error(`获取用户 ID ${req.user.id} 信息失败:`, error);
    res.status(500).json({ code: 500, message: '获取用户信息失败' });
  }
});

// --- Config Routes ---
// GET /api/config/regex - 移除 authenticateToken 和 isAdmin，允许公开访问
app.get(`${apiPrefix}/config/regex`, async (req, res) => {
  try {
    console.log('获取正则表达式配置 (公开访问)');
    const configData = await db.getAllConfig();
    const regexConfig = {
      studentIdRegex: configData.studentIdRegex || '', // Default to empty if not found
      employeeIdRegex: configData.employeeIdRegex || '' // Default to empty if not found
    };
    res.json({
      code: 200,
      data: regexConfig,
      message: '获取成功'
    });
  } catch (error) {
    console.error('获取正则表达式配置失败:', error);
    res.status(500).json({ code: 500, message: '获取正则表达式配置失败', data: null });
  }
});

// PUT /api/config/regex - 保留 authenticateToken 和 isAdmin，需要管理员权限
app.put(`${apiPrefix}/config/regex`, authenticateToken, isAdmin, async (req, res) => {
  const { studentIdRegex, employeeIdRegex } = req.body;
  console.log('更新正则表达式配置:', req.body);

  // Basic validation: Ensure values are strings (more robust regex validation can be added)
  if (typeof studentIdRegex !== 'string' || typeof employeeIdRegex !== 'string') {
    return res.status(400).json({ code: 400, message: '无效的配置值，必须为字符串' });
  }

  try {
    await db.updateConfig('studentIdRegex', studentIdRegex);
    await db.updateConfig('employeeIdRegex', employeeIdRegex);
    console.log('成功将规则写入数据库');
    res.json({ code: 200, message: '正则表达式配置更新成功' });
  } catch (error) {
    console.error('更新正则表达式配置失败:', error);
    res.status(500).json({ code: 500, message: '更新正则表达式配置失败' });
  }
});

// --- Data Listing Routes (恢复/添加) ---

// 获取班级列表 (需要认证)
app.get(`${apiPrefix}/class/list`, authenticateToken, async (req, res) => {
  try {
    console.log('获取班级列表, 查询参数:', req.query);
    const result = await classService.getClassList(req.query);
    res.json({ code: 200, data: result, message: '获取班级列表成功' });
  } catch (error) {
    console.error('获取班级列表失败:', error);
    res.status(500).json({ code: 500, message: '获取班级列表失败' });
  }
});

// 获取部门列表 (需要认证)
app.get(`${apiPrefix}/dept/list`, authenticateToken, async (req, res) => {
  try {
    console.log('获取部门列表, 查询参数:', req.query);
    const result = await deptService.getDeptList(req.query);
    res.json({ code: 200, data: result, message: '获取部门列表成功' });
  } catch (error) {
    console.error('获取部门列表失败:', error);
    res.status(500).json({ code: 500, message: '获取部门列表失败' });
  }
});

// 获取员工列表 (需要认证)
app.get(`${apiPrefix}/employee/list`, authenticateToken, async (req, res) => {
  try {
    console.log('获取员工列表, 查询参数:', req.query);
    const result = await employeeService.getEmployeeList(req.query);
    res.json({ code: 200, data: result, message: '获取员工列表成功' });
  } catch (error) {
    console.error('获取员工列表失败:', error);
    res.status(500).json({ code: 500, message: '获取员工列表失败' });
  }
});

// 获取学生列表 (需要认证)
app.get(`${apiPrefix}/student/list`, authenticateToken, async (req, res) => {
  try {
    console.log('获取学生列表, 查询参数:', req.query);
    const result = await studentService.getStudentList(req.query);
    res.json({ code: 200, data: result, message: '获取学生列表成功' });
  } catch (error) {
    console.error('获取学生列表失败:', error);
    res.status(500).json({ code: 500, message: '获取学生列表失败' });
  }
});

// 获取考试列表 (需要认证 - 之前已有，确认位置正确)
app.get(`${apiPrefix}/exam/list`, authenticateToken, async (req, res) => {
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

// 新增：获取不重复的考试类型 (用于考试管理的筛选)
app.get(`${apiPrefix}/exam/types`, authenticateToken, async (req, res) => {
  try {
    console.log('[Server] 获取不重复的考试类型 (for /api/exam/types)');
    const types = await examService.getDistinctExamTypes(); 
    res.json({
      code: 200,
      message: '获取考试类型成功',
      data: types // 直接返回字符串数组
    });
  } catch (error) {
    console.error('[Server] 获取考试类型失败 (for /api/exam/types):', error);
    res.status(500).json({
      code: 500,
      message: '获取考试类型失败: ' + error.message,
      data: null
    });
  }
});

// 新增：获取不重复的考试类型 (用于成绩录入的下拉框 - 保留之前的)
app.get(`${apiPrefix}/score/exam-types`, authenticateToken, async (req, res) => {
  try {
    console.log('获取不重复的考试类型');
    // 注意：我们从 examService 获取数据，因为类型是考试的属性
    const types = await examService.getDistinctExamTypes(); 
    res.json({
      code: 200,
      message: '获取考试类型成功',
      data: types //直接返回字符串数组
    });
  } catch (error) {
    console.error('获取考试类型失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取考试类型失败: ' + error.message, // 返回更具体的错误信息
      data: null
    });
  }
});

// 获取成绩列表 (需要认证)
app.get(`${apiPrefix}/score/list`, authenticateToken, async (req, res) => {
  try {
    console.log('获取成绩列表, 查询参数:', req.query);
    const result = await scoreService.getScores(req.query);
    res.json({ code: 200, data: result, message: '获取成绩列表成功' });
  } catch (error) {
    console.error('获取成绩列表失败:', error);
    res.status(500).json({ code: 500, message: '获取成绩列表失败' });
  }
});

// 获取日志列表 (需要认证)
app.get(`${apiPrefix}/log/list`, authenticateToken, async (req, res) => {
  try {
    console.log('获取日志列表, 查询参数:', req.query);
    const result = await logService.getLogs(req.query);
    res.json({ code: 200, data: result, message: '获取日志列表成功' });
  } catch (error) {
    console.error('获取日志列表失败:', error);
    res.status(500).json({ code: 500, message: '获取日志列表失败' });
  }
});

// 确保统计路由也需要认证
app.get(`${apiPrefix}/employee/stats`, authenticateToken, async (req, res) => {
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

app.get(`${apiPrefix}/exam/stats`, authenticateToken, async (req, res) => {
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

// 新增：根据学生ID和考试ID获取学生成绩
app.get(`${apiPrefix}/score/student/:studentId`, authenticateToken, async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId, 10);
    const examId = parseInt(req.query.examId, 10); // examId 从查询参数获取

    console.log(`[Server] 收到获取学生成绩请求: studentId=${studentId}, examId=${examId}`);

    if (isNaN(studentId) || isNaN(examId)) {
      return res.status(400).json({ code: 400, message: '无效的学生ID或考试ID' });
    }

    // 调用 service 函数获取包含科目和成绩的完整数据
    const scoreData = await scoreService.getScoresByStudentAndExam(studentId, examId);

    // 检查 service 是否返回了 null (表示未找到考试)
    if (scoreData === null) {
      // 虽然技术上不是错误，但前端可能期望一个空对象或特定结构
      // 这里返回 404 可能更符合 RESTful 风格，或者返回 200 和一个表示空的数据结构
      // 暂时返回 200 和 null data，让前端处理
       console.log(`[Server] 未找到学生 ${studentId} 在考试 ${examId} 的成绩或考试记录`);
       return res.json({ code: 200, message: '未找到考试记录', data: null }); // 或者返回 { data: { subjects: [], scores: {} } } ?
    }

    // 直接返回 service 层准备好的数据
    res.json({
      code: 200,
      message: '获取学生成绩成功',
      data: scoreData 
    });

  } catch (error) {
    console.error(`[Server] 获取学生成绩失败:`, error);
    // 根据错误类型返回不同状态码
    if (error.message === '学生ID和考试ID不能为空') {
        res.status(400).json({ code: 400, message: error.message });
    } else {
        res.status(500).json({
            code: 500,
            message: '获取学生成绩时发生服务器内部错误: ' + error.message,
            data: null
        });
    }
  }
});

// 新增：保存学生成绩
app.post(`${apiPrefix}/score/save`, authenticateToken, async (req, res) => {
  try {
    const { studentId, examId, scores } = req.body;
    console.log(`[Server] 收到保存成绩请求: studentId=${studentId}, examId=${examId}, scores:`, scores);

    if (!studentId || !examId || !scores || typeof scores !== 'object') {
      return res.status(400).json({ code: 400, message: '无效的请求数据：缺少学生ID、考试ID或成绩信息' });
    }

    // 转换数据格式以匹配 scoreService.saveStudentScore 的期望
    const serviceData = {
      student_id: studentId,
      exam_id: examId,
      ...scores // 将 scores 对象中的键值对直接展开
    };

    console.log('[Server] 调用 scoreService.saveStudentScore 的数据:', serviceData);
    const success = await scoreService.saveStudentScore(serviceData);

    if (success) {
      res.json({ code: 200, message: '成绩保存成功' });
    } else {
      // Service 层内部应该已经处理了错误，这里返回通用错误
      res.status(500).json({ code: 500, message: '保存成绩时发生服务器内部错误' });
    }

  } catch (error) {
    console.error('[Server] 保存成绩失败 (路由处理):', error);
    // 可以根据 service 抛出的具体错误类型进一步细化响应
    res.status(500).json({
      code: 500,
      message: '保存成绩时发生服务器内部错误: ' + error.message,
      data: null
    });
  }
});

// ... (Rest of the routes for employee, exam, dept, class, student, score, log, user) ...
// IMPORTANT: Ensure authenticateToken and potentially isAdmin are applied to relevant routes

// --- Error Handling Middleware (Should be placed last) ---
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  // Log the error details
  logService.addLogEntry('system', 'error', `服务器内部错误: ${err.message}`, 'System');

  if (err instanceof multer.MulterError) {
    // Multer specific errors
    return res.status(400).json({ code: 400, message: `文件上传错误: ${err.message}` });
  } else if (err.message && err.message.includes('仅支持上传')) {
    // Custom file filter error
     return res.status(400).json({ code: 400, message: err.message });
  }

  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    data: null
  });
});

// 启动服务器
async function startServer() {
  try {
    await db.testConnection();
    console.log('数据库连接成功.');

    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log(`Uploads directory created at ${uploadsDir}`);
    }

    httpServer.listen(config.server.port, () => { 
      console.log(`服务器运行在 http://localhost:${config.server.port}`);
      logService.addLogEntry('system', 'start', `服务器启动成功，监听端口 ${config.server.port}`, 'System'); 
    });

    // Socket.IO connection handling
    io.on('connection', (socket) => {
      console.log(`客户端已连接: ${socket.id}`);
      logService.addLogEntry('system', 'connect', `客户端连接: ${socket.id}`, 'System');
      socket.emit('connectionSuccess', { message: '成功连接到服务器 Socket.IO' });

      socket.on('disconnect', (reason) => {
        console.log(`客户端已断开: ${socket.id}, 原因: ${reason}`);
        logService.addLogEntry('system', 'disconnect', `客户端断开: ${socket.id}, 原因: ${reason}`, 'System');
      });

      socket.on('error', (error) => {
        console.error(`Socket.IO 错误 from ${socket.id}:`, error);
        logService.addLogEntry('system', 'error', `Socket.IO 错误: ${error.message}`, 'System');
      });
    });

  } catch (error) {
    console.error('启动服务器失败:', error);
    logService.addLogEntry('system', 'error', `服务器启动失败: ${error.message}`, 'System');
    process.exit(1);
  }
}

startServer();