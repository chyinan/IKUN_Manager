const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const classRouter = require('./routes/class')
const studentRouter = require('./routes/student')
const deptRouter = require('./routes/dept')

const app = express()

// 打印请求日志
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`)
  next()
})

app.use(cors())
app.use(bodyParser.json())

// 根路由
app.get('/', (req, res) => {
  res.send('IKUN管理系统API服务器正在运行')
})

// API路由
app.use('/api/class', classRouter)
app.use('/api/student', studentRouter)
app.use('/api/dept', deptRouter)

// 启动服务器
const PORT = 3000
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`)
})