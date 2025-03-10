import request from '@/utils/request'
import type { ApiResponse } from '@/types/common'

/**
 * 获取日志列表
 * @param params 查询参数
 */
export function getLogList(params?: any) {
  return request.get<ApiResponse<any[]>>('/log/list', { params })
}

/**
 * 获取日志详情
 * @param id 日志ID
 */
export function getLogDetail(id: number) {
  return request.get<ApiResponse<any>>(`/log/${id}`)
}

/**
 * 删除日志
 * @param id 日志ID
 */
export function deleteLog(id: number) {
  return request.delete<ApiResponse<void>>(`/log/${id}`)
}

/**
 * 批量删除日志
 * @param ids 日志ID数组
 */
export function batchDeleteLog(ids: number[]) {
  return request.delete<ApiResponse<void>>('/log/batch', { data: { ids } })
}

/**
 * 清空日志
 */
export function clearLogs() {
  return request.delete<ApiResponse<void>>('/log/clear')
}

/**
 * 导出日志
 * @param params 查询参数
 */
export function exportLogs(params?: any) {
  return request.get<Blob>('/log/export', {
    params,
    responseType: 'blob'
  })
}