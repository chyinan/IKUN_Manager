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
    secret: '1145141919810emmmmmmaaaaaanmsl',
    expiresIn: '24h'
  },
  
  // 跨域配置
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  },
  
  // 学生默认密码
  studentDefaultPassword: 'your_student_default_password_here'
};

module.exports = config; 