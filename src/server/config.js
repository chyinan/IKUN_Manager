/**
 * 系统配置文件
 */
module.exports = {
  // 服务器配置
  server: {
    port: 3000,
    host: 'localhost'
  },
  
  // 数据库配置
  db: {
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'ikun_db'
  },
  
  // JWT配置
  jwt: {
    secret: 'ikun_manager_secret_key',
    expiresIn: '24h'
  },
  
  // 跨域配置
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
}; 