import mitt from 'mitt'

export const emitter = mitt()

export const LogType = {
  DB: 'database',    // 数据库操作
  SYSTEM: 'system',  // 系统操作
  VUE: 'vue'        // Vue日志
} as const