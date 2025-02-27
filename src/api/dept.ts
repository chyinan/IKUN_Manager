import request from '@/utils/request'
import type { DeptResponseData, ApiDeptResponse, DeptFormData, DeptBackendData } from '@/types/dept'

// API 请求方法
export const getDeptList = () => {
  return request.get<ApiDeptResponse>('/dept/list')
}

export const addDept = (data: DeptBackendData) => {
  return request.post<ApiDeptResponse>('/dept/add', data)
}

export const updateDept = (id: number, data: Partial<DeptBackendData>) => {
  return request.put<ApiDeptResponse>(`/dept/${id}`, data)
}

export const deleteDept = (id: number) => {
  return request.delete<void>(`/dept/${id}`)
}