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

// --- Multer Configuration for General Import (Existing) ---
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

// --- Multer Configuration for Avatar Upload (New) ---
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'uploads');
    // Ensure the uploads directory exists
    fs.mkdirSync(uploadPath, { recursive: true }); 
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename: userId-timestamp.extension
    // req.user should be available if authenticateToken runs before this
    const userId = req.user ? req.user.id : 'unknown'; 
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `avatar-${userId}-${uniqueSuffix}${extension}`);
  }
});

const avatarFileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    console.warn(`[Avatar Upload] Rejected file type: ${file.mimetype}`);
    cb(new Error('仅支持上传图片文件 (jpeg, png, gif等)'), false);
  }
};

const avatarUpload = multer({ 
  storage: avatarStorage, 
  fileFilter: avatarFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // Limit avatar size to 2MB
});
// --- End Multer Configuration for Avatar Upload ---

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

// 新增：上传用户头像 (需要认证，使用 avatarUpload 中间件)
// 注意：avatarUpload.single('avatar') 必须在 authenticateToken 之后，因为它需要 req.user
app.post(`${apiPrefix}/user/avatar`, authenticateToken, avatarUpload.single('avatar'), async (req, res) => {
  // 'avatar' 是前端 FormData 中文件字段的名称，需要与前端匹配
  try {
    if (!req.file) {
      console.log('[Avatar Upload] No file received.');
      return res.status(400).json({ code: 400, message: '未收到头像文件' });
    }

    const userId = req.user.id; 
    const avatarFilename = req.file.filename; // Multer adds file info to req.file
    console.log(`[Avatar Upload] Received file: ${avatarFilename} for user: ${userId}`);

    // 调用 service 更新数据库
    const success = await userService.updateUserAvatar(userId, avatarFilename);

    if (success) {
      // 返回新的头像路径 (相对于服务器根目录的 /uploads/)
      const newAvatarUrl = `/uploads/${avatarFilename}`; 
      console.log(`[Avatar Upload] Success. New URL: ${newAvatarUrl}`);
      res.json({ 
        code: 200, 
        message: '头像上传成功', 
        data: { avatarUrl: newAvatarUrl } 
      });
    } else {
      // 如果 service 返回 false (例如用户不存在)
      res.status(404).json({ code: 404, message: '更新头像失败，未找到用户' });
    }

  } catch (error) {
    console.error('[Avatar Upload] Error handling avatar upload:', error);
    // Multer 错误可能已经在全局错误处理器中处理
    // 这里处理 service 抛出的或其他错误
    if (error.message && error.message.includes('仅支持上传图片文件')) {
         res.status(400).json({ code: 400, message: error.message });
    } else {
        res.status(500).json({ 
          code: 500, 
          message: '头像上传失败: ' + error.message 
        });
    }
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

// **新增：添加班级 (需要认证)**
app.post(`${apiPrefix}/class/add`, authenticateToken, async (req, res) => {
  try {
    const classData = req.body;
    console.log('[Server] 收到添加班级请求:', classData);

    // 在这里可以添加数据验证，例如检查 class_name 是否存在且不为空
    if (!classData.class_name) {
      return res.status(400).json({ code: 400, message: '班级名称不能为空' });
    }

    // 调用 service 函数添加
    const newClass = await classService.addClass(classData); // 确保 classService 有 addClass 方法

    if (newClass) {
      res.status(201).json({ code: 201, message: '班级添加成功', data: newClass }); // 使用 201 Created 状态码
    } else {
      // 如果 service 返回 null 或 false，表示添加失败 (可能是因为唯一性约束等)
      // Service 层应该处理具体错误，这里返回通用错误
      res.status(500).json({ code: 500, message: '添加班级失败，请检查日志' }); 
    }

  } catch (error) {
    console.error('[Server] 添加班级失败:', error);
    // 可以根据 service 抛出的具体错误类型进一步细化响应
    if (error.code === 'ER_DUP_ENTRY') { // 示例：处理唯一键冲突
      res.status(409).json({ code: 409, message: '添加失败：班级名称已存在' }); 
    } else if (error.message && error.message.includes('不能为空')) {
        res.status(400).json({ code: 400, message: error.message });
    } else {
      res.status(500).json({
        code: 500,
        message: '添加班级时发生服务器内部错误: ' + error.message,
        data: null
      });
    }
  }
});

// **新增：更新班级信息 (需要认证)**
app.put(`${apiPrefix}/class/:id`, authenticateToken, async (req, res) => {
  try {
    const classId = parseInt(req.params.id, 10);
    const classData = req.body;

    console.log(`[Server] 收到更新班级请求: ID=${classId}, 数据:`, classData);

    if (isNaN(classId)) {
      return res.status(400).json({ code: 400, message: '无效的班级ID' });
    }

    // 移除 ID，防止尝试更新主键
    delete classData.id; 
    // 如果需要，可以在这里添加更多的数据验证

    // 调用 service 函数更新
    const updatedClass = await classService.updateClass(classId, classData); // 确保 classService 有 updateClass 方法

    if (updatedClass) {
      res.json({ code: 200, message: '班级信息更新成功', data: updatedClass });
    } else {
      // 可能因为 ID 不存在而更新失败
      res.status(404).json({ code: 404, message: '更新班级失败，未找到指定ID的班级' });
    }

  } catch (error) {
    console.error(`[Server] 更新班级失败 (ID: ${req.params.id}):`, error);
    // 可以根据 service 抛出的具体错误类型进一步细化响应
     if (error.message && (error.message.includes('格式无效') || error.message.includes('不能为空'))) { // 示例错误处理
       res.status(400).json({ code: 400, message: error.message });
     } else {
       res.status(500).json({
         code: 500,
         message: '更新班级信息时发生服务器内部错误: ' + error.message,
         data: null
       });
     }
  }
});

// **新增：删除班级 (需要认证)**
app.delete(`${apiPrefix}/class/:id`, authenticateToken, async (req, res) => {
  try {
    const classId = parseInt(req.params.id, 10);
    console.log(`[Server] 收到删除班级请求: ID=${classId}`);

    if (isNaN(classId)) {
      return res.status(400).json({ code: 400, message: '无效的班级ID' });
    }

    // 调用 service 函数删除
    const success = await classService.deleteClass(classId); // 确保 classService 有 deleteClass 方法

    if (success) {
      res.json({ code: 200, message: '班级删除成功' }); // 返回 200 OK 或 204 No Content
    } else {
      // 可能因为 ID 不存在或有关联数据（如学生）而删除失败
      res.status(404).json({ code: 404, message: '删除班级失败，未找到指定ID的班级或有关联数据' }); 
    }

  } catch (error) {
    console.error(`[Server] 删除班级失败 (ID: ${req.params.id}):`, error);
    // 处理外键约束等特定数据库错误
    if (error.code === 'ER_ROW_IS_REFERENCED_2') { // 示例：处理外键约束错误
       res.status(409).json({ code: 409, message: '删除失败：班级下存在学生，无法删除' }); 
    } else {
       res.status(500).json({
         code: 500,
         message: '删除班级时发生服务器内部错误: ' + error.message,
         data: null
       });
    }
  }
});

// **新增：导入班级数据 (需要认证)**
app.post(`${apiPrefix}/class/import`, authenticateToken, importUpload.single('file'), async (req, res) => {
  console.log('[Server] Received request for /api/class/import');
  if (!req.file) {
    console.log('[Server] No file uploaded for class import.');
    return res.status(400).json({ code: 400, message: '未上传文件' });
  }

  console.log(`[Server] Processing uploaded file: ${req.file.originalname}, size: ${req.file.size}, type: ${req.file.mimetype}`);

  try {
    let classes = [];
    const buffer = req.file.buffer;

    // --- Parse file --- 
    if (req.file.mimetype === 'text/csv') {
      console.log('[Server Class Import] Parsing CSV...');
      const csvString = buffer.toString('utf8');
      const parseResult = papaparse.parse(csvString, { header: true, skipEmptyLines: true });
      if (parseResult.errors.length > 0) {
        console.error('[Server Class Import] CSV parsing errors:', parseResult.errors);
        return res.status(400).json({ code: 400, message: 'CSV文件解析失败', data: { errors: parseResult.errors } });
      }
      classes = parseResult.data;
    } else if (req.file.mimetype.startsWith('application/vnd.openxmlformats-officedocument') || req.file.mimetype === 'application/vnd.ms-excel') {
        console.log('[Server Class Import] Parsing Excel...');
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        classes = xlsx.utils.sheet_to_json(worksheet, { raw: true }); // Keep raw values for validation
    } else {
        return res.status(400).json({ code: 400, message: '不支持的文件类型' });
    }
    console.log(`[Server Class Import] Parsed ${classes.length} rows.`);

    // --- Validate and Transform --- 
    const processedClasses = [];
    const validationErrors = [];
    const requiredFields = ['班级名称', '班主任']; // Headers expected in the file

    for (let i = 0; i < classes.length; i++) {
        const row = classes[i];
        const rowNum = i + 2; // Assuming header is row 1
        const rowErrors = [];
        
        for (const field of requiredFields) {
            if (row[field] === undefined || row[field] === null || String(row[field]).trim() === '') {
                rowErrors.push(`缺少必需字段 '${field}'`);
            }
        }

        if (rowErrors.length > 0) {
            validationErrors.push({ row: rowNum, errors: rowErrors, rowData: row });
        } else {
            // Transform keys to match service expectation (snake_case)
            processedClasses.push({
                class_name: String(row['班级名称']).trim(),
                teacher: String(row['班主任']).trim(),
                description: row['班级描述'] ? String(row['班级描述']).trim() : null
            });
        }
    }
    console.log(`[Server Class Import] Validation complete. Valid: ${processedClasses.length}, Invalid: ${validationErrors.length}`);

    if (processedClasses.length === 0 && validationErrors.length > 0) {
        return res.status(400).json({ code: 400, message: '导入失败：文件内容校验未通过', data: { errors: validationErrors } });
    }

    // --- Call Service --- 
    const result = await classService.batchAddClasses(processedClasses);

    // --- Construct Response --- 
    const finalErrors = [...validationErrors, ...(result.errors || [])]; // Combine validation and DB errors
    
    if (result.success && finalErrors.length === 0) {
      // All successful
      res.json({ 
        code: 200, 
        message: `导入成功！共处理 ${result.processedCount} 条记录。`, 
        data: { processedCount: result.processedCount, errors: [] } 
      });
    } else if (result.success && finalErrors.length > 0) {
        // Partial success
        res.status(207).json({ // 207 Multi-Status
            code: 207,
            message: `导入完成（部分成功）。处理 ${result.processedCount} 条，失败 ${finalErrors.length} 条。`,
            data: { processedCount: result.processedCount, errors: finalErrors }
        });
    } else {
        // Complete failure
         res.status(500).json({ 
            code: 500, 
            message: '导入失败：服务器处理数据时发生错误', 
            data: { processedCount: 0, errors: finalErrors } 
        });
    }

  } catch (error) {
    console.error('[Server Class Import] Import failed:', error);
    res.status(500).json({ code: 500, message: '处理导入文件时发生服务器内部错误: ' + error.message, data: null });
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

// **新增：添加部门 (需要认证)**
app.post(`${apiPrefix}/dept/add`, authenticateToken, async (req, res) => {
  try {
    const deptData = req.body;
    console.log('[Server] 收到添加部门请求:', deptData);

    // 可以在这里添加更严格的验证
    if (!deptData.dept_name || !deptData.manager) {
      return res.status(400).json({ code: 400, message: '部门名称和主管不能为空' });
    }

    const newDept = await deptService.addDept(deptData); // 确保 deptService 有 addDept 方法

    if (newDept) {
      res.status(201).json({ code: 201, message: '部门添加成功', data: newDept });
    } else {
      res.status(500).json({ code: 500, message: '添加部门失败，请检查服务日志' });
    }

  } catch (error) {
    console.error('[Server] 添加部门失败:', error);
    if (error.message === '部门名称已存在') {
      res.status(409).json({ code: 409, message: error.message }); // 409 Conflict
    } else if (error.message === '部门名称和部门主管不能为空') {
       res.status(400).json({ code: 400, message: error.message });
    } else {
      res.status(500).json({
        code: 500,
        message: '添加部门时发生服务器内部错误: ' + error.message,
        data: null
      });
    }
  }
});

// **新增：删除部门 (需要认证)**
app.delete(`${apiPrefix}/dept/:id`, authenticateToken, async (req, res) => {
  try {
    const deptId = parseInt(req.params.id, 10);
    console.log(`[Server] 收到删除部门请求: ID=${deptId}`);

    if (isNaN(deptId)) {
      return res.status(400).json({ code: 400, message: '无效的部门ID' });
    }

    // 调用 service 函数删除
    // deptService.deleteDept 应该返回 { success: boolean, dept_name: string | null }
    const result = await deptService.deleteDept(deptId); 

    if (result.success) {
      res.json({ code: 200, message: `部门 '${result.dept_name || deptId}' 删除成功` });
    } else {
      // 如果 service 返回 success: false，通常意味着未找到记录
      res.status(404).json({ code: 404, message: `删除部门失败，未找到ID为 ${deptId} 的部门` });
    }

  } catch (error) {
    console.error(`[Server] 删除部门失败 (ID: ${req.params.id}):`, error);
    // 特别处理外键约束错误
    if (error.message === '无法删除：该部门下仍有员工') { 
       res.status(409).json({ code: 409, message: error.message }); // 409 Conflict
    } else {
       res.status(500).json({
         code: 500,
         message: '删除部门时发生服务器内部错误: ' + error.message,
         data: null
       });
    }
  }
});

// **新增：导入部门数据 (需要认证)**
app.post(`${apiPrefix}/dept/import`, authenticateToken, importUpload.single('file'), async (req, res) => {
  console.log('[Server] Received request for /api/dept/import');
  if (!req.file) {
    console.log('[Server] No file uploaded for department import.');
    return res.status(400).json({ code: 400, message: '未上传文件' });
  }

  console.log(`[Server] Processing uploaded file: ${req.file.originalname}, size: ${req.file.size}, type: ${req.file.mimetype}`);

  try {
    let departments = [];
    const buffer = req.file.buffer;

    // --- Parse file --- 
    if (req.file.mimetype === 'text/csv') {
      console.log('[Server Dept Import] Parsing CSV...');
      const csvString = buffer.toString('utf8');
      const parseResult = papaparse.parse(csvString, { header: true, skipEmptyLines: true });
      if (parseResult.errors.length > 0) {
        console.error('[Server Dept Import] CSV parsing errors:', parseResult.errors);
        return res.status(400).json({ code: 400, message: 'CSV文件解析失败', data: { errors: parseResult.errors } });
      }
      departments = parseResult.data;
    } else if (req.file.mimetype.startsWith('application/vnd.openxmlformats-officedocument') || req.file.mimetype === 'application/vnd.ms-excel') {
        console.log('[Server Dept Import] Parsing Excel...');
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        departments = xlsx.utils.sheet_to_json(worksheet, { raw: true }); // Keep raw values for validation
    } else {
        return res.status(400).json({ code: 400, message: '不支持的文件类型' });
    }
    console.log(`[Server Dept Import] Parsed ${departments.length} rows.`);

    // --- Validate and Transform --- 
    const processedDepts = [];
    const validationErrors = [];
    const requiredFields = ['部门名称', '部门主管']; // Headers expected in the file

    for (let i = 0; i < departments.length; i++) {
        const row = departments[i];
        const rowNum = i + 2;
        const rowErrors = [];
        
        for (const field of requiredFields) {
            if (row[field] === undefined || row[field] === null || String(row[field]).trim() === '') {
                rowErrors.push(`缺少必需字段 '${field}'`);
            }
        }

        if (rowErrors.length > 0) {
            validationErrors.push({ row: rowNum, errors: rowErrors, rowData: row });
        } else {
            processedDepts.push({
                dept_name: String(row['部门名称']).trim(),
                manager: String(row['部门主管']).trim(),
                description: row['部门描述'] ? String(row['部门描述']).trim() : null
            });
        }
    }
    console.log(`[Server Dept Import] Validation complete. Valid: ${processedDepts.length}, Invalid: ${validationErrors.length}`);

    if (processedDepts.length === 0 && validationErrors.length > 0) {
        return res.status(400).json({ code: 400, message: '导入失败：文件内容校验未通过', data: { errors: validationErrors } });
    }

    // --- Call Service --- 
    const result = await deptService.batchAddDepts(processedDepts);

    // --- Construct Response --- 
    const finalErrors = [...validationErrors, ...(result.errors || [])];
    
    if (result.success && finalErrors.length === 0) {
      res.json({ code: 200, message: `导入成功！共处理 ${result.processedCount} 条记录。`, data: { processedCount: result.processedCount, errors: [] } });
    } else if (result.success && finalErrors.length > 0) {
        res.status(207).json({ code: 207, message: `导入完成（部分成功）。处理 ${result.processedCount} 条，失败 ${finalErrors.length} 条。`, data: { processedCount: result.processedCount, errors: finalErrors } });
    } else {
         res.status(500).json({ code: 500, message: '导入失败：服务器处理数据时发生错误', data: { processedCount: 0, errors: finalErrors } });
    }

  } catch (error) {
    console.error('[Server Dept Import] Import failed:', error);
    res.status(500).json({ code: 500, message: '处理导入文件时发生服务器内部错误: ' + error.message, data: null });
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

// **新增：添加员工 (需要认证)**
app.post(`${apiPrefix}/employee/add`, authenticateToken, async (req, res) => {
  try {
    const employeeData = req.body;
    console.log('[Server] 收到添加员工请求:', employeeData);

    // 可以在这里添加更严格的验证，例如检查必填字段
    if (!employeeData.empId || !employeeData.name || !employeeData.gender || !employeeData.age || !employeeData.position || !employeeData.deptName || !employeeData.salary || !employeeData.status || !employeeData.joinDate) {
      return res.status(400).json({ code: 400, message: '缺少必要的员工信息' });
    }
    
    // 调用 service 函数添加
    const newEmployee = await employeeService.addEmployee(employeeData); // 确保 employeeService 有 addEmployee 方法

    if (newEmployee) {
      res.status(201).json({ code: 201, message: '员工添加成功', data: newEmployee });
    } else {
      res.status(500).json({ code: 500, message: '添加员工失败，请检查服务日志' });
    }

  } catch (error) {
    console.error('[Server] 添加员工失败:', error);
    // 处理特定错误，如工号格式无效、部门不存在、唯一键冲突等
    if (error.message === '工号格式无效') {
      res.status(400).json({ code: 400, message: error.message });
    } else if (error.message && error.message.includes('部门") && error.message.includes("不存在')) {
      res.status(400).json({ code: 400, message: error.message });
    } else if (error.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ code: 409, message: '添加失败：员工工号已存在' });
    } else {
      res.status(500).json({
        code: 500,
        message: '添加员工时发生服务器内部错误: ' + error.message,
        data: null
      });
    }
  }
});

// **新增：删除员工 (需要认证)**
app.delete(`${apiPrefix}/employee/:id`, authenticateToken, async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id, 10);
    console.log(`[Server] 收到删除员工请求: ID=${employeeId}`);

    if (isNaN(employeeId)) {
      return res.status(400).json({ code: 400, message: '无效的员工ID' });
    }

    // 调用 service 函数删除
    // employeeService.deleteEmployee 应该返回 { success: boolean, emp_id: string | null }
    const result = await employeeService.deleteEmployee(employeeId); 

    if (result.success) {
      res.json({ code: 200, message: `员工 (工号: ${result.emp_id || employeeId}) 删除成功` });
    } else {
      // 如果 service 返回 success: false，通常意味着未找到记录
      res.status(404).json({ code: 404, message: `删除员工失败，未找到ID为 ${employeeId} 的员工` });
    }

  } catch (error) {
    console.error(`[Server] 删除员工失败 (ID: ${req.params.id}):`, error);
    // 这里可以添加更具体的错误处理，例如外键约束等
    res.status(500).json({
      code: 500,
      message: '删除员工时发生服务器内部错误: ' + error.message,
      data: null
    });
  }
});

// **新增：导出员工数据 (需要认证)**
app.get(`${apiPrefix}/employee/export`, authenticateToken, async (req, res) => {
  try {
    console.log('[Server] 收到导出员工数据请求, 查询参数:', req.query);
    
    // 1. 获取要导出的数据 (使用与列表相同的查询参数)
    const employeesToExport = await employeeService.getEmployeesForExport(req.query); 

    if (!employeesToExport || employeesToExport.length === 0) {
      return res.status(404).json({ code: 404, message: '没有符合条件的员工数据可导出' });
    }

    console.log(`[Server] 准备导出 ${employeesToExport.length} 条员工数据`);

    // 2. 准备 Excel 工作簿和工作表
    const worksheetData = employeesToExport.map(emp => ({
      '工号': emp.emp_id,
      '姓名': emp.name,
      '性别': emp.gender,
      '年龄': emp.age,
      '职位': emp.position,
      '部门': emp.dept_name, 
      '薪资': emp.salary,
      '状态': emp.status,
      '联系电话': emp.phone,
      '邮箱': emp.email,
      '入职时间': emp.join_date // 确保 join_date 已经是 'YYYY-MM-DD' 格式
    }));

    const worksheet = xlsx.utils.json_to_sheet(worksheetData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, '员工数据');

    // 3. 生成 Excel 文件 buffer
    const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    // 4. 设置响应头并发送文件
    const timestamp = dayjs().format('YYYYMMDDHHmmss');
    const filename = `员工数据_${timestamp}.xlsx`;

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(excelBuffer);
    console.log(`[Server] 成功发送导出的员工数据文件: ${filename}`);

  } catch (error) {
    console.error('[Server] 导出员工数据失败:', error);
    // 避免在发送文件后尝试发送 JSON 错误
    if (!res.headersSent) {
        res.status(500).json({
            code: 500,
            message: '导出员工数据时发生服务器内部错误: ' + error.message,
            data: null
        });
    }
  }
});

// **新增：导入员工数据 (需要认证)**
app.post(`${apiPrefix}/employee/import`, authenticateToken, importUpload.single('file'), async (req, res) => {
  console.log('[Server] Received request for /api/employee/import');
  if (!req.file) {
    console.log('[Server] No file uploaded for employee import.');
    return res.status(400).json({ code: 400, message: '未上传文件' });
  }

  console.log(`[Server] Processing uploaded file: ${req.file.originalname}, size: ${req.file.size}, type: ${req.file.mimetype}`);

  try {
    let employees = [];
    const buffer = req.file.buffer;

    // --- Load Config for Validation --- 
    const dbConfig = await db.getAllConfig(); // Fetch config here
    console.log('[Server Import] Loaded config for validation:', dbConfig);

    // --- Parse file based on type --- 
    if (req.file.mimetype === 'text/csv') {
      console.log('[Server] Parsing CSV file...');
      const csvString = buffer.toString('utf8');
      const parseResult = papaparse.parse(csvString, {
        header: true, // Assume first row is header
        skipEmptyLines: true,
        dynamicTyping: true, // Automatically convert types where possible
      });
      
      if (parseResult.errors.length > 0) {
        console.error('[Server] CSV parsing errors:', parseResult.errors);
        // Return a more specific error about CSV parsing
        return res.status(400).json({ code: 400, message: 'CSV文件解析失败，请检查格式', data: { errors: parseResult.errors } });
      }
      employees = parseResult.data;
      console.log(`[Server] Parsed ${employees.length} rows from CSV.`);

    } else if (req.file.mimetype.startsWith('application/vnd.openxmlformats-officedocument') || req.file.mimetype === 'application/vnd.ms-excel') {
        console.log('[Server] Parsing Excel file...');
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0]; // Assume data is in the first sheet
        const worksheet = workbook.Sheets[sheetName];
        employees = xlsx.utils.sheet_to_json(worksheet, {
            // header: 1, // If you want arrays instead of objects
            // defval: '', // Default value for empty cells
            raw: false, // Important: format dates, numbers etc.
             dateNF: 'yyyy-mm-dd' // Attempt to format dates, might need post-processing
        });
        console.log(`[Server] Parsed ${employees.length} rows from Excel sheet '${sheetName}'.`);
    } else {
        console.log(`[Server] Unsupported file type: ${req.file.mimetype}`);
        return res.status(400).json({ code: 400, message: '不支持的文件类型' });
    }

    // --- Data Validation and Transformation --- 
    const processedEmployees = [];
    const validationErrors = [];
    const requiredFields = ['工号', '姓名', '性别', '年龄', '职位', '部门', '薪资', '状态', '入职时间']; // Based on export structure
    
    // Load the regex pattern for validation FROM DB CONFIG
    const regexPattern = dbConfig.employeeIdRegex || '^EMP\\d{3}$'; // Use dbConfig
    console.log(`[Server Import] Using regex pattern for validation: ${regexPattern}`);
    const employeeIdRegex = new RegExp(regexPattern);

    for (let i = 0; i < employees.length; i++) {
        const row = employees[i];
        const rowNum = i + 2; // Assuming header row is 1, data starts from row 2
        const rowErrors = [];

        // 1. Check for required fields
        for (const field of requiredFields) {
            if (row[field] === undefined || row[field] === null || String(row[field]).trim() === '') {
                rowErrors.push(`缺少必需字段 '${field}'`);
            }
        }
        
        // 2. Validate specific fields (example: empId format)
        const empId = String(row['工号'] || '').trim(); // Normalize empId access
        if (empId && !employeeIdRegex.test(empId)) {
            rowErrors.push(`工号 '${empId}' 格式不符合规则 (${regexPattern})`);
        }

        // 3. Validate data types (example: age, salary are numbers)
        if (row['年龄'] !== undefined && isNaN(parseInt(row['年龄'], 10))) {
           rowErrors.push(`年龄 '${row['年龄']}' 必须是数字`);
        }
        if (row['薪资'] !== undefined && isNaN(parseFloat(row['薪资']))) {
            rowErrors.push(`薪资 '${row['薪资']}' 必须是数字`);
        }
        
        // 4. Validate date format (simple check, more robust needed for different formats)
        const joinDate = row['入职时间'];
        if (joinDate && !dayjs(joinDate, ['YYYY-MM-DD', 'YYYY/MM/DD'], true).isValid()) { // Check specific formats
            // Try parsing if it might be an Excel date number
            if (typeof joinDate === 'number' && joinDate > 1) { 
                try {
                    // Attempt to parse Excel date serial number
                    const parsedDate = xlsx.SSF.parse_date_code(joinDate);
                    row['入职时间'] = dayjs(new Date(parsedDate.y, parsedDate.m - 1, parsedDate.d)).format('YYYY-MM-DD');
                } catch (dateParseError) {
                    rowErrors.push(`入职时间 '${joinDate}' 格式无效 (预期 YYYY-MM-DD 或 YYYY/MM/DD)`);
                }
            } else {
                 rowErrors.push(`入职时间 '${joinDate}' 格式无效 (预期 YYYY-MM-DD 或 YYYY/MM/DD)`);
            }
        }

        if (rowErrors.length > 0) {
            validationErrors.push({ row: rowNum, errors: rowErrors, rowData: row });
        } else {
            // Transform keys to match service expectation (camelCase/snake_case as needed)
             processedEmployees.push({
                emp_id: empId, // Use validated empId
                name: String(row['姓名']).trim(),
                gender: String(row['性别']).trim(),
                age: parseInt(row['年龄'], 10),
                position: String(row['职位']).trim(),
                deptName: String(row['部门']).trim(), // Pass deptName to service
                salary: parseFloat(row['薪资']),
                status: String(row['状态']).trim(),
                phone: row['联系电话'] ? String(row['联系电话']).trim() : null,
                email: row['邮箱'] ? String(row['邮箱']).trim() : null,
                join_date: dayjs(row['入职时间']).format('YYYY-MM-DD') // Ensure format
            });
        }
    }

    console.log(`[Server] Validation complete. Valid rows: ${processedEmployees.length}, Invalid rows: ${validationErrors.length}`);

    if (processedEmployees.length === 0 && validationErrors.length > 0) {
        // Only validation errors, no data to process
        return res.status(400).json({ 
            code: 400, 
            message: '导入失败：文件内容校验未通过', 
            data: { errors: validationErrors }
        });
    }

    // --- Call Service to Batch Add --- 
    const result = await employeeService.batchAddEmployees(processedEmployees);

    // --- Construct Response --- 
    const finalErrors = [...validationErrors, ...(result.errors || [])]; // Combine validation and DB errors
    
    if (result.success && finalErrors.length === 0) {
      // All successful
      res.json({ 
        code: 200, 
        message: `导入成功！共处理 ${result.addedCount} 条记录。`, 
        data: { addedCount: result.addedCount, errors: [] } 
      });
    } else if (result.success && finalErrors.length > 0) {
        // Partial success
        res.status(207).json({ // 207 Multi-Status might be suitable
            code: 207,
            message: `导入完成（部分成功）。成功处理 ${result.addedCount} 条，失败 ${finalErrors.length} 条。`,
            data: { addedCount: result.addedCount, errors: finalErrors }
        });
    } else {
        // Complete failure (e.g., DB connection issue during batch insert)
         res.status(500).json({ 
            code: 500, 
            message: '导入失败：服务器在处理数据时发生错误', 
            data: { addedCount: 0, errors: finalErrors } 
        });
    }

  } catch (error) {
    console.error('[Server] Employee import failed:', error);
    res.status(500).json({ 
      code: 500, 
      message: '处理导入文件时发生服务器内部错误: ' + error.message, 
      data: null 
    });
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

// 新增：更新考试信息 (需要认证)
app.put(`${apiPrefix}/exam/:id`, authenticateToken, async (req, res) => {
  try {
    const examId = parseInt(req.params.id, 10);
    const examData = req.body;

    console.log(`[Server] 收到更新考试请求: ID=${examId}, 数据:`, examData);

    if (isNaN(examId)) {
      return res.status(400).json({ code: 400, message: '无效的考试ID' });
    }

    // 移除 ID，防止尝试更新主键
    delete examData.id; 
    // 确保 subjects 是字符串
    if (Array.isArray(examData.subjects)) {
       examData.subjects = examData.subjects.join(',');
    }
    
    // 调用 service 函数更新
    const updatedExam = await examService.updateExam(examId, examData);

    if (updatedExam) {
      res.json({ code: 200, message: '考试信息更新成功', data: updatedExam });
    } else {
      // 可能因为 ID 不存在而更新失败
      res.status(404).json({ code: 404, message: '更新考试失败，未找到指定ID的考试' });
    }

  } catch (error) {
    console.error(`[Server] 更新考试失败 (ID: ${req.params.id}):`, error);
    // 可以根据 service 抛出的具体错误类型进一步细化响应
     if (error.message && error.message.includes('格式无效')) {
       res.status(400).json({ code: 400, message: error.message });
     } else {
       res.status(500).json({
         code: 500,
         message: '更新考试信息时发生服务器内部错误: ' + error.message,
         data: null
       });
     }
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