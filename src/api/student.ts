import request from '@/utils/request'
import type { StudentItemResponse, StudentFormData } from '@/types/student'
import type { Response } from '@/types/common'

export interface StudentItem {
  id: number
  student_id: string
  name: string
  gender: string
  class_name: string
  phone: string
  email: string
  join_date: string
  create_time: string
}

export interface StudentFormData {
  id?: number
  studentId: string
  name: string
  gender: string
  className: string
  phone: string
  email: string
  joinDate: string
}

export interface StudentResponse {
  code: number
  data: StudentItem[]
  message: string
}

// 获取学生列表
export const getStudentList = () => {
  return request.get<StudentItemResponse[]>('/student/list')
}

// 添加学生
export const addStudent = (data: StudentFormData) => {
  return request.post<StudentItemResponse>('/student/add', data)
}

// 更新学生
export const updateStudent = (id: number, data: Partial<StudentFormData>) => {
  return request.put<StudentItemResponse>(`/student/${id}`, data)
}

// 删除学生
export const deleteStudent = (id: number) => {
  return request.delete<void>(`/student/${id}`)
}