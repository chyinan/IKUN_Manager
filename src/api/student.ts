import request from '@/utils/request'
import type { StudentItem } from '@/types/common'
import type { ApiResponse } from '@/types/common'

// 获取学生列表
export function getStudentList(params?: any): Promise<ApiResponse<StudentItem[]>> {
  return request.get<ApiResponse<StudentItem[]>>('/student/list', { params })
}

// 获取学生详情
export function getStudentDetail(id: number): Promise<ApiResponse<StudentItem>> {
  return request.get<ApiResponse<StudentItem>>(`/student/${id}`)
}

// 添加学生
export function addStudent(data: StudentItem): Promise<ApiResponse<StudentItem>> {
  return request.post<ApiResponse<StudentItem>>('/student/add', data)
}

// 更新学生
export function updateStudent(id: number, data: StudentItem): Promise<ApiResponse<StudentItem>> {
  return request.put<ApiResponse<StudentItem>>(`/student/${id}`, data)
}

// 删除学生
export function deleteStudent(id: number): Promise<ApiResponse<void>> {
  return request.delete<ApiResponse<void>>(`/student/${id}`)
}

// 批量删除学生
export function batchDeleteStudent(ids: number[]): Promise<ApiResponse<void>> {
  return request.delete<ApiResponse<void>>('/student/batch', { data: { ids } })
}

// 获取学生统计数据
export function getStudentStats(): Promise<ApiResponse<any>> {
  return request.get<ApiResponse<any>>('/student/stats')
}

// 导入学生数据
export function importStudents(file: File): Promise<ApiResponse<any>> {
  const formData = new FormData()
  formData.append('file', file)
  
  return request.post<ApiResponse<any>>('/student/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 导出学生数据
export function exportStudents(params?: any): Promise<Blob> {
  return request.get<Blob>('/student/export', {
    params,
    responseType: 'blob'
  })
}

// 获取最大学生ID
export function getMaxStudentId(): Promise<ApiResponse<number>> {
  return request.get<ApiResponse<number>>('/student/max-id')
}