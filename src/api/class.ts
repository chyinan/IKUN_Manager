import request from '@/utils/request'
import type { 
  ClassItemResponse, 
  ClassFormData as TypeClassFormData,
  ClassBackendData  // 添加后端数据类型导入
} from '@/types/class'
import type { ApiResponse } from '@/types/common'

// 班级数据接口
export interface ClassItem {
  id: number
  class_name: string
  student_count: number
  teacher: string
  create_time: string
  description: string | null
}

// API响应接口
export type ClassResponse = ApiResponse<ClassItem[]>

// 获取班级列表
export const getClassList = () => {
  return request.get<ClassItemResponse[]>('/class/list')
}

// 添加班级
export const addClass = (data: ClassBackendData) => {
  return request.post<ClassItemResponse>('/class/add', data)
}

// 更新班级
export const updateClass = (id: number, data: Partial<ClassBackendData>) => {
  return request.put<ClassItemResponse>(`/class/${id}`, data)
}

// 删除班级
export const deleteClass = (id: number) => {
  return request.delete<void>(`/class/${id}`)
}

// 获取班级实际学生数量
export const getClassStudentCount = (classId: number) => {
  return request.get<number>(`/class/${classId}/student-count`)
}