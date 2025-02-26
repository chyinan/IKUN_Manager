import request from '@/utils/request'
import type { ClassResponse, ClassItem } from '@/types/common'

// 班级数据接口
export interface ClassItem {
  id: number
  class_name: string
  student_count: number
  teacher: string
  create_time: string
  description: string | null
}

export interface ClassFormData {
  id?: number
  className: string
  teacher: string
  studentCount?: number // 改为可选
  description?: string
  createTime?: string
}

// API响应接口
export interface ClassResponse {
  code: number
  data: ClassItem[]
  message: string
}

// 获取班级列表
export const getClassList = () => 
  request.get<ClassItem[]>('/class/list')

// 添加班级
export const addClass = (data: Partial<ClassItem>) =>
  request.post<ClassItem>('/class/add', data)

// 更新班级
export const updateClass = (id: number, data: Partial<ClassItem>) =>
  request.put<ClassItem>(`/class/update/${id}`, data)

// 删除班级
export const deleteClass = (id: number) =>
  request.delete<void>(`/class/delete/${id}`)

// 获取班级实际学生数量
export const getClassStudentCount = async (classId: number) => {
  return request({
    url: `/class/studentCount/${classId}`,
    method: 'get'
  })
}