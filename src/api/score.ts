import request from '@/utils/request'

export interface ScoreData {
  id?: number
  student_id: number
  subject: string
  score: number
  exam_time: string
  exam_type: string
}

// 获取学生成绩
export const getStudentScore = (
  studentId: number,
  examType: string,
  examTime?: string
) => {
  return request({
    url: `/score/${studentId}`,
    method: 'get',
    params: {
      exam_type: examType,
      exam_time: examTime
    }
  })
}

// 保存学生成绩
export const saveStudentScore = (
  studentId: number, 
  scores: Record<string, number>,
  examType: string,
  examTime: string
) => {
  return request({
    url: '/score/save',
    method: 'post',
    data: {
      student_id: studentId,
      scores,
      exam_type: examType,
      exam_time: examTime
    }
  })
}

// 测试API连接
export const testScoreApi = () => {
  console.log('正在测试成绩API')
  return request({
    url: '/score/test',
    method: 'get'
  })
}