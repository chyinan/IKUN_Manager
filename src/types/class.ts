import type { Response } from './common'

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
  description?: string
}

// 班级表单数据类型
export interface ClassFormData {
  className: string
  teacher: string
  studentCount?: number
  description?: string
}

// API 响应类型
export type ClassResponse = Response<ClassItemResponse[]>