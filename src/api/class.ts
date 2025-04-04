import request from '@/utils/request'
import type { ClassItem, ApiResponse } from '@/types/common'

/**
 * 获取班级列表
 * @param params 查询参数
 */
export function getClassList() {
  console.log('调用getClassList API');
  return request.get<ApiResponse<ClassItem[]>>('/class/list')
}

// 获取班级详情
export function getClassDetail(id: number) {
  console.log('调用getClassDetail API, ID:', id);
  return request.get<ApiResponse<ClassItem>>(`/class/${id}`)
}

// 添加班级
export function addClass(data: ClassItem) {
  console.log('调用addClass API, 数据:', data);
  return request.post<ApiResponse<ClassItem>>('/class/add', data)
}

// 更新班级
export function updateClass(id: number, data: ClassItem) {
  console.log('调用updateClass API, ID:', id, '数据:', data);
  return request.put<ApiResponse<ClassItem>>(`/class/${id}`, data)
}

// 删除班级
export function deleteClass(id: number) {
  console.log('调用deleteClass API, ID:', id);
  return request.delete<ApiResponse<void>>(`/class/${id}`)
}

// 批量删除班级
export function batchDeleteClass(ids: number[]) {
  console.log('调用batchDeleteClass API, IDs:', ids);
  return request.delete<ApiResponse<void>>('/class/batch', { data: { ids } })
}

// 获取班级统计数据
export function getClassStats() {
  console.log('调用getClassStats API');
  return request.get<ApiResponse<any>>('/class/stats')
}

// 导入班级数据
export function importClasses(file: File) {
  console.log('调用importClasses API, 文件:', file.name);
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
  console.log('调用exportClasses API');
  return request.get<Blob>('/class/export', {
    responseType: 'blob'
  })
}