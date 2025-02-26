import type { ApiResponse } from './common'

// 日志类型
export type LogType = 'database' | 'vue' | 'system'

// 日志条目接口
export interface LogEntry {
  id?: number
  type: LogType
  operation: string
  content: string
  operator: string
  createTime: string
}

// 日志响应接口
export interface LogResponse extends ApiResponse<LogEntry[]> {
  total?: number
}

// 日志查询参数
export interface LogQueryParams {
  type?: LogType
  startTime?: string
  endTime?: string
  limit?: number
}