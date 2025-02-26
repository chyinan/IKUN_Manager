import type { BaseFields, ApiResponse } from './common'

// 后端返回的部门数据类型
export interface DeptResponse extends BaseFields {
  dept_name: string
  manager: string
  member_count: number
  description: string | null
}

// 前端使用的部门数据类型 
export interface DeptItem extends BaseFields {
  deptName: string
  manager: string
  memberCount: number
  description?: string
}

// 部门表单数据类型
export interface DeptFormData {
  deptName: string
  manager: string
  description?: string
}

// API 响应类型
export type ApiDeptResponse = ApiResponse<DeptResponse[]>