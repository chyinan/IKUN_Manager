/**
 * 系统配置文件
 */
const config = {
  // 服务器配置
  server: {
    port: process.env.SERVER_PORT || 3000,
    host: 'localhost'
  },
  
  // 数据库配置
  database: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'ikun_db',
    port: process.env.DB_PORT || 3306,
    connectionLimit: process.env.DB_CONNECTION_LIMIT || 10,
    waitForConnections: true,
    queueLimit: 0
  },
  
  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'YOUR_TEMPORARY_SECRET_KEY_CHANGE_ME',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  // 跨域配置
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  },
  
  // 学生默认密码
  studentDefaultPassword: process.env.STUDENT_DEFAULT_PASSWORD || '123456'
};

module.exports = config; 