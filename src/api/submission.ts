import request from '@/utils/request'
import type { ApiResponse, PageResult } from '@/types/common'

// 定义提交状态枚举
export enum SubmissionStatus {
  SUBMITTED = 'submitted',
  GRADED = 'graded',
  LATE = 'late'
}

// 定义作业提交请求体类型 (学生提交)
export interface SubmissionRequest {
  assignmentId: number
  submissionContent: string
  submissionFileUrl?: string
  submissionFileOriginalName?: string
}

// 定义作业批改请求体类型 (教师批改)
export interface SubmissionGradeRequest {
  submissionId: number
  grade: number
  teacherComment?: string
}

// 定义作业提交响应数据类型
export interface SubmissionResponse {
  id: number
  assignmentId: number
  assignmentTitle: string
  studentId: number
  studentName: string
  studentNumber: string
  submissionContent: string
  submissionFileUrl?: string
  submissionFileOriginalName?: string
  submittedAt: string
  grade?: number
  teacherComment?: string
  status: SubmissionStatus
  updatedAt: string
}

// 学生提交作业
export const submitAssignment = (data: SubmissionRequest): Promise<ApiResponse<SubmissionResponse>> => {
  console.log('调用submitAssignment API, 数据:', data)
  return request.post<ApiResponse<SubmissionResponse>>('/api/submissions', data).then(response => response.data)
}

// 学生更新自己的提交
export const updateSubmission = (id: number, data: SubmissionRequest): Promise<ApiResponse<SubmissionResponse>> => {
  console.log(`调用updateSubmission API, ID: ${id}, 数据:`, data)
  return request.put<ApiResponse<SubmissionResponse>>(`/api/submissions/${id}`, data).then(response => response.data)
}

// 学生删除自己的提交
export const deleteSubmission = (id: number): Promise<ApiResponse<void>> => {
  console.log(`调用deleteSubmission API, ID: ${id}`)
  return request.delete<ApiResponse<void>>(`/api/submissions/${id}`).then(response => response.data)
}

// 获取提交详情 (单个提交)
export const getSubmissionDetail = (id: number): Promise<ApiResponse<SubmissionResponse>> => {
  console.log(`调用getSubmissionDetail API, ID: ${id}`)
  return request.get<ApiResponse<SubmissionResponse>>(`/api/submissions/${id}`).then(response => response.data)
}

// 根据作业ID获取所有提交 (教师/管理员)
export const getSubmissionsByAssignmentId = (assignmentId: number): Promise<ApiResponse<SubmissionResponse[]>> => {
  console.log(`调用getSubmissionsByAssignmentId API, assignmentId: ${assignmentId}`)
  return request.get<ApiResponse<SubmissionResponse[]>>(`/api/submissions/assignment/${assignmentId}`).then(response => response.data)
}

// 根据学生ID获取所有提交 (教师/管理员)
export const getSubmissionsByStudentId = (studentId: number): Promise<ApiResponse<SubmissionResponse[]>> => {
  console.log(`调用getSubmissionsByStudentId API, studentId: ${studentId}`)
  return request.get<ApiResponse<SubmissionResponse[]>>(`/api/submissions/student/${studentId}`).then(response => response.data)
}

// 学生获取自己针对某个作业的提交
export const getMySubmissionForAssignment = (assignmentId: number): Promise<ApiResponse<SubmissionResponse>> => {
  console.log(`调用getMySubmissionForAssignment API, assignmentId: ${assignmentId}`)
  return request.get<ApiResponse<SubmissionResponse>>(`/api/submissions/my-submission/${assignmentId}`).then(response => response.data)
}

// 教师批改作业提交
export const gradeSubmission = (data: SubmissionGradeRequest): Promise<ApiResponse<SubmissionResponse>> => {
  console.log('调用gradeSubmission API, 数据:', data)
  return request.post<ApiResponse<SubmissionResponse>>('/api/submissions/grade', data).then(response => response.data)
} 