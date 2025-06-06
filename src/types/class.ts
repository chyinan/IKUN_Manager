import type { ApiResponse } from './common'

// 后端的班级数据格式
export interface ClassBackendData {
  class_name: string
  teacher: string
  student_count: number
  description?: string
}

// 后端返回的班级数据类型
export interface ClassItemResponse {
  id: number
  class_name: string
  student_count: number
  teacher: string
  create_time: string
  description: string | null
}

// 前端使用的班级数据类型
export interface ClassItem {
  id: number
  className: string
  studentCount: number
  teacher: string
  createTime: string
  description: string | null | undefined
}

// 班级表单数据类型
export interface ClassFormData {
  id?: number
  className: string
  teacher: string
  studentCount?: number
  description?: string
}

// API 响应类型
export type ApiClassResponse = ApiResponse<ClassItemResponse[]>