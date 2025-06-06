import type { SubjectType } from './common'

// 统计卡片数据
export interface StatCard {
  title: string
  value: string
  icon: string 
  color: string
}

// 成绩分布
export interface GradeDistribution {
  '<60': number
  '60-70': number
  '70-80': number 
  '80-90': number
  '90-100': number
}

// 科目平均分
export interface SubjectAverage {
  subject: SubjectType
  avg: number
}

// 班级成绩数据
export interface ClassScoreData {
  student_id: number;
  student_number: string;
  student_name: string;
  exam_time: string;
  exam_type: string;
  exam_name: string;
  subjects: { [key: string]: number };
}

// 科目统计
export interface SubjectStats {
  subject: string;
  sum: number
  count: number
  avg?: number
}

// 班级统计
export interface ClassStats {
  [className: string]: {
    studentCount: number
    averageScores: Record<SubjectType, number>
    passRates: Record<SubjectType, number>
    distribution: Record<SubjectType, GradeDistribution>
  }
}