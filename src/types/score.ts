import type { ApiResponse } from './common'

// 科目类型
export type SubjectType = '语文' | '数学' | '英语' | '物理' | '化学' | '生物'

// 科目成绩数据结构
export interface SubjectScore {
  sum: number
  count: number
}

// 成绩数据结构
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

// 成绩查询参数
export interface ScoreQueryParams {
  classId?: number
  studentId?: number
  examType?: string
  startDate?: string
  endDate?: string
}

// 成绩分布
export interface ScoreDistribution {
  excellent: number // 优秀 (90-100)
  good: number      // 良好 (80-89)
  average: number   // 中等 (70-79)
  pass: number      // 及格 (60-69)
  fail: number      // 不及格 (0-59)
}

// API响应类型
export type ApiScoreResponse = ApiResponse<ScoreData>

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

// 成绩统计响应类型
export type ApiScoreStatisticsResponse = ApiResponse<ScoreStatistics>