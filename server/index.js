import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { EventEmitter } from 'events'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import Logger from './utils/logger.js'

// 导入路由
import classRouter from './routes/class.js'
import studentRouter from './routes/student.js'
import deptRouter from './routes/dept.js'
import employeeRouter from './routes/employee.js'
import scoreRouter from './routes/score.js'
import userRouter from './routes/user.js'
import logRouter from './routes/log.js'

// 获取 __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 创建事件发射器实例
const emitter = new EventEmitter()

const app = express()
const server = createServer(app)

// WebSocket配置
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
})

// 基础中间件配置 - 这些需要在最前面
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Socket连接处理
io.on('connection', async (socket) => {
  await Logger.systemLog('CONNECTION', '客户端已连接')
  socket.emit('serverLog', {
    time: new Date().toLocaleTimeString(),
    type: 'system',
    content: '客户端已连接'
  })

  socket.on('disconnect', async () => {
    await Logger.systemLog('DISCONNECT', '客户端断开连接')
  })
})

// 请求日志中间件
app.use(async (req, res, next) => {
  const time = new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  // 从请求头获取用户名
  const username = req.headers['x-user-name'] || 'system'

  let operation = req.method
  let content = ''
  let type = 'system'

  if (req.url.includes('/api/')) {
    type = 'database'
    
    switch (req.method) {
      case 'GET': operation = req.url.includes('list') ? '查询列表' : '查询详情'; break
      case 'POST': operation = '新增'; break
      case 'PUT': operation = '更新'; break
      case 'DELETE': operation = '删除'; break
    }

    if (req.url.includes('student')) {
      content = '学生信息'
    } else if (req.url.includes('score')) {
      content = '成绩信息'
    } else if (req.url.includes('class')) {
      content = '班级信息'
    } else if (req.url.includes('employee')) {
      content = '员工信息'
    } else if (req.url.includes('dept')) {
      content = '部门信息'
    } else {
      content = req.url.split('/').pop()
    }

    const logEntry = {
      time,
      type,
      content: `${username} ${operation} ${content}`
    }

    // 保存到数据库并广播
    try {
      await Logger.saveLog(type, operation, logEntry.content, username)
      io.emit('serverLog', logEntry)
    } catch (error) {
      console.error('保存日志失败:', error)
    }
  }

  next()
})

// API路由注册
app.use('/api/score', scoreRouter)
app.use('/api/class', classRouter)
app.use('/api/student', studentRouter)
app.use('/api/dept', deptRouter)
app.use('/api/employee', employeeRouter)
app.use('/api/user', userRouter)
app.use('/api/log', logRouter)

// 根路由
app.get('/', (req, res) => {
  res.send('IKUN管理系统API服务器正在运行')
})

// 错误处理中间件 - 放在最后
app.use((err, req, res, next) => {
  console.error('服务器错误:', err)
  res.status(500).json({
    code: 500,
    message: '服务器内部错误'
  })
})

// 服务器启动
const PORT = 3000
server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`)
  console.log('WebSocket服务已启动')
})