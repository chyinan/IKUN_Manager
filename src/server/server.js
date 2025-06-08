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
const subjectService = require('./subjectService');
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
const cron = require('node-cron'); // <-- Add node-cron
const carouselService = require('./carouselService'); // <-- Import Carousel Service
const announcementService = require('./announcementService'); // <-- Import Announcement Service
const mailboxService = require('./mailboxService'); // <-- Import Mailbox Service
const crypto = require('crypto'); // 用于生成更安全的随机密钥（如果需要）

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

// --- Multer Configuration for Carousel Image Upload (New) ---
const carouselImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, carouselService.UPLOADS_DIR); // Uses absolute path from service
  },
  filename: function (req, file, cb) {
    const originalNameWithoutExt = path.parse(file.originalname).name;
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `${originalNameWithoutExt}-${uniqueSuffix}${extension}`);
  }
});

const carouselImageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('仅支持上传图片文件 (jpeg, png, gif, webp等)'), false);
  }
};

const carouselImageUpload = multer({
  storage: carouselImageStorage,
  fileFilter: carouselImageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
// --- End Multer Configuration for Carousel Image Upload ---

// --- JWT Secret (IMPORTANT: Use environment variable in production!) ---
// 统一 JWT Secret 来源，优先从 config 文件读取
const configuredSecret = config.jwt?.secret;
const envSecret = process.env.JWT_SECRET;
// 生成一个仅用于本次运行的、更安全的备用密钥（如果其他密钥源都缺失）
// 但仍然强烈建议通过配置提供稳定密钥
const generatedFallbackSecret = crypto.randomBytes(32).toString('hex');
const unsafeHardcodedFallback = 'YOUR_TEMPORARY_SECRET_KEY_CHANGE_ME_AND_DO_NOT_USE_IN_PROD';

let JWT_SECRET;
let secretSource = 'unknown';

if (configuredSecret) {
    JWT_SECRET = configuredSecret;
    secretSource = 'config.jwt.secret';
} else if (envSecret) {
    JWT_SECRET = envSecret;
    secretSource = 'process.env.JWT_SECRET';
} else {
    // 在开发时，如果前两者都没有，我们"可以"使用一个不安全的硬编码值以便运行，
    // 但在生产中这是绝对禁止的。更好的做法是如果密钥缺失就直接启动失败。
    // 为了让开发流程不中断，这里暂时使用不安全的硬编码值，并给出严重警告。
    JWT_SECRET = unsafeHardcodedFallback; 
    secretSource = 'unsafe_hardcoded_fallback';
}

let JWT_EXPIRES_IN = config.jwt?.expiresIn || '24h'; 

// 日志记录和警告
if (secretSource === 'config.jwt.secret') {
    console.log(`[Server.js] Using JWT_SECRET from ${secretSource}.`);
} else if (secretSource === 'process.env.JWT_SECRET') {
    console.log(`[Server.js] Using JWT_SECRET from ${secretSource}.`);
} else if (secretSource === 'unsafe_hardcoded_fallback') {
    console.error(`
        ****************************************************************************************
        [Server.js] CRITICAL SECURITY WARNING:
        JWT_SECRET is using a DANGEROUS hardcoded fallback value: '${unsafeHardcodedFallback}'.
        This configuration is INSECURE and MUST NOT be used in production.
        Please define 'secret' in 'src/server/config.js' (within a jwt object)
        or set the JWT_SECRET environment variable.
        ****************************************************************************************
    `);
}

if (JWT_EXPIRES_IN === '24h' && config.jwt?.expiresIn !== '24h') { 
    console.log(`[Server.js] JWT_EXPIRES_IN is using default value '24h'. Consider setting 'expiresIn' in 'config.jwt'.`);
}

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
    console.log('[Auth DEBUG] Token verified successfully. User:', user); // user here includes id, username, role
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
  // MODIFIED: Check role for admin status
  if (req.user.role === 'admin') { 
    console.log(`[Admin Check] User ${req.user.username} with role ${req.user.role} is admin.`);
    next(); // User is admin, proceed
  } else {
    console.log(`[Admin Check] User ${req.user.username} with role ${req.user.role} is NOT admin.`);
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
  console.log(`收到登录请求: 用户名/学号=${username}`);

  if (!username || !password) {
    return res.status(400).json({ code: 400, message: '用户名/学号和密码不能为空' });
  }

  try {
    // userService.loginUser now returns { token, data: { ..., display_name, ... } }
    const result = await userService.loginUser(username, password); 
    console.log(`用户 ${result.data.username} (显示名: ${result.data.display_name || 'N/A'}, ID: ${result.data.id}, Role: ${result.data.role}) 登录成功`);

    // After successful login, immediately fetch the complete user info using the user ID
    const fullUserInfo = await userService.findUserById(result.data.id);
    if (!fullUserInfo) {
      // This case is unlikely but good to handle
      throw new Error('登录成功后无法立即获取完整的用户信息');
    }

    const { password: P, ...userSafeInfo } = fullUserInfo;
    const avatarUrl = userSafeInfo.avatar ? `/uploads/${userSafeInfo.avatar}` : null;
    
    // Combine the token with the complete, safe user info
    const responseData = {
      token: result.token,
      ...userSafeInfo, // Spread all safe user info
      avatar: avatarUrl, // Override avatar with the correct URL
    };

    res.json({
      code: 200,
      message: '登录成功',
      data: responseData,
    });
  } catch (error) {
    console.error(`登录失败: 用户名/学号=${username}, 错误:`, error.message, error.stack); // Log stack for better debugging

    let statusCode = 500;
    let responseMessage = '登录失败，请稍后重试或联系管理员';

    if (error.message === '用户不存在或学号不存在' || 
        error.message === '密码错误' || 
        error.message === '学生首次登录密码错误') {
      statusCode = 401; // Unauthorized
      responseMessage = error.message;
    } else if (error.message === '账户创建失败：用户名冲突' ||
               error.message === '更新学生用户ID失败' || 
               error.message === '账户创建失败' ||
               error.message === '用户数据异常，请联系管理员' ||
               error.message === '系统配置错误：缺少学生默认密码设置。') {
        statusCode = 400; // Bad request or specific operational failure
        responseMessage = error.message;
    } else if (error.message === '更新学生表关联用户ID时数据库出错') { // Added condition
        statusCode = 500; // Server-side DB error
        responseMessage = error.message; // Use the specific error message from userService
    }
    // For any other errors, it will use the default 500 and generic message

    res.status(statusCode).json({ code: statusCode, message: responseMessage, error: error.message });
  }
});

// 获取用户信息 (需要认证)
app.get(`${apiPrefix}/user/info`, authenticateToken, async (req, res) => {
  try {
    // req.user from token might now also include display_name if added to JWT payload
    // userService.findUserById NOW returns display_name
    const userInfoFromDb = await userService.findUserById(req.user.id); 
    if (!userInfoFromDb) {
      console.warn(`[User Info] User ID ${req.user.id} found in token but not in DB.`);
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }

    const { password, ...userSafeInfo } = userInfoFromDb;
    const avatarUrl = userSafeInfo.avatar ? `/uploads/${userSafeInfo.avatar}` : null;

    res.json({
      code: 200,
      data: {
        id: userSafeInfo.id,
        username: userSafeInfo.username,
        email: userSafeInfo.email,
        role: userSafeInfo.role, 
        avatar: avatarUrl, 
        display_name: userSafeInfo.display_name, // Ensure display_name is included
        phone: userSafeInfo.phone, 
        studentInfo: userSafeInfo.studentInfo || null 
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

// 新增：用户更新自己的个人信息 (邮箱和电话)
app.put(`${apiPrefix}/user/profile`, authenticateToken, async (req, res) => {
  const userId = req.user.id; 
  const { email, phone, display_name } = req.body; // Add display_name here
  const operator = req.user.username;

  console.log(`[User Profile Update] User ${operator} (ID: ${userId}) attempting to update profile with:`, { email, phone, display_name });

  const dataToUpdate = {};
  if (email !== undefined) {
    dataToUpdate.email = email;
  }
  if (phone !== undefined) {
    dataToUpdate.phone = phone;
  }
  if (display_name !== undefined) { // Add display_name to dataToUpdate
    dataToUpdate.display_name = display_name;
  }

  if (Object.keys(dataToUpdate).length === 0) {
    return res.status(400).json({ code: 400, message: '未提供可更新的邮箱、电话或显示名称信息' });
  }

  try {
    // userService.updateUser can now handle display_name
    const success = await userService.updateUser(userId, dataToUpdate, operator); 

    if (success) {
      console.log(`[User Profile Update] Profile updated successfully for user ID: ${userId}`);
      await logService.addLogEntry({
        type: 'user',
        operation: '更新个人资料',
        content: `用户 '${operator}' 更新了个人资料 (${Object.keys(dataToUpdate).join(', ')})。`,
        operator: operator,
        user_id: userId // Added user_id for better tracking
      });
      
      const updatedUserInfo = await userService.findUserById(userId); 
      const { password, ...userSafeInfo } = updatedUserInfo;
      const avatarUrl = userSafeInfo.avatar ? `/uploads/${userSafeInfo.avatar}` : null;
    
    res.json({
      code: 200,
        message: '个人资料更新成功',
        data: {
          id: userSafeInfo.id,
          username: userSafeInfo.username,
          email: userSafeInfo.email,
          role: userSafeInfo.role,
          avatar: avatarUrl, 
          display_name: userSafeInfo.display_name, // Ensure display_name is included in response
          phone: userSafeInfo.phone,
          studentInfo: userSafeInfo.studentInfo || null 
        }
      });
    } else {
      console.warn(`[User Profile Update] Profile update did not result in changes for user ID: ${userId}. User might not exist or data was same.`);
      res.status(400).json({ code: 400, message: '个人资料更新失败或未更改任何信息' });
    }
  } catch (error) {
    console.error(`[User Profile Update] Error updating profile for user ID ${userId}:`, error);
    if (error.message && (error.message.includes('无效的邮箱格式') || error.message.includes('手机号码格式不正确') || error.message.includes('该邮箱已被其他用户注册'))) {
        return res.status(400).json({ code: 400, message: error.message });
    }
    res.status(500).json({ code: 500, message: '更新个人资料时发生服务器内部错误: ' + error.message });
  }
});

// --- Config Routes ---
// GET /api/config/regex - 移除 authenticateToken 和 isAdmin，允许公开访问
app.get(`${apiPrefix}/config/regex`, async (req, res) => {
  try {
    console.log('获取正则表达式和日志保留天数配置 (公开访问)');
    const configData = await db.getAllConfig(); // getAllConfig now includes logRetentionDays
    // Prepare the data for the frontend, ensuring logRetentionDays is a number
    const responseConfig = {
      studentIdRegex: configData.studentIdRegex || '',
      employeeIdRegex: configData.employeeIdRegex || '',
      logRetentionDays: parseInt(configData.logRetentionDays || '0', 10) // Convert to number, default 0
    };
    res.json({
      code: 200,
      data: responseConfig,
      message: '获取成功'
    });
  } catch (error) {
    console.error('获取系统配置失败:', error);
    res.status(500).json({ code: 500, message: '获取系统配置失败', data: null });
  }
});

// PUT /api/config/regex - 保留 authenticateToken 和 isAdmin，需要管理员权限
// Renamed for clarity, but keeping the route for now to match frontend API call
app.put(`${apiPrefix}/config/regex`, authenticateToken, isAdmin, async (req, res) => {
  const { studentIdRegex, employeeIdRegex, logRetentionDays } = req.body;
  console.log('更新系统配置:', req.body);

  // Basic validation
  if (typeof studentIdRegex !== 'string' || typeof employeeIdRegex !== 'string') {
    return res.status(400).json({ code: 400, message: '无效的正则表达式配置值，必须为字符串' });
  }
  const retentionDays = parseInt(logRetentionDays, 10);
  if (isNaN(retentionDays) || retentionDays < 0 || retentionDays > 365) {
      return res.status(400).json({ code: 400, message: '无效的日志保留天数，必须是 0 到 365 之间的数字' });
  }

  try {
    // Update sequentially and check results
    const studentUpdateSuccess = await db.updateConfig('studentIdRegex', studentIdRegex);
    const employeeUpdateSuccess = await db.updateConfig('employeeIdRegex', employeeIdRegex);
    const logUpdateSuccess = await db.updateConfig('logRetentionDays', String(retentionDays)); // Store as string

    if (studentUpdateSuccess && employeeUpdateSuccess && logUpdateSuccess) {
        console.log('成功将配置写入数据库');
        // Schedule the cron job immediately after successful update
        // (Or restart it if it was already running with old config)
        scheduleLogCleanup(); // Reschedule with new value
        res.json({ code: 200, message: '系统配置更新成功' });
    } else {
        console.error('至少有一个配置项未能成功更新数据库');
        res.status(500).json({ code: 500, message: '更新系统配置时数据库操作失败' });
    }

  } catch (error) {
    console.error('更新系统配置路由处理失败:', error);
    res.status(500).json({ code: 500, message: '更新系统配置时发生服务器内部错误' });
  }
});

// --- Carousel Interval Config Routes (New) ---
// GET /api/config/carousel-interval - 允许公开访问以供学生端轮播图使用
app.get(`${apiPrefix}/config/carousel-interval`, async (req, res) => {
  try {
    console.log('获取轮播图切换时间配置');
    const configData = await db.getAllConfig();
    const interval = configData.carouselInterval ? parseInt(configData.carouselInterval, 10) : 5000; // 默认5秒
    res.json({
      code: 200,
      data: { carouselInterval: interval },
      message: '获取轮播图切换时间成功'
    });
  } catch (error) {
    console.error('获取轮播图切换时间失败:', error);
    res.status(500).json({ code: 500, message: '获取轮播图切换时间失败', data: null });
  }
});

// PUT /api/config/carousel-interval - 需要管理员权限
app.put(`${apiPrefix}/config/carousel-interval`, authenticateToken, isAdmin, async (req, res) => {
  const { carouselInterval } = req.body;
  console.log('更新轮播图切换时间配置:', req.body);

  const interval = parseInt(carouselInterval, 10);
  if (isNaN(interval) || interval <= 0) {
    return res.status(400).json({ code: 400, message: '无效的轮播图切换时间，必须是正整数 (毫秒)' });
  }

  try {
    const updateSuccess = await db.updateConfig('carouselInterval', String(interval));

    if (updateSuccess) {
      console.log('成功将轮播图切换时间写入数据库');
      // 不需要像日志清理那样重新调度任务
      res.json({ code: 200, message: '轮播图切换时间更新成功' });
    } else {
      console.error('轮播图切换时间未能成功更新数据库');
      res.status(500).json({ code: 500, message: '更新轮播图切换时间时数据库操作失败' });
    }
  } catch (error) {
    console.error('更新轮播图切换时间路由处理失败:', error);
    res.status(500).json({ code: 500, message: '更新轮播图切换时间时发生服务器内部错误' });
  }
});
// --- End Carousel Interval Config Routes ---

// --- Cron Job for Log Cleanup ---
let scheduledTask = null;

async function runLogCleanup() {
    console.log('[Cron Job] Running scheduled log cleanup...');
    try {
        const configData = await db.getAllConfig(); // Fetch latest config
        const retentionDays = parseInt(configData.logRetentionDays || '0', 10);

        if (retentionDays > 0) {
            console.log(`[Cron Job] Log retention is set to ${retentionDays} days. Cleaning up...`);
            const deletedCount = await logService.deleteOldLogs(retentionDays);
            console.log(`[Cron Job] Log cleanup finished. Deleted ${deletedCount} entries.`);
            // Log success via logService if needed (deleteOldLogs might already do this)
        } else {
            console.log('[Cron Job] Log retention is disabled (0 days). Skipping cleanup.');
        }
  } catch (error) {
        console.error('[Cron Job] Error during scheduled log cleanup:', error);
        // Log error via logService
        logService.addLogEntry({
            type: 'error',
            operation: '定时日志清理失败',
            content: `执行定时日志清理任务时出错: ${error.message}`,
            operator: 'system-cron'
        });
    }
}

function scheduleLogCleanup() {
    // Stop existing task if it's running
    if (scheduledTask) {
        scheduledTask.stop();
        console.log('[Cron Job] Stopped existing log cleanup task.');
    }

    // Schedule the task to run daily at 2:00 AM
    // cron format: second minute hour day-of-month month day-of-week
    scheduledTask = cron.schedule('0 2 * * *', runLogCleanup, {
        scheduled: true,
        timezone: "Asia/Shanghai" // Set your server's timezone
    });
    console.log('[Cron Job] Scheduled log cleanup task to run daily at 2:00 AM.');

    // Optional: Run once immediately on schedule setup (or server start)
    // runLogCleanup();
}

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
        // Complete failure from service
        res.status(500).json({
          code: 500,
            message: '导入失败：服务器在处理数据时发生错误', 
            data: { addedCount: result.addedCount || 0, errors: finalErrors } 
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

// **新增：添加学生 (需要认证)**
app.post(`${apiPrefix}/student/add`, authenticateToken, async (req, res) => {
  try {
    const studentData = req.body;
    console.log('[Server] 收到添加学生请求:', studentData);

    // 后端也进行基本验证 (Service层会有更详细的验证)
    // 注意：前端传来的字段是驼峰命名 (studentId, className, joinDate)
    if (!studentData.studentId || !studentData.name || !studentData.gender || !studentData.className || !studentData.joinDate) {
      return res.status(400).json({ code: 400, message: '缺少必要的学生信息' });
    }

    // 准备提交给 Service 的数据 (确保字段名匹配 Service 期望的 snake_case)
    const serviceData = {
        student_id: studentData.studentId, // 转换为 snake_case
        name: studentData.name,
        gender: studentData.gender,
        className: studentData.className, // Service 会根据 className 查找 class_id
        phone: studentData.phone || null,
        email: studentData.email || null,
        join_date: studentData.joinDate // 转换为 snake_case
    };

    // 调用 service 函数添加
    const newStudent = await studentService.addStudent(serviceData); // studentService.addStudent 应该处理验证和添加

    if (newStudent) {
      // 添加成功，返回 201 Created 和新学生数据
      res.status(201).json({ code: 201, message: '学生添加成功', data: newStudent });
    } else {
      // 如果 service 返回 null 或 false，通常意味着发生了预期之外的错误
      res.status(500).json({ code: 500, message: '添加学生失败，请检查服务日志' });
    }

  } catch (error) {
    console.error('[Server] 添加学生失败:', error);
    // 处理 Service 层可能抛出的特定错误
    if (error.message === '学号格式无效' || error.message === '学号已存在' || (error.message && error.message.includes('班级') && error.message.includes('不存在'))) {
        // 对于验证错误或冲突，返回 400 Bad Request 或 409 Conflict
        res.status(400).json({ code: 400, message: error.message });
    } else if (error.message === '缺少必要的学生信息') {
        res.status(400).json({ code: 400, message: error.message });
    } else {
      // 其他未知错误，返回 500 Internal Server Error
    res.status(500).json({
      code: 500,
        message: '添加学生时发生服务器内部错误: ' + error.message,
      data: null
    });
    }
  }
});

// **新增：删除学生 (需要认证)**
app.delete(`${apiPrefix}/student/:id`, authenticateToken, async (req, res) => {
  try {
    const studentId = parseInt(req.params.id, 10);
    console.log(`[Server] 收到删除学生请求: ID=${studentId}`);

    if (isNaN(studentId)) {
      return res.status(400).json({ code: 400, message: '无效的学生ID' });
    }

    // 调用 service 函数删除
    // studentService.deleteStudent 应该返回 { success: boolean, student_id_str: string | null }
    const result = await studentService.deleteStudent(studentId); 

    if (result.success) {
      res.json({ code: 200, message: `学生 (学号: ${result.student_id_str || studentId}) 删除成功` });
    } else {
      // 如果 service 返回 success: false，通常意味着未找到记录
      res.status(404).json({ code: 404, message: `删除学生失败，未找到ID为 ${studentId} 的学生` });
    }

  } catch (error) {
    console.error(`[Server] 删除学生失败 (ID: ${req.params.id}):`, error);
    // 处理特定数据库错误，例如外键约束 (如果 service 层没有处理)
    // if (error.code === 'ER_ROW_IS_REFERENCED_2') { ... }
    res.status(500).json({
      code: 500,
      message: '删除学生时发生服务器内部错误: ' + error.message,
      data: null
    });
  }
});

// **新增：导入学生数据 (需要认证)**
app.post(`${apiPrefix}/student/import`, authenticateToken, importUpload.single('file'), async (req, res) => {
  console.log('[Server] Received request for /api/student/import');
  if (!req.file) {
    console.log('[Server] No file uploaded for student import.');
    return res.status(400).json({ code: 400, message: '未上传文件' });
  }

  console.log(`[Server] Processing uploaded file: ${req.file.originalname}, size: ${req.file.size}, type: ${req.file.mimetype}`);

  try {
    let students = [];
    const buffer = req.file.buffer;

    // --- Parse file based on type ---
    if (req.file.mimetype === 'text/csv') {
      console.log('[Server Student Import] Parsing CSV...');
      const csvString = buffer.toString('utf8');
      const parseResult = papaparse.parse(csvString, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
      });

      if (parseResult.errors.length > 0) {
        console.error('[Server Student Import] CSV parsing errors:', parseResult.errors);
        return res.status(400).json({ code: 400, message: 'CSV文件解析失败', data: { errors: parseResult.errors } });
      }
      students = parseResult.data;
    } else if (req.file.mimetype.startsWith('application/vnd.openxmlformats-officedocument') || req.file.mimetype === 'application/vnd.ms-excel') {
        console.log('[Server Student Import] Parsing Excel...');
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        students = xlsx.utils.sheet_to_json(worksheet, {
            raw: false,
            dateNF: 'yyyy-mm-dd'
        });
    } else {
        return res.status(400).json({ code: 400, message: '不支持的文件类型' });
    }
    console.log(`[Server Student Import] Parsed ${students.length} rows.`);

    // --- Data Validation and Transformation ---
    const processedStudents = [];
    const validationErrors = [];
    const requiredFields = ['学号', '姓名', '性别', '所属班级', '入学时间']; // Headers expected in the file
    const studentIdRegex = /^S\d{7}$/; // Use hardcoded regex literal for validation
    console.log(`[Server Student Import] Using hardcoded regex for validation: ${studentIdRegex}`);

    for (let i = 0; i < students.length; i++) {
        const row = students[i];
        const rowNum = i + 2; // Assuming header is row 1
        const rowErrors = [];

        // 1. Check for required fields
        for (const field of requiredFields) {
            if (row[field] === undefined || row[field] === null || String(row[field]).trim() === '') {
                rowErrors.push(`缺少必需字段 '${field}'`);
            }
        }

        // 2. Validate student_id format (use trimmed value)
        const studentId = String(row['学号'] || '').trim();
        if (studentId && !studentIdRegex.test(studentId)) {
            rowErrors.push(`学号 '${studentId}' 格式不符合规则 (${studentIdRegex})`);
        }

        // 3. Validate date format (simple check, similar to employee import)
        const joinDate = row['入学时间'];
        let formattedJoinDate = null;
        if (joinDate) {
            if (dayjs(joinDate, ['YYYY-MM-DD', 'YYYY/MM/DD'], true).isValid()) {
                formattedJoinDate = dayjs(joinDate).format('YYYY-MM-DD');
            } else if (typeof joinDate === 'number' && joinDate > 1) {
                try {
                    const parsedDate = xlsx.SSF.parse_date_code(joinDate);
                    formattedJoinDate = dayjs(new Date(parsedDate.y, parsedDate.m - 1, parsedDate.d)).format('YYYY-MM-DD');
                } catch (dateParseError) {
                    rowErrors.push(`入学时间 '${joinDate}' 格式无效 (非标准日期或Excel序列号)`);
                }
            } else {
                 rowErrors.push(`入学时间 '${joinDate}' 格式无效 (预期 YYYY-MM-DD 或 YYYY/MM/DD)`);
            }
        } // If joinDate is missing, it's already caught by requiredFields check

        if (rowErrors.length > 0) {
            validationErrors.push({ row: rowNum, errors: rowErrors, rowData: row });
        } else {
            // Transform keys and prepare data for service
             processedStudents.push({
                student_id: studentId, // Use validated & trimmed ID
                name: String(row['姓名']).trim(),
                gender: String(row['性别']).trim(),
                class_name: String(row['所属班级']).trim(), // Pass className to service
                phone: row['联系电话'] ? String(row['联系电话']).trim() : null,
                email: row['邮箱'] ? String(row['邮箱']).trim() : null,
                join_date: formattedJoinDate // Use formatted date
            });
        }
    }

    console.log(`[Server Student Import] Validation complete. Valid: ${processedStudents.length}, Invalid: ${validationErrors.length}`);

    if (processedStudents.length === 0 && validationErrors.length > 0) {
      return res.status(400).json({
        code: 400,
            message: '导入失败：文件内容校验未通过',
            data: { errors: validationErrors }
      });
    }
    
    // --- Call Service to Batch Add/Update ---
    // studentService.batchAddStudents should handle className -> classId lookup
    const result = await studentService.batchAddStudents(processedStudents);
    
    // --- Construct Response (Similar to Employee/Dept Import) ---
    const finalErrors = [...validationErrors, ...(result.errors || [])]; // Combine validation and DB errors

    if (result.success && finalErrors.length === 0) {
    res.json({
        code: 200, // Use 200 for success
        message: `导入成功！共处理 ${result.processedCount} 条记录。`,
        data: { processedCount: result.processedCount, errors: [] }
      });
    } else if (result.success && finalErrors.length > 0) {
        res.status(200).json({ // Use 200 for partial success, but include errors
            code: 200, // Signal overall process completed, but check data.errors
            message: `导入完成（部分成功）。处理 ${result.processedCount} 条，失败/跳过 ${finalErrors.length} 条。`,
            data: { processedCount: result.processedCount, errors: finalErrors }
        });
    } else {
        // Complete failure from service
    res.status(500).json({
      code: 500,
            message: '导入失败：服务器在处理数据时发生错误',
            data: { processedCount: result.processedCount || 0, errors: finalErrors }
        });
    }

  } catch (error) {
    console.error('[Server Student Import] Import failed:', error);
    res.status(500).json({
      code: 500,
      message: '处理导入文件时发生服务器内部错误: ' + error.message,
      data: null
    });
  }
});

// 获取考试列表 (需要认证)
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
    const result = await scoreService.getScoreList(req.query);
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

// **新增：清空所有日志 (需要认证和管理员权限)**
app.delete(`${apiPrefix}/log/clear`, authenticateToken, isAdmin, async (req, res) => {
  try {
    console.log(`[Server] Received request to clear all logs by user: ${req.user.username}`);
    const success = await logService.clearLogs(); // Assuming clearLogs returns boolean or throws error

    if (success) {
      res.json({ code: 200, message: '所有系统日志已成功清空' });
      // Optionally add a log entry for this action itself (if clearLogs doesn't do it)
      logService.addLogEntry({
        type: 'system',
        operation: '清空日志',
        content: '所有系统日志已被清空',
        operator: req.user.username // Log which admin performed the action
      });
    } else {
      // This case might not be reachable if clearLogs throws on failure
      res.status(500).json({ code: 500, message: '清空日志操作失败，但未抛出错误' });
    }
  } catch (error) {
    console.error('[Server] 清空日志失败:', error);
    logService.addLogEntry({ // Log the failure
      type: 'error',
      operation: '清空日志失败',
      content: `尝试清空日志时发生错误: ${error.message}`,
      operator: req.user?.username || 'system' // Use optional chaining for req.user
    });
    res.status(500).json({
      code: 500,
      message: '清空日志时发生服务器内部错误: ' + error.message,
      data: null
    });
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

// 新增：获取学生统计数据 (需要认证)
app.get(`${apiPrefix}/student/stats`, authenticateToken, async (req, res) => {
  try {
    console.log('收到学生统计数据请求');
    const stats = await studentService.getStudentStats(); // 使用 studentService
    console.log('学生统计数据:', stats);
    res.json({ 
      code: 200,
      data: stats,
      message: '获取学生统计数据成功'
    });
  } catch (error) {
    console.error('获取学生统计数据失败:', error);
    res.status(500).json({ 
      code: 500,
      message: '获取学生统计数据失败',
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
    const scoreData = req.body; // Frontend sends { studentId, examId, scores: { subject: score, ... } }
    const operator = req.user.username; // Get operator
    console.log(`[Server] 收到保存成绩请求:`, scoreData, `操作人: ${operator}`);

    // Basic validation on the request body structure
    if (!scoreData.studentId || !scoreData.examId || !scoreData.scores || typeof scoreData.scores !== 'object') {
      return res.status(400).json({ code: 400, message: '无效的请求数据：缺少学生ID、考试ID或成绩信息' });
    }

    // Prepare data for the service layer (Map studentId to student_id, examId to exam_id if needed by service)
    // Current service saveStudentScore expects student_id and exam_id in the data object.
    const serviceData = {
      student_id: scoreData.studentId,
      exam_id: scoreData.examId,
      ...scoreData.scores // Spread the scores object
    };

    console.log('[Server] 调用 scoreService.saveStudentScore 的数据:', serviceData);
    // Pass operator to the service function
    const success = await scoreService.saveStudentScore(serviceData, operator);

    if (success) {
      res.json({ code: 200, message: '成绩保存成功' });
    } else {
      // If service returns false, it likely means transaction failed internally
      res.status(500).json({ code: 500, message: '保存成绩时发生服务器内部错误' });
    }

  } catch (error) {
    console.error('[Server] 保存成绩失败 (路由处理):', error);
    // Handle specific errors if the service throws them
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
    const operator = req.user.username; // Get operator

    console.log(`[Server] 收到更新考试请求: ID=${examId}, 操作人: ${operator}, 数据:`, examData);

    if (isNaN(examId)) {
      return res.status(400).json({ code: 400, message: '无效的考试ID' });
    }
    
    // delete examData.id; // examService.updateExam handles this
    // if (Array.isArray(examData.subjects)) { // examService.updateExam handles this
    //    examData.subjects = examData.subjects.join(',');
    // }
    
    const updatedExam = await examService.updateExam(examId, examData, operator);

    if (updatedExam) {
      res.json({ code: 200, message: '考试信息更新成功', data: updatedExam });
    } else {
      res.status(404).json({ code: 404, message: '更新考试失败，未找到指定ID的考试' });
    }

  } catch (error) {
    console.error(`[Server] 更新考试失败 (ID: ${req.params.id}):`, error);
     if (error.message && (error.message.includes('格式无效') || error.message.includes('不能为空'))) {
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
      // Schedule the log cleanup task when server starts
      scheduleLogCleanup();
    });

    // Socket.IO connection handling
    io.on('connection', (socket) => {
      console.log(`客户端已连接: ${socket.id}`);
      // Fix: Pass log data as an object
      logService.addLogEntry({
        type: 'system', 
        operation: 'connect', 
        content: `客户端连接: ${socket.id}`,
        operator: 'System'
      });
      socket.emit('connectionSuccess', { message: '成功连接到服务器 Socket.IO' });

      socket.on('disconnect', (reason) => {
        console.log(`客户端已断开: ${socket.id}, 原因: ${reason}`);
        // Fix: Pass log data as an object
        logService.addLogEntry({
          type: 'system',
          operation: 'disconnect',
          content: `客户端断开: ${socket.id}, 原因: ${reason}`,
          operator: 'System'
        });
      });

      socket.on('error', (error) => {
        console.error(`Socket.IO 错误 from ${socket.id}:`, error);
        // Fix: Pass log data as an object
        logService.addLogEntry({
          type: 'error', 
          operation: 'socket_error', 
          content: `Socket.IO 错误: ${error.message}`,
          operator: 'System'
        });
      });
    });

  } catch (error) {
    console.error('启动服务器失败:', error);
    logService.addLogEntry('system', 'error', `服务器启动失败: ${error.message}`, 'System');
    process.exit(1);
  }
}

// startServer(); // <--- 注释掉或删除此处的调用

// **新增：添加考试 (需要认证)**
app.post(`${apiPrefix}/exam/add`, authenticateToken, async (req, res) => {
  try {
    const examDataFromRequest = req.body;
    const operator = req.user.username;
    console.log('[Server] 收到添加考试请求:', examDataFromRequest, '操作人:', operator);

    // --- Basic Validation (using frontend field names) ---
    if (!examDataFromRequest.exam_name || !examDataFromRequest.exam_type || !examDataFromRequest.start_time || !examDataFromRequest.end_time) {
      return res.status(400).json({ code: 400, message: '考试名称、类型、开始时间和结束时间不能为空' });
    }
    
    // --- Data Transformation for Service Layer ---
    let duration = null;
    try {
        const start = dayjs(examDataFromRequest.start_time);
        const end = dayjs(examDataFromRequest.end_time);
        if (start.isValid() && end.isValid() && end.isAfter(start)) {
            duration = end.diff(start, 'minute'); // Calculate duration in minutes
    } else {
            return res.status(400).json({ code: 400, message: '结束时间必须晚于开始时间或日期格式无效' });
        }
    } catch (e) {
        return res.status(400).json({ code: 400, message: '处理日期时出错，请检查格式' });
    }

    const examDataForService = {
        exam_name: examDataFromRequest.exam_name,
        exam_type: examDataFromRequest.exam_type,
        exam_date: examDataFromRequest.start_time, // Map start_time to exam_date
        duration: duration,                         // Use calculated duration
        subjects: examDataFromRequest.subjects || '', // Pass subjects if available, default to empty string
        status: examDataFromRequest.status !== undefined ? examDataFromRequest.status : 0, // Pass status or default
        remark: examDataFromRequest.description || null // Map description to remark
    };
    console.log('[Server] 准备传递给 examService.addExam 的数据:', examDataForService);

    // --- Call Service with transformed data ---
    const newExam = await examService.addExam(examDataForService, operator); 

    res.status(201).json({ code: 201, message: '考试添加成功', data: newExam });

  } catch (error) {
    console.error('[Server] 添加考试失败:', error);
    // Keep existing error handling for validation/DB errors from service
    if (error.message && (error.message.includes('不能为空') || error.message.includes('格式无效'))) {
        res.status(400).json({ code: 400, message: error.message });
    } else {
    res.status(500).json({
      code: 500,
        message: '添加考试时发生服务器内部错误: ' + error.message,
      data: null
    });
  }
  }
});

// **新增：删除考试 (需要认证)**
app.delete(`${apiPrefix}/exam/:id`, authenticateToken, async (req, res) => {
  try {
    const examId = parseInt(req.params.id, 10);
    const operator = req.user.username; // Get operator
    console.log(`[Server] 收到删除考试请求: ID=${examId}, 操作人: ${operator}`);

    if (isNaN(examId)) {
      return res.status(400).json({ code: 400, message: '无效的考试ID' });
    }

    const success = await examService.deleteExam(examId, operator); 

    if (success) {
      res.json({ code: 200, message: `考试 ID ${examId} 删除成功` });
    } else {
      res.status(404).json({ code: 404, message: `删除考试失败，未找到ID为 ${examId} 的考试` });
    }

  } catch (error) {
    console.error(`[Server] 删除考试失败 (ID: ${req.params.id}):`, error);
    res.status(500).json({
      code: 500,
      message: '删除考试时发生服务器内部错误: ' + error.message,
      data: null
    });
  }
});

// 新增：获取班级成绩 (用于学生报告页面)
app.get(`${apiPrefix}/score/class/:classId`, authenticateToken, async (req, res) => {
  try {
    const classId = parseInt(req.params.classId, 10);
    const examType = req.query.examType; // 从查询参数获取 examType (移除 as string)

    console.log(`[Server] 收到获取班级成绩请求: classId=${classId}, examType=${examType}`);

    if (isNaN(classId)) {
      return res.status(400).json({ code: 400, message: '无效的班级ID' });
    }
    if (!examType) {
      return res.status(400).json({ code: 400, message: '缺少考试类型参数' });
    }

    // 调用 service 函数获取数据
    const scoreData = await scoreService.getClassScores(classId, examType);

    if (scoreData) {
    res.json({
      code: 200,
        message: '获取班级成绩成功',
        data: scoreData
    });
    } else {
      // getClassScores 可能会返回 null 或空数组，根据其实现处理
      res.status(404).json({ code: 404, message: '未找到指定班级或考试类型的成绩数据' });
    }

  } catch (error) {
    console.error(`[Server] 获取班级成绩失败 (classId: ${req.params.classId}):`, error);
    res.status(500).json({
      code: 500,
      message: '获取班级成绩时发生服务器内部错误: ' + error.message,
      data: null
    });
  }
});

// ... (Rest of the routes)

// --- Carousel Routes (New) ---
// GET /api/carousel (for public/student portal - only active images)
app.get(`${apiPrefix}/carousel`, async (req, res) => {
  try {
    const images = await carouselService.getCarouselImages(true); // true for onlyActive
    res.json({ code: 200, data: images, message: '获取轮播图成功' });
  } catch (error) {
    console.error('[API] Error fetching active carousel images:', error);
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// GET /api/carousel/all (for admin management - all images)
app.get(`${apiPrefix}/carousel/all`, authenticateToken, isAdmin, async (req, res) => {
  try {
    const images = await carouselService.getCarouselImages(false); // false for all images
    res.json({ code: 200, data: images, message: '获取所有轮播图成功' });
  } catch (error) {
    console.error('[API] Error fetching all carousel images for admin:', error);
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// POST /api/carousel (for admin to upload and add a new image)
// carouselImageUpload.single('imageFile') must match the FormData field name from frontend
app.post(`${apiPrefix}/carousel`, authenticateToken, isAdmin, carouselImageUpload.single('imageFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 400, message: '未收到图片文件' });
    }

    const { title, link_url, display_order, is_active } = req.body;
    const operator = req.user.username;

    const imageData = {
      image_filename: req.file.filename, // Multer provides filename
      title,
      link_url,
      display_order: display_order ? parseInt(display_order, 10) : 0,
      is_active: is_active !== undefined ? (is_active === 'true' || is_active === true || is_active === '1' || parseInt(is_active) === 1) : true
    };

    const newImage = await carouselService.addCarouselImage(imageData, operator);
    res.status(201).json({ code: 201, data: newImage, message: '轮播图添加成功' });
  } catch (error) {
    console.error('[API] Error adding carousel image:', error);
    // Handle Multer or service errors
    if (error.message && error.message.includes('仅支持上传图片文件')) {
        return res.status(400).json({ code: 400, message: error.message });
    }
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// PUT /api/carousel/:id (for admin to update image details)
app.put(`${apiPrefix}/carousel/:id`, authenticateToken, isAdmin, async (req, res) => {
  try {
    const imageId = parseInt(req.params.id, 10);
    if (isNaN(imageId)) {
      return res.status(400).json({ code: 400, message: '无效的轮播图ID' });
    }

    const { title, link_url, display_order, is_active } = req.body;
    const operator = req.user.username;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (link_url !== undefined) updateData.link_url = link_url;
    if (display_order !== undefined) updateData.display_order = parseInt(display_order, 10);
    if (is_active !== undefined) updateData.is_active = (is_active === 'true' || is_active === true || is_active === '1' || parseInt(is_active) === 1);

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ code: 400, message: '未提供任何更新数据' });
    }

    const updatedImage = await carouselService.updateCarouselImage(imageId, updateData, operator);
    if (!updatedImage) {
      return res.status(404).json({ code: 404, message: '轮播图未找到' });
    }
    res.json({ code: 200, data: updatedImage, message: '轮播图更新成功' });
  } catch (error) {
    console.error(`[API] Error updating carousel image ${req.params.id}:`, error);
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// DELETE /api/carousel/:id (for admin to delete an image)
app.delete(`${apiPrefix}/carousel/:id`, authenticateToken, isAdmin, async (req, res) => {
  try {
    const imageId = parseInt(req.params.id, 10);
    if (isNaN(imageId)) {
      return res.status(400).json({ code: 400, message: '无效的轮播图ID' });
    }
    const operator = req.user.username;

    const success = await carouselService.deleteCarouselImage(imageId, operator);
    if (!success) {
      return res.status(404).json({ code: 404, message: '轮播图未找到或删除失败' });
    }
    res.json({ code: 200, message: '轮播图删除成功' });
  } catch (error) {
    console.error(`[API] Error deleting carousel image ${req.params.id}:`, error);
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// POST /api/carousel/order (for admin to update display order of multiple images)
app.post(`${apiPrefix}/carousel/order`, authenticateToken, isAdmin, async (req, res) => {
  try {
    const orderUpdates = req.body.order; // Expects an array like [{id: 1, display_order: 0}, {id: 2, display_order: 1}]
    const operator = req.user.username;

    if (!Array.isArray(orderUpdates)) {
      return res.status(400).json({ code: 400, message: '请求体必须包含一个 \'order\' 数组' });
    }

    const success = await carouselService.updateCarouselOrder(orderUpdates, operator);
    if (success) {
      res.json({ code: 200, message: '轮播图顺序更新成功' });
    } else {
      // This case might be rare if service throws on actual failure
      res.status(500).json({ code: 500, message: '轮播图顺序部分或全部更新失败' });
    }
  } catch (error) {
    console.error('[API] Error updating carousel order:', error);
    res.status(500).json({ code: 500, message: error.message, data: null });
  }
});

// --- Student Score Report Routes (New) ---

// GET /api/student/:studentId/exams-taken - Get exams for which a student has scores
app.get(`${apiPrefix}/student/:studentId/exams-taken`, authenticateToken, async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId, 10);
    if (isNaN(studentId)) {
      return res.status(400).json({ code: 400, message: '无效的学生ID' });
    }

    // TODO: Implement scoreService.getExamsTakenByStudent(studentId)
    // This service function should return [{ exam_id, exam_name, exam_date }, ...]
    const exams = await scoreService.getExamsTakenByStudent(studentId);
    
    res.json({ code: 200, data: exams, message: '获取学生已参加的考试列表成功' });
  } catch (error) {
    console.error(`[API] Error fetching exams taken by student ${req.params.studentId}:`, error);
    res.status(500).json({ code: 500, message: '获取学生已参加的考试列表失败: ' + error.message, data: null });
  }
});

// GET /api/student/:studentId/exams-upcoming - Get upcoming exams for a student
app.get(`${apiPrefix}/student/:studentId/exams-upcoming`, authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.studentId, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ code: 400, message: '无效的用户ID' });
    }

    // Security check: a student can only view their own upcoming exams. An admin can view any.
    if (req.user.role === 'student' && req.user.id !== userId) {
      return res.status(403).json({ code: 403, message: '无权访问该学生的待考信息' });
    }

    const exams = await scoreService.getUpcomingExamsByStudent(userId);
    
    res.json({ code: 200, data: exams, message: '获取待考列表成功' });
  } catch (error) {
    console.error(`[API] Error fetching upcoming exams for user ${req.params.studentId}:`, error);
    res.status(500).json({ code: 500, message: '获取待考列表失败: ' + error.message, data: null });
  }
});

// GET /api/score-report/student/:studentId/exam/:examId - Get detailed score report
app.get(`${apiPrefix}/score-report/student/:studentId/exam/:examId`, authenticateToken, async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId, 10);
    const examId = parseInt(req.params.examId, 10);

    if (isNaN(studentId) || isNaN(examId)) {
      return res.status(400).json({ code: 400, message: '无效的学生ID或考试ID' });
    }

    // TODO: Implement scoreService.generateDetailedScoreReport(studentId, examId)
    // This service function will return the complex report object defined earlier
    const report = await scoreService.generateDetailedScoreReport(studentId, examId);

    if (!report) {
        return res.status(404).json({ code: 404, message: '未能生成成绩报告，可能未找到相关成绩或考试信息。' });
    }
    
    res.json({ code: 200, data: report, message: '获取详细成绩报告成功' });
  } catch (error) {
    console.error(`[API] Error generating score report for student ${req.params.studentId}, exam ${req.params.examId}:`, error);
    res.status(500).json({ code: 500, message: '生成详细成绩报告失败: ' + error.message, data: null });
  }
});
// --- End Student Score Report Routes ---

// --- Announcement Routes (New) ---
// GET /api/announcements (for student portal - only published announcements)
app.get(`${apiPrefix}/announcements`, authenticateToken, async (req, res) => {
  try {
    // req.query could be used for pagination in the future
    const announcements = await announcementService.getPublishedAnnouncements(req.query);
    res.json({ code: 200, data: announcements, message: '获取通知列表成功' });
  } catch (error) {
    console.error('[API] Error fetching published announcements:', error);
    res.status(500).json({ code: 500, message: '获取通知列表失败: ' + error.message, data: null });
  }
});

// GET /api/announcements/all (for admin management)
app.get(`${apiPrefix}/announcements/all`, authenticateToken, isAdmin, async (req, res) => {
  try {
    const announcements = await announcementService.getAllAnnouncements(req.query);
    res.json({ code: 200, data: announcements, message: '获取所有通知成功' });
  } catch (error) {
    console.error('[API] Error fetching all announcements for admin:', error);
    res.status(500).json({ code: 500, message: '后台获取所有通知失败: ' + error.message });
  }
});

// POST /api/announcements (for admin to create an announcement)
app.post(`${apiPrefix}/announcements`, authenticateToken, isAdmin, async (req, res) => {
  try {
    const newAnnouncement = await announcementService.createAnnouncement(req.body, req.user.username);
    res.status(201).json({ code: 201, data: newAnnouncement, message: '通知创建成功' });
  } catch (error) {
    console.error('[API] Error creating announcement:', error);
    if (error.message === '标题和内容不能为空') {
      return res.status(400).json({ code: 400, message: error.message });
    }
    res.status(500).json({ code: 500, message: '创建通知失败: ' + error.message });
  }
});

// PUT /api/announcements/:id (for admin to update an announcement)
app.put(`${apiPrefix}/announcements/:id`, authenticateToken, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ code: 400, message: '无效的通知ID' });

    const updatedAnnouncement = await announcementService.updateAnnouncement(id, req.body, req.user.username);
    res.json({ code: 200, data: updatedAnnouncement, message: '通知更新成功' });
  } catch (error) {
    console.error(`[API] Error updating announcement ${req.params.id}:`, error);
    if (error.message === '找不到要更新的通知') {
      return res.status(404).json({ code: 404, message: error.message });
    }
    res.status(500).json({ code: 500, message: '更新通知失败: ' + error.message });
  }
});

// DELETE /api/announcements/:id (for admin to delete an announcement)
app.delete(`${apiPrefix}/announcements/:id`, authenticateToken, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ code: 400, message: '无效的通知ID' });
    
    const success = await announcementService.deleteAnnouncement(id, req.user.username);
    if (!success) {
      return res.status(404).json({ code: 404, message: '删除失败，未找到通知' });
    }
    res.json({ code: 200, message: '通知删除成功' });
  } catch (error) {
    console.error(`[API] Error deleting announcement ${req.params.id}:`, error);
    res.status(500).json({ code: 500, message: '删除通知失败: ' + error.message });
  }
});
// --- End Announcement Routes ---

// --- Mailbox Routes (New) ---

// [Student] Get all threads for the currently logged-in student
app.get(`${apiPrefix}/mailbox/student-threads`, authenticateToken, async (req, res) => {
    try {
        const studentUserId = req.user.id;
        const threads = await mailboxService.getThreadsForStudent(studentUserId);
        res.json({ code: 200, data: threads, message: '获取我的消息列表成功' });
    } catch (error) {
        console.error(`[API] Error fetching threads for student ${req.user.id}:`, error);
        res.status(500).json({ code: 500, message: '获取消息列表失败: ' + error.message });
    }
});

// [Admin] Get all threads for admin view
app.get(`${apiPrefix}/mailbox/admin-threads`, authenticateToken, isAdmin, async (req, res) => {
    try {
        const threads = await mailboxService.getThreadsForAdmin(req.query);
        res.json({ code: 200, data: threads, message: '获取所有信箱主题成功' });
    } catch (error) {
        console.error(`[API] Error fetching all threads for admin:`, error);
        res.status(500).json({ code: 500, message: '获取信箱主题列表失败: ' + error.message });
    }
});

// [Student] Create a new thread
app.post(`${apiPrefix}/mailbox/threads`, authenticateToken, async (req, res) => {
    try {
        const { title, content } = req.body;
        const studentUserId = req.user.id;

        // Ensure only students can create threads
        if (req.user.role !== 'student') {
            return res.status(403).json({ code: 403, message: '只有学生才能发起新的对话' });
        }

        const newThread = await mailboxService.createThread(studentUserId, title, content);
        res.status(201).json({ code: 201, data: newThread, message: '建议发送成功' });
    } catch (error) {
        console.error('[API] Error creating new thread:', error);
        if (error.message.includes('不能为空')) {
             return res.status(400).json({ code: 400, message: error.message });
        }
        res.status(500).json({ code: 500, message: '发送建议失败: ' + error.message });
    }
});

// [Student & Admin] Get all messages for a single thread
app.get(`${apiPrefix}/mailbox/threads/:threadId`, authenticateToken, async (req, res) => {
    try {
        const threadId = parseInt(req.params.threadId, 10);
        if (isNaN(threadId)) return res.status(400).json({ code: 400, message: '无效的主题ID' });

        // Authorization: Check if user is the student who owns the thread OR an admin
        const threadOwnerId = await db.query('SELECT student_user_id FROM message_threads WHERE id = ?', [threadId]);
        const isOwner = threadOwnerId.length > 0 && threadOwnerId[0].student_user_id === req.user.id;
        const isAdminUser = req.user.role === 'admin';

        if (!isOwner && !isAdminUser) {
            return res.status(403).json({ code: 403, message: '无权访问此对话' });
        }

        const messages = await mailboxService.getMessagesInThread(threadId, req.user.id);
        res.json({ code: 200, data: messages, message: '获取对话详情成功' });
    } catch (error) {
        console.error(`[API] Error getting messages for thread ${req.params.threadId}:`, error);
        res.status(500).json({ code: 500, message: '获取对话详情失败: ' + error.message });
    }
});

// [Student & Admin] Post a reply in a thread
app.post(`${apiPrefix}/mailbox/threads/:threadId/reply`, authenticateToken, async (req, res) => {
    try {
        const threadId = parseInt(req.params.threadId, 10);
        if (isNaN(threadId)) return res.status(400).json({ code: 400, message: '无效的主题ID' });

        const { content } = req.body;
        const senderUserId = req.user.id;
        
        // Authorization check (same as getting messages)
        const threadOwnerId = await db.query('SELECT student_user_id FROM message_threads WHERE id = ?', [threadId]);
        const isOwner = threadOwnerId.length > 0 && threadOwnerId[0].student_user_id === req.user.id;
        const isAdminUser = req.user.role === 'admin';

        if (!isOwner && !isAdminUser) {
            return res.status(403).json({ code: 403, message: '无权回复此对话' });
        }

        const newReply = await mailboxService.replyToThread(threadId, senderUserId, content);
        res.status(201).json({ code: 201, data: newReply, message: '回复成功' });
    } catch (error) {
        console.error(`[API] Error replying to thread ${req.params.threadId}:`, error);
         if (error.message.includes('不能为空')) {
             return res.status(400).json({ code: 400, message: error.message });
        }
        res.status(500).json({ code: 500, message: '回复失败: ' + error.message });
    }
});

// [Admin] Update thread status
app.put(`${apiPrefix}/mailbox/threads/:threadId/status`, authenticateToken, isAdmin, async (req, res) => {
    try {
        const threadId = parseInt(req.params.threadId, 10);
        if (isNaN(threadId)) return res.status(400).json({ code: 400, message: '无效的主题ID' });

        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ code: 400, message: '缺少状态信息' });
        }
        
        const success = await mailboxService.updateThreadStatus(threadId, status, req.user.username);

        if (success) {
            res.json({ code: 200, message: '状态更新成功' });
        } else {
            res.status(404).json({ code: 404, message: '更新状态失败，未找到对应主题' });
        }
    } catch (error) {
        console.error(`[API] Error updating status for thread ${req.params.threadId}:`, error);
        if (error.message.includes('无效的状态')) {
            return res.status(400).json({ code: 400, message: error.message });
        }
        res.status(500).json({ code: 500, message: '更新状态失败: ' + error.message });
    }
});


// --- End Mailbox Routes ---

app.get(`${apiPrefix}/subject/list`, authenticateToken, async (req, res) => {
  try {
    // This route can be used by both admins for management and other authenticated users (e.g., in exam modal)
    // We can skip the isAdmin check here if all authenticated users are allowed to see the list.
    console.log('获取科目列表');
    const subjects = await subjectService.getSubjectList();
    res.json({
      code: 200,
      data: subjects.list, // Directly return the array for dropdowns
      message: '获取科目列表成功'
    });
  } catch (error) {
    console.error('获取科目列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取科目列表失败: ' + error.message,
      data: null
    });
  }
});

// POST /api/subject/add (for admin to add a new subject)
app.post(`${apiPrefix}/subject`, authenticateToken, isAdmin, async (req, res) => {
  try {
    const operator = req.user.username;
    console.log(`[API] Received request to add subject by ${operator}:`, req.body);
    const newSubject = await subjectService.addSubject(req.body, operator);
    res.status(201).json({ code: 201, data: newSubject, message: '科目添加成功' });
  } catch (error) {
    console.error('[API] Error adding subject:', error);
    if (error.message.includes('不能为空') || error.message.includes('已存在')) {
      return res.status(400).json({ code: 400, message: error.message });
    }
    res.status(500).json({ code: 500, message: '添加科目失败: ' + error.message });
  }
});

// PUT /api/subject/:id (for admin to update a subject)
app.put(`${apiPrefix}/subject/:id`, authenticateToken, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ code: 400, message: '无效的科目ID' });
    
    const operator = req.user.username;
    const updatedSubject = await subjectService.updateSubject(id, req.body, operator);
    
    if (!updatedSubject) {
      return res.status(404).json({ code: 404, message: '更新失败，未找到科目' });
    }
    res.json({ code: 200, data: updatedSubject, message: '科目更新成功' });
  } catch (error) {
    console.error(`[API] Error updating subject ${req.params.id}:`, error);
    if (error.message.includes('不能为空') || error.message.includes('已存在')) {
      return res.status(400).json({ code: 400, message: error.message });
    }
    res.status(500).json({ code: 500, message: '更新科目失败: ' + error.message });
  }
});

// DELETE /api/subject/:id (for admin to delete a subject)
app.delete(`${apiPrefix}/subject/:id`, authenticateToken, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ code: 400, message: '无效的科目ID' });

    const operator = req.user.username;
    const success = await subjectService.deleteSubject(id, operator);

    if (!success) {
      return res.status(404).json({ code: 404, message: '删除失败，未找到该科目' });
    }
    res.json({ code: 200, message: '科目删除成功' });
  } catch (error) {
    console.error(`[API] Error deleting subject ${req.params.id}:`, error);
     if (error.message.includes('无法删除')) {
      return res.status(400).json({ code: 400, message: error.message });
    }
    res.status(500).json({ code: 500, message: '删除科目失败: ' + error.message });
  }
});

// --- End Subject Routes ---

// 调用 startServer 确保在所有路由定义之后
startServer();