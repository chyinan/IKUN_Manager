import type { BaseFields, ApiResponse } from './common'

// 后端返回的部门数据类型
export interface DeptResponseData {
  id: number
  dept_name: string
  manager: string
  member_count: number
  description: string | null
  create_time: string
}

// API响应类型
export type ApiDeptResponse = ApiResponse<DeptResponseData[]>

// 前端使用的部门数据类型 
export interface DeptItem {
  id: number
  deptName: string
  manager: string
  memberCount: number
  description?: string
  createTime: string
}

// 部门表单数据类型
export interface DeptFormData {
  deptName: string
  manager: string
  description?: string
}

// 添加后端接收的数据类型定义
export interface DeptBackendData {
  dept_name: string
  manager: string
  description?: string
}