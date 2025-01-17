const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const classRouter = require('./routes/class')

const app = express()

// 配置MySQL连接
const mysql = require('mysql2')
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'ikun_db'
})

// 中间件配置
app.use(cors())
app.use(bodyParser.json())

// 测试数据库连接
db.connect((err) => {
  if (err) {
    console.error('数据库连接失败:', err)
    return
  }
  console.log('数据库连接成功')
})

// 基础路由测试
app.get('/', (req, res) => {
  res.send('服务器运行正常')
})

// API路由前缀
app.use('/api/class', classRouter)

// 启动服务器
const PORT = 3000
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`)
})