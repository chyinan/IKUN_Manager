// 基础通用类型定义
export interface ApiResponse<T = any> {
  code: number
  data?: T
  message: string
}

// 带分页的响应类型
export interface PageResponse<T = any> extends ApiResponse<T> {
  total: number
  pageSize: number
  currentPage: number
}

// 基础字段类型
export interface BaseFields {
  id: number
  createTime: string
  updateTime?: string 
}

export type ResponseData<T> = T extends Array<any> ? T : T[]

// API 响应数据类型
export interface ApiData<T> {
  code: number
  data: T
  message: string
}

// 后端返回的类型
export interface BackendResponse<T> {
  data: T[]
  total?: number
}

// 分页相关类型
export interface Pagination {
  currentPage: number
  pageSize: number
  total: number
}

// 基础数据类型
export interface ClassItem {
  id: number
  className: string
  teacher: string
  studentCount: number
  createTime: string
}

export interface StudentItem {
  id: number
  studentId: string
  name: string
  class_name: string
  phone: string
  email: string
  joinDate: string
}

export interface DeptItem {
  id: number
  deptName: string
  manager: string
  memberCount: number
  description: string
  createTime: string
}

export interface EmployeeItem {
  id: number
  name: string
  deptName: string
  position: string
  salary: number
  status: string
  phone: string
  email: string
  joinDate: string
}

// 科目相关类型
export type SubjectType = '语文' | '数学' | '英语' | '物理' | '化学' | '生物'

// 科目成绩接口
export interface SubjectScore {
  sum: number
  count: number
}

// 成绩数据类型
export interface ScoreData {
  语文: SubjectScore
  数学: SubjectScore
  英语: SubjectScore
  物理: SubjectScore
  化学: SubjectScore
  生物: SubjectScore
  exam_type?: string
  exam_time?: string
}

// 日志数据类型
export interface LogItem {
  id: number
  type: 'database' | 'vue' | 'system'
  operation: string
  content: string
  operator: string
  createTime: string
}

// API 响应类型
export type ClassResponse = ApiResponse<ClassItem[]>
export type StudentResponse = ApiResponse<StudentItem[]>
export type DeptResponse = ApiResponse<DeptItem[]>
export type EmployeeResponse = ApiResponse<EmployeeItem[]>
export type ScoreResponse = ApiResponse<ScoreData>
export type LogResponse = ApiResponse<LogItem[]>