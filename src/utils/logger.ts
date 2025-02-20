import { emitter } from './eventBus'

export const logger = {
  // 数据库操作日志
  db: (operation: string, table: string, details: string) => {
    const time = new Date().toLocaleString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })

    const operationMap = {
      INSERT: '新增',
      UPDATE: '更新',
      DELETE: '删除',
      SELECT: '查询'
    }

    const tableMap = {
      'student': '学生',
      'class': '班级',
      'score': '成绩',
      'employee': '员工',
      'dept': '部门'
    }

    emitter.emit('log', {
      type: 'database',
      time,
      content: `${time} ${operationMap[operation] || operation}${tableMap[table] || table}：${details}`
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
    const time = new Date().toLocaleString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
    
    emitter.emit('log', {
      type: 'system',
      time,
      content: `${time} 系统操作：${message}`
    })
  }
}