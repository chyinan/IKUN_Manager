import type { Response } from './common'

// 科目类型常量
export type SubjectType = '语文' | '数学' | '英语' | '物理' | '化学' | '生物'

// 单科成绩统计
export interface SubjectScore {
  sum: number
  count: number
  avg?: number
}

// 成绩数据
export interface ScoreData {
  [key in SubjectType]: number
  exam_type?: string
  exam_time?: string
}

// 班级成绩统计
export interface ClassScoreStats {
  [key in SubjectType]: SubjectScore
}

// 成绩分布
export interface ScoreDistribution {
  '<60': number
  '60-70': number
  '70-80': number
  '80-90': number
  '90-100': number
}

// API请求参数
export interface ScoreQueryParams {
  studentId?: number
  className?: string
  examType?: string
  startTime?: string
  endTime?: string
}

// API响应类型
export type ApiScoreResponse = Response<ScoreData>