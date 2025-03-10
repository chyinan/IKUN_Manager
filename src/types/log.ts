import type { ApiResponse } from './common'

// 日志类型
export type LogType = 'system' | 'database' | 'vue' | 'info' | 'warn' | 'error' | 'insert' | 'update' | 'delete' | 'query';

// 日志条目接口
export interface LogEntry {
  id?: number;
  type: LogType;
  content: string;
  operator?: string;
  operation?: string;
  createTime?: string;
  ip?: string;
  module?: string;
}

// 日志响应接口
export interface LogResponse extends ApiResponse<LogEntry[]> {
  total?: number
}

// 日志查询参数
export interface LogQueryParams {
  page?: number;
  pageSize?: number;
  type?: LogType;
  operator?: string;
  startTime?: string;
  endTime?: string;
  keyword?: string;
}