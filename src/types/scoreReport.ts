import type { SubjectType, ScoreData } from './score'

// 成绩等级
export type GradeLevel = 'A' | 'B' | 'C' | 'D' | 'E'

// 成绩分析数据
export interface ScoreAnalysis {
  subjectName: SubjectType
  averageScore: number
  maxScore: number
  minScore: number
  passRate: number
  excellentRate: number
}

// 图表数据类型
export interface ChartData {
  name: string
  value: number[]
}

// 成绩报表数据
export interface ScoreReportData {
  classStats: {
    [className: string]: {
      studentCount: number
      averageScores: { [key in SubjectType]: number }
      passRates: { [key in SubjectType]: number }
      distribution: {
        [key in SubjectType]: {
          [grade in GradeLevel]: number
        }
      }
    }
  }
  subjectAnalysis: ScoreAnalysis[]
}