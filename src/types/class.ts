import type { Response } from './response'

// 后端返回的数据类型
export interface ClassItemResponse {
  id: number
  class_name: string
  student_count: number
  teacher: string
  create_time: string
  description: string | null
}

// 前端使用的数据类型
export interface ClassItem {
  id: number
  className: string
  studentCount: number
  teacher: string
  createTime: string
  description?: string
}

// 表单数据类型
export interface ClassFormData {
  id?: number
  className: string
  teacher: string
  studentCount?: number
  description?: string
}

export type ClassResponse = Response<ClassItemResponse[]>