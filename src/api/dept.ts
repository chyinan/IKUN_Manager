import request from '@/utils/request'
import type { ApiDeptResponse, DeptFormData, DeptResponse as ImportedDeptResponse } from '@/types/dept'

export interface DeptData {
  id?: number
  deptName: string
  manager: string
  memberCount?: number // 改为可选
  description?: string
  createTime?: string
}

export interface LocalDeptResponse {
  code: number
  data: DeptData[]
  message: string
}

export const getDeptList = () => {
  return request.get<LocalDeptResponse[]>('/dept/list')
}

export const addDept = (data: DeptFormData) => {
  return request.post<LocalDeptResponse>('/dept/add', data)
}

export const updateDept = (id: number, data: Partial<DeptFormData>) => {
  return request.put<LocalDeptResponse>(`/dept/${id}`, data)
}

export const deleteDept = (id: number) => {
  return request.delete<void>(`/dept/${id}`)
}