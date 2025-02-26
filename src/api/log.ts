import request from '@/utils/request'
import type { LogEntry, LogResponse, LogQueryParams } from '@/types/log'

// 获取日志列表
export const getLogList = (params: LogQueryParams = {}) => {
  return request.get<LogEntry[]>('/log/list', { params })
}

// 清空日志
export const clearLogs = () => {
  return request.delete<void>('/log/clear')
}

// 导出日志
export const exportLogs = (params: LogQueryParams = {}) => {
  return request.get<Blob>('/log/export', { 
    params,
    responseType: 'blob'
  })
}