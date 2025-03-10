import request from '@/utils/request'
import type { ApiResponse } from '@/types/common'
import type { 
  EmployeeFormData,
  EmployeeItem,
  EmployeeItemResponse
} from '@/types/employee'
import type { DeptResponseData } from '@/types/dept' // 添加部门类型导入

export interface EmployeeData {
  id?: number
  empId: string
  name: string
  gender: string
  age: number
  position: string
  department: string
  salary: number
  status: string
  phone?: string
  email?: string
  joinDate: string
}

export interface EmployeeResponse {
  code: number
  data: {
    id: number
    emp_id: string
    name: string
    gender: string
    age: number
    position: string
    dept_id: number
    salary: string
    status: string
    phone: string
    email: string
    join_date: string
    department: string
  }[]
  message: string
}

// 获取员工列表
export function getEmployeeList(params?: any): Promise<ApiResponse<EmployeeItemResponse[]>> {
  return request.get<ApiResponse<EmployeeItemResponse[]>>('/employee/list', { params })
}

// 获取员工详情
export function getEmployeeDetail(id: number): Promise<ApiResponse<EmployeeItemResponse>> {
  return request.get<ApiResponse<EmployeeItemResponse>>(`/employee/${id}`)
}

// 添加员工
export function addEmployee(data: EmployeeFormData): Promise<ApiResponse<EmployeeItemResponse>> {
  return request.post<ApiResponse<EmployeeItemResponse>>('/employee/add', data)
}

// 更新员工
export function updateEmployee(data: EmployeeFormData): Promise<ApiResponse<EmployeeItemResponse>> {
  return request.put<ApiResponse<EmployeeItemResponse>>(`/employee/${data.id}`, data)
}

// 删除员工
export function deleteEmployee(id: number): Promise<ApiResponse<void>> {
  return request.delete<ApiResponse<void>>(`/employee/${id}`)
}

// 批量删除员工
export function batchDeleteEmployee(ids: number[]): Promise<ApiResponse<void>> {
  return request.delete<ApiResponse<void>>('/employee/batch', { data: { ids } })
}

// 获取员工统计数据
export function getEmployeeStats(): Promise<ApiResponse<any>> {
  return request.get<ApiResponse<any>>('/employee/stats')
}

// 导入员工数据
export function importEmployees(file: File): Promise<ApiResponse<any>> {
  const formData = new FormData()
  formData.append('file', file)
  
  return request.post<ApiResponse<any>>('/employee/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 导出员工数据
export function exportEmployees(params?: any): Promise<Blob> {
  return request.get<Blob>('/employee/export', {
    params,
    responseType: 'blob'
  })
}

// 获取部门列表
export const getDeptList = () => {
  return request.get<ApiResponse<DeptResponseData[]>>('/dept/list')
}

// 添加部门检查
export const checkDepartment = (id: number) => {
  return request.get<ApiResponse<boolean>>(`/employee/checkDept/${id}`)
}