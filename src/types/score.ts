import type { ApiResponse, SubjectType } from './common'
export type { SubjectType } // 重新导出类型

// 成绩数据类型
export type ScoreData = {
  [K in SubjectType]: number
} & {
  exam_type?: string
  exam_time?: string
}

// 成绩统计接口
export interface ScoreStatistics {
  [subject: string]: {  // 改为索引签名
    sum: number
    count: number
    average?: number
    max?: number
    min?: number
  }
}

// 使用示例:
const scoreStats: ScoreStatistics = {
  '语文': {
    sum: 750,
    count: 10,
    average: 75,
    max: 95,
    min: 60
  },
  // ... 其他科目
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

// 成绩统计响应类型
export type ApiScoreStatisticsResponse = ApiResponse<ScoreStatistics>