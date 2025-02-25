import db from '../config/db.js'

class Logger {
  static async saveLog(type, operation, content, operator = 'system') {
    try {
      const [result] = await db.query(
        'INSERT INTO system_log (type, operation, content, operator) VALUES (?, ?, ?, ?)',
        [type, operation, content, operator]
      )
      return result
    } catch (error) {
      console.error('保存日志失败:', error)
      throw error
    }
  }

  // 系统日志
  static async systemLog(operation, content, operator = 'system') {
    return this.saveLog('system', operation, content, operator)
  }

  // 数据库日志
  static async databaseLog(operation, content, operator = 'system') {
    return this.saveLog('database', operation, content, operator)
  }

  // Vue前端日志
  static async vueLog(operation, content, operator = 'system') {
    return this.saveLog('vue', operation, content, operator)
  }
}

export default Logger