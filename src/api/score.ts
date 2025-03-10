import request from '@/utils/request'
import type { ApiResponse, ScoreData } from '@/types/common'

// 获取成绩列表
export function getScoreList(params?: any) {
  return request.get<ApiResponse<any[]>>('/score/list', { params })
}

// 获取成绩详情
export function getScoreDetail(id: number) {
  return request.get<ApiResponse<any>>(`/score/${id}`)
}

// 添加成绩
export function addScore(data: any) {
  return request.post<ApiResponse<any>>('/score/add', data)
}

// 更新成绩
export function updateScore(id: number, data: any) {
  return request.put<ApiResponse<any>>(`/score/${id}`, data)
}

// 删除成绩
export function deleteScore(id: number) {
  return request.delete<ApiResponse<void>>(`/score/${id}`)
}

// 批量删除成绩
export function batchDeleteScore(ids: number[]) {
  return request.delete<ApiResponse<void>>('/score/batch', { data: { ids } })
}

// 获取成绩统计数据
export function getScoreStats() {
  return request.get<ApiResponse<any>>('/score/stats')
}

// 导入成绩数据
export function importScores(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  
  return request.post<ApiResponse<any>>('/score/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 导出成绩数据
export function exportScores(params?: any) {
  return request.get<Blob>('/score/export', {
    params,
    responseType: 'blob'
  })
}

// 获取学生列表（用于选择学生）
export function getStudentOptions() {
  return request.get<ApiResponse<any[]>>('/student/options')
}

// 获取考试类型选项
export function getExamTypeOptions() {
  return request.get<ApiResponse<string[]>>('/score/exam-types')
}

// 获取科目选项
export function getSubjectOptions() {
  return request.get<ApiResponse<string[]>>('/score/subjects')
}

// 获取学生成绩
export function getStudentScore(studentId: number, examType: string) {
  return request.get<ApiResponse<any>>(`/score/student/${studentId}`, {
    params: { examType }
  })
}

// 保存学生成绩
export function saveStudentScore(data: any) {
  return request.post<ApiResponse<any>>('/score/save', data)
}

// 获取班级成绩
export function getClassScores(classId: number, examType: string) {
  return request.get<ApiResponse<any>>(`/score/class/${classId}`, {
    params: { examType }
  })
}

// 测试API
export function testScoreApi() {
  return request.get<ApiResponse<boolean>>('/score/test')
}