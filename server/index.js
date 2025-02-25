import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { EventEmitter } from 'events'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// 路由导入
import classRouter from './routes/class.js'
import studentRouter from './routes/student.js'
import deptRouter from './routes/dept.js'
import employeeRouter from './routes/employee.js'
import scoreRouter from './routes/score.js'
import userRouter from './routes/user.js'
import logRouter from './routes/log.js'
import Logger from './utils/logger.js'

// 获取 __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 创建事件发射器实例
const emitter = new EventEmitter()

const app = express()

// WebSocket支持
const server = createServer(app)
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
app.use(async (req, res, next) => {
  const startTime = Date.now()
  const logContent = `${req.method} ${req.url}`
  
  // 记录数据库查询
  if (req.url.includes('query') || req.url.includes('list')) {
    await Logger.databaseLog('QUERY', logContent)
  }
  
  // 记录API访问
  await Logger.systemLog('API_ACCESS', logContent)
  
  next()
})

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
io.on('connection', async (socket) => {
  // 记录客户端连接
  await Logger.systemLog('CONNECTION', '客户端已连接')
  socket.emit('serverLog', {
    time: new Date().toLocaleTimeString(),
    type: 'system',
    content: '客户端已连接'
  })

  // 监听断开连接
  socket.on('disconnect', async () => {
    await Logger.systemLog('DISCONNECT', '客户端断开连接')
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

// 注册用户路由
app.use('/api/user', userRouter)

// 注册日志路由
app.use('/api/log', logRouter)

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