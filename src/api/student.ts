import request from '@/utils/request'

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

export const getStudentList = () => {
  return request.get<StudentResponse>('/student/list')  // 确保路径与后端匹配
}

export const addStudent = (data: StudentFormData) => {
  return request.post<StudentResponse>('/student/add', data)
}

export const updateStudent = (data: StudentFormData) => {
  return request.put<StudentResponse>(`/student/update/${data.id}`, data)
}

export const deleteStudent = (id: number) => {
  return request.delete<StudentResponse>(`/student/delete/${id}`)
}

export const getMaxStudentId = () => {
  return request.get<{code: number, data: string}>('/student/maxStudentId')
}