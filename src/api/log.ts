import request from '@/utils/request'

export interface LogData {
  id: number
  type: 'system' | 'database' | 'vue'
  operation: string
  content: string
  operator: string
  create_time: string
}

export interface LogResponse {
  code: number
  data: LogData[]
  message: string
}

export interface LogQueryParams {
  type?: string
  startTime?: string
  endTime?: string
  limit?: number
}

// 获取日志列表
export const getLogList = (params: LogQueryParams = {}) => {
  return request.get<LogResponse>('/log/list', { params })
}

// 清空日志
export const clearLogs = () => {
  return request.delete<LogResponse>('/log/clear')
}

// 导出日志
export const exportLogs = (params: LogQueryParams = {}) => {
  return request.get<Blob>('/log/export', { 
    params,
    responseType: 'blob'
  })
}