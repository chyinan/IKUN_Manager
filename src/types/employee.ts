import type { ApiResponse, BaseFields } from './common'

// 后端返回的员工数据类型
export interface EmployeeResponse {
  id: number
  emp_id: string
  name: string
  gender: string
  age: number
  dept_name: string
  position: string
  salary: number
  status: string
  phone: string | null
  email: string | null
  join_date: string
  create_time: string
}

// 前端使用的员工数据类型
export interface EmployeeItem {
  id: number
  empId: string
  name: string
  gender: string
  age: number
  deptName: string
  position: string
  salary: number
  status: string
  phone?: string
  email?: string
  joinDate: string
  createTime: string
}

// 员工表单数据类型
export interface EmployeeFormData {
  id?: number
  empId: string
  name: string
  gender: string
  age: number
  position: string
  deptName: string
  salary: number
  status: string
  phone?: string
  email?: string
  joinDate: string
}

// 部门数据类型
export interface DeptResponse extends BaseFields {
  dept_name: string
  manager: string
  member_count: number
  description: string | null
}

export interface DeptItem {
  id: number
  deptName: string  
  manager: string
  memberCount: number
  description?: string
  createTime: string
}

// API 响应类型
export type ApiEmployeeResponse = ApiResponse<EmployeeResponse[]>
export type ApiDeptResponse = ApiResponse<DeptResponse[]>