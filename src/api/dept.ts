import request from '@/utils/request'
import type { ApiDeptResponse, DeptFormData, DeptResponse } from '@/types/dept'

export interface DeptData {
  id?: number
  deptName: string
  manager: string
  memberCount?: number // 改为可选
  description?: string
  createTime?: string
}

export interface DeptResponse {
  code: number
  data: DeptData[]
  message: string
}

export const getDeptList = () => {
  return request.get<DeptResponse[]>('/dept/list')
}

export const addDept = (data: DeptFormData) => {
  return request.post<DeptResponse>('/dept/add', data)
}

export const updateDept = (id: number, data: Partial<DeptFormData>) => {
  return request.put<DeptResponse>(`/dept/${id}`, data)
}

export const deleteDept = (id: number) => {
  return request.delete<void>(`/dept/${id}`)
}