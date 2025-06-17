import request from '@/utils/request'
import type { ApiResponse, PageResult } from '@/types/common'
import type { ClassItem } from '@/types/class'

// 定义作业状态枚举
export enum AssignmentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

// 定义作业创建请求体类型
export interface AssignmentCreateRequest {
  title: string
  content?: string
  attachmentUrl?: string
  dueDate: string // LocalDateTime 对应前端的字符串格式
  status: AssignmentStatus
  classIds: number[] // 关联的班级ID列表
}

// 定义作业响应数据类型
export interface AssignmentResponse {
  id: number
  teacherId: number
  teacherName: string
  title: string
  content?: string
  attachmentUrl?: string
  dueDate: string
  status: AssignmentStatus
  createdAt: string
  updatedAt: string
  classIds: number[]
  classNames: string[]
}

// 获取所有作业列表 (教师/管理员)
export const getAllAssignments = (): Promise<ApiResponse<AssignmentResponse[]>> => {
  console.log('调用getAllAssignments API')
  return request.get<ApiResponse<AssignmentResponse[]>>('/api/assignments')
}

// 根据教师ID获取作业列表 (教师/管理员)
export const getAssignmentsByTeacherId = (teacherId: number): Promise<ApiResponse<AssignmentResponse[]>> => {
  console.log(`调用getAssignmentsByTeacherId API, teacherId: ${teacherId}`)
  return request.get<ApiResponse<AssignmentResponse[]>>(`/api/assignments/teacher/${teacherId}`)
}

// 根据学生ID获取作业列表 (学生)
export const getAssignmentsByStudent = (): Promise<ApiResponse<AssignmentResponse[]>> => {
  console.log('调用getAssignmentsByStudent API (获取当前学生的作业列表)')
  // 学生获取自己的作业列表，后端会根据 JWT 获取学生ID
  return request.get<ApiResponse<AssignmentResponse[]>>('/api/assignments/student')
}

// 获取作业详情
export const getAssignmentDetail = (id: number): Promise<ApiResponse<AssignmentResponse>> => {
  console.log(`调用getAssignmentDetail API, ID: ${id}`)
  return request.get<ApiResponse<AssignmentResponse>>(`/api/assignments/${id}`)
}

// 创建作业
export const createAssignment = (data: AssignmentCreateRequest): Promise<ApiResponse<AssignmentResponse>> => {
  console.log('调用createAssignment API, 数据:', data)
  return request.post<ApiResponse<AssignmentResponse>>('/api/assignments', data)
}

// 更新作业
export const updateAssignment = (id: number, data: AssignmentCreateRequest): Promise<ApiResponse<AssignmentResponse>> => {
  console.log(`调用updateAssignment API, ID: ${id}, 数据:`, data)
  return request.put<ApiResponse<AssignmentResponse>>(`/api/assignments/${id}`, data)
}

// 删除作业
export const deleteAssignment = (id: number): Promise<ApiResponse<void>> => {
  console.log(`调用deleteAssignment API, ID: ${id}`)
  return request.delete<ApiResponse<void>>(`/api/assignments/${id}`)
}

// 获取班级列表 (用于作业发布时选择班级)
export const getClassList = (params?: any): Promise<ApiResponse<ClassItem[]>> => {
  console.log('调用getClassList API, 参数:', params);
  return request.get<ApiResponse<ClassItem[]>>('api/class/list', { params });
} 