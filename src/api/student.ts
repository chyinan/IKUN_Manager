import request from '@/utils/request'
import type { StudentItemResponse } from '@/types/student'
import type { ApiResponse } from '@/types/common'

// 前端使用的学生数据类型
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

// API 请求方法
export const getStudentList = () => {
  return request.get<ApiResponse<StudentItemResponse[]>>('/student/list')
}

// 获取最大学号
export const getMaxStudentId = () => {
  return request.get<ApiResponse<string>>('/student/maxStudentId')
}

// 添加学生
export const addStudent = (data: StudentFormData) => {
  return request.post<ApiResponse<void>>('/student/add', data)
}

// 更新学生
export const updateStudent = (data: StudentFormData) => {
  return request.put<ApiResponse<void>>(`/student/update/${data.id}`, data)
}

// 删除学生
export const deleteStudent = (id: number) => {
  return request.delete<ApiResponse<void>>(`/student/${id}`)
}