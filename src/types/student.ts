import type { ApiResponse, SubjectType } from './common'

// 成绩响应数据
export interface StudentScoreResponse {
  student_id: string
  name: string
  class_name: string
  scores: {
    [subject: string]: number
  }
  exam_time: string
}

export interface StudentScore {
  studentId: string
  name: string
  className: string
  scores: {
    [K in SubjectType]: number
  }
  examTime: string
}

// 删除重复的 SubjectType 定义，使用从 common 导入的类型
// export type SubjectType = '语文' | '数学' | '英语' | '物理' | '化学' | '生物'

export interface ScoreStatistics {
  sum: number
  count: number
}

export interface ClassScoreStats {
  [subject: string]: ScoreStatistics
}

export type ApiStudentScoreResponse = ApiResponse<StudentScoreResponse[]>

// 后端返回的学生数据类型
export interface StudentItemResponse {
  id: number
  student_id: string
  name: string
  gender: string
  class_name: string
  phone: string
  email: string
  join_date: string
  create_time: string
}

// 前端使用的学生数据类型
export interface StudentItem {
  id: number
  studentId: string
  name: string
  gender: string
  className: string
  phone: string
  email: string
  joinDate: string
  createTime: string
}

// 学生表单数据类型
export interface StudentFormData {
  id?: number
  studentId: string
  name: string
  gender: string
  className: string
  phone: string
  email: string
  joinDate: string
}

// API 响应类型
export type ApiStudentResponse = ApiResponse<StudentItemResponse[]>