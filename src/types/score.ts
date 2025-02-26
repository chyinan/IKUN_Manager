import type { SubjectType, ApiResponse } from './common'
export type { SubjectType } // 重新导出类型

// 成绩数据类型
export type ScoreData = {
  [K in SubjectType]: number
} & {
  exam_type?: string
  exam_time?: string
}

// 统计数据
export type ScoreStatistics = {
  [K in SubjectType]: {
    sum: number
    count: number
    avg?: number
  }
}

// 分布数据
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
export type ApiScoreResponse = ApiResponse<ScoreData>