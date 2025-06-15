import request from '@/utils/request'
import type { ApiResponse } from '@/types/common'
import type { LogEntry, LogQueryParams } from '@/types/log'
import type { PageInfo } from '@/types/page'

/**
 * 获取日志列表
 * @param params 查询参数
 */
export const getLogList = (params?: LogQueryParams): Promise<ApiResponse<PageInfo<LogEntry>>> => {
  return request.get<ApiResponse<PageInfo<LogEntry>>>('/api/log/list', { params })
    .catch(error => {
        console.error('[API log.ts] Error fetching log list:', error);
        throw error;
    });
}

/**
 * 获取日志详情
 * @param id 日志ID
 */
export function getLogDetail(id: number) {
  return request.get<ApiResponse<any>>(`/api/log/${id}`)
}

/**
 * 删除日志
 * @param id 日志ID
 */
export function deleteLog(id: number) {
  return request.delete<ApiResponse<void>>(`/api/log/${id}`)
}

/**
 * 批量删除日志
 * @param ids 日志ID数组
 */
export const batchDeleteLogs = (ids: number[]): Promise<ApiResponse<void>> => {
  return request.delete<ApiResponse<void>>('/api/log/batchDelete', { data: ids })
    .catch(error => {
        console.error('[API log.ts] Error batch deleting logs:', error);
        throw error;
    });
}

/**
 * 清空日志
 */
export const clearLogs = (): Promise<ApiResponse<void>> => {
  return request.delete<ApiResponse<void>>('/api/log/clear')
    .catch(error => {
        console.error('[API log.ts] Error clearing logs:', error);
        throw error;
    });
}

/**
 * 导出日志
 * @param params 查询参数
 */
export function exportLogs(params?: any) {
  return request.get<Blob>('/api/log/export', {
    params,
    responseType: 'blob'
  })
}

// Define AddLogData if it doesn't exist elsewhere
interface AddLogData {
  type: 'vue' | 'system' | 'database'; // Example types
  operation: string;
  content: string;
  operator?: string;
}

// 添加前端日志 (发送到后端)
export const addFrontendLog = (logData: AddLogData): Promise<ApiResponse<void>> => {
  return request.post<ApiResponse<void>>('/api/log/add', logData) // Assuming endpoint exists
    .catch(error => {
      console.error('[API log.ts] Failed to send frontend log to server:', error);
      // Corrected: Return a resolved promise satisfying ApiResponse<void>
      return Promise.resolve({ code: -1, message: 'Log sending failed locally', data: undefined }); 
    });
};