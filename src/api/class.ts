import request from '@/utils/request'
import type { ClassItem, ApiResponse } from '@/types/common'

// 获取班级列表
export function getClassList() {
  return request.get<ApiResponse<ClassItem[]>>('/class/list')
}

// 获取班级详情
export function getClassDetail(id: number) {
  return request.get<ApiResponse<ClassItem>>(`/class/${id}`)
}

// 添加班级
export function addClass(data: ClassItem) {
  return request.post<ApiResponse<ClassItem>>('/class/add', data)
}

// 更新班级
export function updateClass(id: number, data: ClassItem) {
  return request.put<ApiResponse<ClassItem>>(`/class/${id}`, data)
}

// 删除班级
export function deleteClass(id: number) {
  return request.delete<ApiResponse<void>>(`/class/${id}`)
}

// 批量删除班级
export function batchDeleteClass(ids: number[]) {
  return request.delete<ApiResponse<void>>('/class/batch', { data: { ids } })
}

// 获取班级统计数据
export function getClassStats() {
  return request.get<ApiResponse<any>>('/class/stats')
}

// 导入班级数据
export function importClasses(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  
  return request.post<ApiResponse<any>>('/class/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 导出班级数据
export function exportClasses() {
  return request.get<Blob>('/class/export', {
    responseType: 'blob'
  })
}