const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const EventEmitter = require('events')
const http = require('http')
const { Server } = require('socket.io')
const classRouter = require('./routes/class')
const studentRouter = require('./routes/student')
const deptRouter = require('./routes/dept')
const employeeRouter = require('./routes/employee')
const scoreRouter = require('./routes/score')
const userRouter = require('./routes/user')

// 创建事件发射器实例
const emitter = new EventEmitter()

const app = express()

// WebSocket支持
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // 前端地址
    methods: ["GET", "POST"]
  }
})

// 中间件配置
app.use(cors())
app.use(bodyParser.json())

// 请求日志中间件
app.use((req, res, next) => {
  const time = new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  let operation = ''
  switch (req.method) {
    case 'GET': operation = '查询'; break
    case 'POST': operation = '新增'; break
    case 'PUT': operation = '更新'; break
    case 'DELETE': operation = '删除'; break
    default: operation = req.method
  }

  let message = ''
  if (req.url.includes('student')) {
    message = '学生信息'
  } else if (req.url.includes('score')) {
    message = '成绩信息'
  } else if (req.url.includes('class')) {
    message = '班级信息'
  } else {
    message = req.url
  }

  const logEntry = {
    time,
    type: 'database',
    content: `${operation} ${message}`
  }

  // 广播日志到所有连接的客户端
  io.emit('serverLog', logEntry)
  console.log(`[${time}] ${logEntry.content}`)
  next()
})

// Socket连接处理
io.on('connection', (socket) => {
  console.log('客户端已连接')
  
  socket.on('disconnect', () => {
    console.log('客户端断开连接')
  })
})

// 根路由
app.get('/', (req, res) => {
  res.send('IKUN管理系统API服务器正在运行')
})

// API路由
app.use('/api/score', scoreRouter)
app.use('/api/class', classRouter)
app.use('/api/student', studentRouter)
app.use('/api/dept', deptRouter)
app.use('/api/employee', employeeRouter)
app.use('/api/user', userRouter)

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err)
  res.status(500).json({
    code: 500,
    message: '服务器内部错误'
  })
})

// 修改服务器启动代码
const PORT = 3000
server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`)
  console.log('WebSocket服务已启动')
})