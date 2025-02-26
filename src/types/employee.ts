import type { Response } from './common'

export interface EmployeeResponse {
  id: number
  name: string
  dept_name: string
  position: string
  salary: number
  status: string
  join_date: string
}

export interface DepartmentResponse {
  id: number
  dept_name: string
  manager: string
  member_count: number
}

export interface EmployeeData {
  id: number
  name: string
  deptName: string
  position: string
  salary: number
  status: string
  joinDate: string
}

export interface DeptData {
  id: number
  deptName: string
  manager: string
  memberCount: number
}

export type ApiEmployeeResponse = Response<EmployeeResponse[]>
export type ApiDeptResponse = Response<DepartmentResponse[]>