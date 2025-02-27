import request from '@/utils/request'
import type { ScoreData, ScoreQueryParams, ApiScoreResponse, ScoreDistribution, SubjectType } from '@/types/score'

// 获取学生成绩
export const getStudentScore = (
  studentId: number,
  examType: string,
  examTime?: string
) => {
  return request.get<ScoreData>(`/score/${studentId}`, {
    params: {
      exam_type: examType,
      exam_time: examTime
    }
  })
}

// 保存学生成绩
export const saveStudentScore = (
  studentId: number,
  scores: ScoreData,
  examType: string,
  examTime: string
) => {
  return request.post<void>('/score/save', {
    student_id: studentId,
    scores,
    exam_type: examType,
    exam_time: examTime
  })
}

// 批量获取班级成绩
export const getClassScores = (params: ScoreQueryParams) => {
  return request.get<ScoreData[]>('/score/class', { params })
}

// 获取成绩统计
export const getScoreStats = (params: ScoreQueryParams) => {
  return request.get<{
    distribution: ScoreDistribution
    averages: { [key in SubjectType]: number }
  }>('/score/stats', { params })
}

// 添加测试API
export const testScoreApi = () => {
  return request.get<{ code: number, message: string }>('/score/test')
}