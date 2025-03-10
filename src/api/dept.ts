import request from '@/utils/request'
import type { DeptResponseData, ApiDeptResponse, DeptFormData, DeptBackendData } from '@/types/dept'
import type { ApiResponse } from '@/types/common'

// API 请求方法
export const getDeptList = () => {
  return request.get<ApiResponse<DeptResponseData[]>>('/dept/list')
}

export const addDept = (data: DeptBackendData) => {
  return request.post<ApiResponse<DeptResponseData>>('/dept/add', data)
}

export const updateDept = (id: number, data: Partial<DeptBackendData>) => {
  return request.put<ApiResponse<DeptResponseData>>(`/dept/${id}`, data)
}

export const deleteDept = (id: number) => {
  return request.delete<ApiResponse<void>>(`/dept/${id}`)
}