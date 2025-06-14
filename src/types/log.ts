import type { ApiResponse } from './common'

// 日志类型
export type LogType = 'system' | 'database' | 'vue' | 'info' | 'warn' | 'error' | 'insert' | 'update' | 'delete' | 'query';

// 日志条目接口
export interface LogEntry {
  id?: number;
  type: string;
  operation?: string;
  content: string;
  operator?: string;
  createTime?: string;
}

// 日志响应接口
export interface LogResponse extends ApiResponse<LogEntry[]> {
  total?: number
}

// 日志查询参数
export interface LogQueryParams {
  page?: number;
  pageSize?: number;
  type?: string;
  operation?: string;
  content?: string;
  operator?: string;
  startDate?: string;
  endDate?: string;
}