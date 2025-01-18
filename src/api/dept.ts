import request from '@/utils/request'

export interface DeptData {
  id?: number
  deptName: string
  manager: string
  memberCount: number
  description?: string
  createTime?: string
}

export interface DeptResponse {
  code: number
  data: DeptData[]
  message: string
}

export const getDeptList = () => {
  return request.get<DeptResponse>('/dept/list')
}

export const addDept = (data: DeptData) => {
  return request.post<DeptResponse>('/dept/add', data)
}

export const updateDept = (data: DeptData) => {
  return request.put<DeptResponse>(`/dept/update/${data.id}`, data)
}

export const deleteDept = (id: number) => {
  return request.delete<DeptResponse>(`/dept/delete/${id}`)
}