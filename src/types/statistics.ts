// 统计数据类型定义
export interface StatCard {
  title: string
  value: string
  icon: string 
  color: string
}

export interface GradeDistribution {
  '<60': number
  '60-70': number
  '70-80': number 
  '80-90': number
  '90-100': number
}

export interface SubjectAverage {
  subject: SubjectType
  avg: number
}

export interface ClassScoreData {
  name: string
  value: number[]
}