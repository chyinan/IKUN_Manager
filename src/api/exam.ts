import request from '@/utils/request'
import type { ExamInfo, ExamQueryParams, ExamListResponse } from '@/types/exam'
import type { ApiResponse } from '@/types/common'

/**
 * 获取考试列表
 * @param params 查询参数
 */
export function getExamList(params?: any) {
  return request.get<ApiResponse<any[]>>('/exam/list', { params })
}

/**
 * 获取考试详情
 * @param id 考试ID
 */
export function getExamDetail(id: number) {
  return request.get<ApiResponse<any>>(`/exam/${id}`)
}

/**
 * 添加考试
 * @param data 考试信息
 */
export function addExam(data: any) {
  return request.post<ApiResponse<any>>('/exam/add', data)
}

/**
 * 更新考试
 * @param id 考试ID
 * @param data 考试信息
 */
export function updateExam(id: number, data: any) {
  return request.put<ApiResponse<any>>(`/exam/${id}`, data)
}

/**
 * 删除考试
 * @param id 考试ID
 */
export function deleteExam(id: number) {
  return request.delete<ApiResponse<void>>(`/exam/${id}`)
}

/**
 * 批量删除考试
 * @param ids 考试ID数组
 */
export function batchDeleteExam(ids: number[]) {
  return request.delete<ApiResponse<void>>('/exam/batch', { data: { ids } })
}

/**
 * 获取考试统计数据
 */
export function getExamStats() {
  return request.get<ApiResponse<any>>('/exam/stats')
}

/**
 * 导入考试数据
 * @param file 考试数据文件
 */
export function importExams(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  
  return request.post<ApiResponse<any>>('/exam/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 导出考试数据
 * @param params 导出参数
 */
export function exportExams(params?: any) {
  return request.get<Blob>('/exam/export', {
    params,
    responseType: 'blob'
  })
}

/**
 * 获取班级列表（用于选择班级）
 */
export function getClassOptions() {
  return request.get<ApiResponse<any[]>>('/class/options')
}

/**
 * 获取考试类型选项
 */
export function getExamTypeOptions() {
  return request.get<ApiResponse<string[]>>('/exam/exam-types')
}

/**
 * 获取科目选项
 */
export function getSubjectOptions() {
  return request.get<ApiResponse<string[]>>('/exam/subjects')
}

/**
 * 发布考试
 * @param id 考试ID
 */
export function publishExam(id: number) {
  return request.put<ApiResponse<void>>(`/exam/publish/${id}`)
}

/**
 * 取消发布考试
 * @param id 考试ID
 */
export function unpublishExam(id: number) {
  return request.put<ApiResponse<void>>(`/exam/unpublish/${id}`)
}

/**
 * 更新考试状态
 * @param id 考试ID
 * @param status 状态值
 */
export function updateExamStatus(id: number, status: number) {
  return request.put<ApiResponse<void>>(`/exam/${id}/status`, { status })
}