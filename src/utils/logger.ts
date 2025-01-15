import { emitter } from './eventBus'

export const logger = {
  // 数据库操作日志
  db: (operation: string, table: string, details: string) => {
    emitter.emit('log', {
      type: 'database',
      time: new Date().toLocaleTimeString(),
      content: `[DB] ${operation} ${table}: ${details}`
    })
  },

  // Vue日志
  vue: (message: string) => {
    emitter.emit('log', {
      type: 'vue',
      time: new Date().toLocaleTimeString(),
      content: `[Vue] ${message}`
    })
  },

  // 系统日志
  system: (message: string) => {
    emitter.emit('log', {
      type: 'system',
      time: new Date().toLocaleTimeString(),
      content: `[System] ${message}`
    })
  }
}