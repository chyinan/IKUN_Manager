import type { Response } from './common'

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

export type SubjectType = '语文' | '数学' | '英语' | '物理' | '化学' | '生物'

export interface ScoreStatistics {
  sum: number
  count: number
}

export interface ClassScoreStats {
  [subject: string]: ScoreStatistics
}

export type ApiStudentScoreResponse = Response<StudentScoreResponse[]>