import { emitter } from './eventBus'

// 定义日志类型的接口
interface LogTypes {
  [key: string]: string  // 索引签名,允许使用字符串作为key
}

// 定义日志操作类型映射
const LOG_TYPES: LogTypes = {
  INSERT: '新增',
  UPDATE: '更新', 
  DELETE: '删除',
  SELECT: '查询'
}

// 定义日志内容类型映射
const CONTENT_TYPES: LogTypes = {
  student: '学生信息',
  class: '班级信息', 
  score: '成绩信息',
  employee: '员工信息',
  dept: '部门信息'
}

// 定义日志事件类型
interface LogEvent {
  type: 'database' | 'vue' | 'system'
  time: string
  content: string
}

// 导出日志工具对象
export const logger = {
  // 数据库操作日志记录
  db: (operation: keyof typeof LOG_TYPES, table: keyof typeof CONTENT_TYPES, details: string) => {
    const time = new Date().toLocaleString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })

    // 发送日志事件
    emitter.emit('log', {
      type: 'database', 
      time,
      content: `${time} ${LOG_TYPES[operation]}${CONTENT_TYPES[table]}：${details}`
    } as LogEvent)
  },

  // Vue操作日志记录
  vue: (message: string) => {
    emitter.emit('log', {
      type: 'vue',
      time: new Date().toLocaleTimeString(),
      content: `[Vue] ${message}`
    } as LogEvent)
  },

  // 系统操作日志记录
  system: (message: string) => {
    const time = new Date().toLocaleString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit', 
      second: '2-digit'
    })
    
    emitter.emit('log', {
      type: 'system',
      time,
      content: `${time} 系统操作：${message}`
    } as LogEvent)
  }
}