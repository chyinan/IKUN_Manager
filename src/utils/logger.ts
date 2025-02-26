import { emitter } from './eventBus'
import type { LogType, LogEntry } from '@/types/log'

// 操作类型映射
const LOG_TYPES = {
  INSERT: '新增',
  UPDATE: '更新',
  DELETE: '删除',
  SELECT: '查询'
} as const

// 内容类型映射
const CONTENT_TYPES = {
  student: '学生信息',
  class: '班级信息',
  score: '成绩信息',
  employee: '员工信息',
  dept: '部门信息'
} as const

type OperationType = keyof typeof LOG_TYPES
type ContentType = keyof typeof CONTENT_TYPES

// 日志工具类
export const logger = {
  // 数据库操作日志
  db: (operation: OperationType, table: ContentType, details: string) => {
    const time = new Date().toLocaleString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })

    const logEntry: LogEntry = {
      type: 'database',
      operation: LOG_TYPES[operation],
      content: `${time} ${LOG_TYPES[operation]}${CONTENT_TYPES[table]}: ${details}`,
      operator: 'system',
      createTime: time
    }

    emitter.emit('log', logEntry)
  },

  // Vue操作日志
  vue: (message: string) => {
    const time = new Date().toLocaleString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })

    const logEntry: LogEntry = {
      type: 'vue',
      operation: 'Vue操作',
      content: message,
      operator: 'frontend',
      createTime: time
    }

    emitter.emit('log', logEntry)
  },

  // 系统操作日志
  system: (message: string) => {
    const time = new Date().toLocaleString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })

    const logEntry: LogEntry = {
      type: 'system',
      operation: '系统操作',
      content: message,
      operator: 'system',
      createTime: time
    }

    emitter.emit('log', logEntry)
  }
}