import request from '@/utils/request'
import type { ApiResponse, ScoreData, SubjectScore } from '@/types/common'
import axios from 'axios'
import { apiUrl } from './config'

// 成绩查询参数接口
export interface ScoreQueryParams {
  studentId?: number
  studentName?: string
  className?: string
  examId?: number
  examType?: string
  subject?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

// 成绩详情接口
export interface ScoreDetail {
  id: number
  student_id: string
  student_name: string
  class_name?: string
  subject: string
  score: number
  exam_time: string
  exam_type: string
  exam_name?: string
  exam_id?: number
}

// 学生成绩保存参数
export interface SaveScoreParams {
  studentId: number
  examId?: number
  examType: string
  examDate?: string
  scores: Record<string, number>
}

// 获取成绩列表
export const getScoreList = (params?: any): Promise<ApiResponse<ScoreDetail[]>> => {
  console.log('调用getScoreList API, 参数:', params);
  return request.get<ApiResponse<ScoreDetail[]>>('api/score/list', { params }) // Added api/
    .catch(error => {
        console.error('[API score.ts] Error fetching score list:', error);
        throw error;
    });
}

// 获取成绩详情
export function getScoreDetail(id: number) {
  console.log('调用getScoreDetail API, ID:', id);
  return request.get<ApiResponse<ScoreDetail>>(`api/score/${id}`) // Added api/
}

// 添加成绩
export function addScore(data: SaveScoreParams) {
  console.log('调用addScore API, 数据:', data);
  return request.post<ApiResponse<ScoreDetail>>('api/score/add', data) // Added api/
}

// 更新成绩
export function updateScore(id: number, data: Partial<SaveScoreParams>) {
  console.log('调用updateScore API, ID:', id, '数据:', data);
  return request.put<ApiResponse<ScoreDetail>>(`api/score/${id}`, data) // Added api/
}

// 删除成绩
export function deleteScore(id: number) {
  console.log('调用deleteScore API, ID:', id);
  return request.delete<ApiResponse<void>>(`api/score/${id}`) // Added api/
}

// 批量删除成绩
export function batchDeleteScore(ids: number[]) {
  console.log('调用batchDeleteScore API, IDs:', ids);
  return request.delete<ApiResponse<void>>('api/score/batch', { data: { ids } }) // Added api/
}

// 获取成绩统计数据
export const getScoreStats = (): Promise<ApiResponse<any>> => {
  console.log('调用getScoreStats API');
  return request.get<ApiResponse<any>>('api/score/stats') // Added api/
    .catch(error => {
        console.error('[API score.ts] Error fetching score stats:', error);
        throw error;
    });
}

// 导入成绩数据
export const importScores = (file: File): Promise<ApiResponse<any>> => {
  console.log('调用importScores API, 文件:', file.name);
  const formData = new FormData()
  formData.append('file', file)
  
  return request.post<ApiResponse<any>>('api/score/import', formData, { // Added api/
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
    .catch(error => {
        console.error('[API score.ts] Error importing scores:', error);
        throw error;
    });
}

// 导出成绩数据
export const exportScores = (params?: any): Promise<Blob> => {
  console.log('调用exportScores API, 参数:', params);
  return request.get<Blob>('api/score/export', { // Added api/
    params,
    responseType: 'blob'
  })
    .catch(error => {
        console.error('[API score.ts] Error exporting scores:', error);
        throw error;
    });
}

// 获取学生列表（用于选择学生）
export function getStudentOptions() {
  console.log('调用getStudentOptions API');
  return request.get<ApiResponse<Array<{
    id: number;
    name: string;
    student_id: string;
    class_name?: string;
  }>>>('api/student/options') // Added api/
}

// 获取考试类型选项
export function getExamTypeOptions(): Promise<ApiResponse<string[]>> {
  return request.get<ApiResponse<string[]>>('api/score/exam-types') // Added api/
    .catch(error => {
      console.error('[API score.ts] Error fetching exam types for score:', error);
      throw error;
    });
}

// 获取科目选项
export function getSubjectOptions(): Promise<ApiResponse<string[]>> {
  return request.get<ApiResponse<string[]>>('api/score/subjects') // Added api/
    .catch(error => {
      console.error('[API score.ts] Error fetching subjects for score:', error);
      throw error;
    });
}

// 获取学生成绩
export const getStudentScore = (studentId: number, examType: string): Promise<ApiResponse<ScoreData>> => {
  return request.get<ApiResponse<ScoreData>>(`api/score/student/${studentId}`, { // Added api/
    params: { examType }
  })
    .catch(error => {
        console.error(`[API score.ts] Error fetching scores for student ${studentId}, exam type ${examType}:`, error);
        throw error;
    });
}

// 保存学生成绩
export const saveStudentScore = (data: SaveScoreParams): Promise<ApiResponse<boolean>> => {
  return request.post<ApiResponse<boolean>>('api/score/save', data) // Added api/
    .catch(error => {
        console.error('[API score.ts] Error saving student score:', error);
        throw error;
    });
}

// 获取班级成绩
export function getClassScores(classId: number, examType: string): Promise<ApiResponse<any>> {
  return request.get<ApiResponse<any>>(`api/score/class/${classId}`, { // Added api/
    params: { examType }
  });
}

// 获取学生成绩详细统计
export interface ScoreStatsQueryParams {
  studentId?: number
  examId?: number
  classId?: number
  examType?: string
  subject?: string
  studentNumber?: string
}

// 获取学生成绩详细统计
export const getStudentScoreStats = (params: ScoreStatsQueryParams): Promise<ApiResponse<any>> => {
  console.log('调用getStudentScoreStats API, 参数:', params);
  return request.get<ApiResponse<any>>('api/score/student-stats', { params }) // Added api/
    .catch(error => {
        console.error('[API score.ts] Error fetching student score stats:', error);
        throw error;
    });
}

// 获取学生成绩汇总
export const getStudentScoreSummary = (params: ScoreStatsQueryParams): Promise<ApiResponse<any>> => {
  console.log('调用getStudentScoreSummary API, 参数:', params);
  return request.get<ApiResponse<any>>('api/score/student-summary', { params }) // Added api/
    .catch(error => {
        console.error('[API score.ts] Error fetching student score summary:', error);
        throw error;
    });
}

// 获取班级成绩详细统计
export const getClassScoreStats = (params: ScoreStatsQueryParams): Promise<ApiResponse<any>> => {
  console.log('调用getClassScoreStats API, 参数:', params);
  return request.get<ApiResponse<any>>('api/score/class-stats', { params }) // Added api/
    .catch(error => {
        console.error('[API score.ts] Error fetching class score stats:', error);
        throw error;
    });
}

/**
 * 测试后端连接
 * @deprecated 仅用于开发调试，最终版本应移除
 */
export async function testConnection() {
  try {
    const response = await axios.get(`${apiUrl}/test/connection`); // This still uses apiUrl, which has /api
    console.log('Connection Test Response:', response.data);
    ElMessage.success('后端连接成功！');
    return response.data;
  } catch (error) {
    console.error('后端连接失败:', error);
    ElMessage.error('后端连接失败，请检查服务器状态。');
    throw error;
  }
}

/**
 * 获取所有考试类型
 */
export async function getExamTypes() {
  try {
    const response = await axios.get(`${apiUrl}/exam/types`); // This still uses apiUrl, which has /api
    return response.data;
  } catch (error) {
    console.error('Error fetching exam types:', error);
    throw error;
  }
}

/**
 * 根据考试类型获取考试列表
 * @param examType 考试类型
 */
export async function getExams(examType: string): Promise<any[]> {
  try {
    const response = await axios.get(`${apiUrl}/exam/listByType`, { params: { type: examType } }); // This still uses apiUrl, which has /api
    return response.data.data; // Assuming data structure is { code, message, data: [] }
  } catch (error) {
    console.error('Error fetching exams by type:', error);
    throw error;
  }
}

// 获取某个学生的某次考试成绩
export const getStudentScoreByExamId = (studentId: number, examId: number): Promise<ApiResponse<ScoreData>> => {
  console.log(`调用getStudentScoreByExamId API, studentId: ${studentId}, examId: ${examId}`);
  return request.get<ApiResponse<ScoreData>>(`api/score/student/${studentId}/exam/${examId}`) // Added api/
    .catch(error => {
        console.error(`[API score.ts] Error fetching score for student ${studentId} exam ${examId}:`, error);
        throw error;
    });
}

// 获取学生特定类型的考试成绩
export async function getStudentScoreByType(studentId: number, examType: string) {
  try {
    const response = await request.get<ApiResponse<ScoreData>>(`api/score/student/${studentId}/type/${examType}`); // Added api/
    return response.data; // 返回data部分
  } catch (error) {
    console.error(`[API score.ts] Error fetching student score by type for student ${studentId}, type ${examType}:`, error);
    throw error;
  }
}

// 直接保存学生成绩（如果后端API支持）
export async function saveStudentScoreDirectly(scoreData: any) {
  try {
    const response = await request.post<ApiResponse<any>>('api/score/saveDirectly', scoreData); // Added api/
    return response.data;
  } catch (error) {
    console.error('[API score.ts] Error saving student score directly:', error);
    throw error;
  }
}

// 根据班级获取成绩报告
export const getScoreReportByClass = (params: { examId: number; classId: number }): Promise<ApiResponse<any[]>> => {
  console.log('调用getScoreReportByClass API, 参数:', params);
  return request.get<ApiResponse<any[]>>('api/score/report/class', { params }) // Added api/
    .catch(error => {
      console.error('[API score.ts] Error fetching score report by class:', error);
      throw error;
    });
};

// 根据学生获取成绩报告
export const getScoreReportByStudent = (studentId: number): Promise<ApiResponse<any[]>> => {
  console.log('调用getScoreReportByStudent API, studentId:', studentId);
  return request.get<ApiResponse<any[]>>(`api/score/report/student/${studentId}`) // Added api/
    .catch(error => {
      console.error('[API score.ts] Error fetching score report by student:', error);
      throw error;
    });
};

// 获取某个考试某个班级的成绩列表 (供后台管理使用)
export const getScoresByExamAndClass = (examId: number, classId: number): Promise<ApiResponse<any[]>> => {
  console.log(`调用getScoresByExamAndClass API, examId: ${examId}, classId: ${classId}`);
  return request.get<ApiResponse<any[]>>(`api/score/exam/${examId}/class/${classId}`) // Added api/
    .catch(error => {
      console.error('[API score.ts] Error fetching scores by exam and class:', error);
      throw error;
    });
};

export interface ExamTaken {
  exam_id: number;
  exam_name: string;
  exam_date: string; // Assuming 'YYYY-MM-DD'
  exam_type: string;
  subjects?: string; // Add optional subjects string
}

export interface SubjectScoreDetail {
  subject_name: string;
  student_score: number | null;
  class_average_score: number | null;
  class_subject_rank: number | null;
}

export interface TotalScoreDetails {
  student_total_score: number | null;
  class_average_total_score: number | null;
  class_total_score_rank: number | null;
  grade_total_score_rank: number | null;
}

export interface StudentScoreReport {
  student_info: {
    id: number;
    name: string;
    student_id_str: string;
  };
  class_info: {
    id: number | null; // Class might be null
    name: string | null;
  };
  exam_info: {
    id: number;
    name: string;
    date: string;
    subjects: string[];
  };
  subject_details: SubjectScoreDetail[];
  total_score_details: TotalScoreDetails;
}

export const getStudentExamsTaken = (studentId: number): Promise<ApiResponse<ExamTaken[]>> => {
  console.log('调用getStudentExamsTaken API, studentId:', studentId);
  return request.get<ApiResponse<ExamTaken[]>>(`api/score/student/${studentId}/exams-taken`) // Added api/
    .catch(error => {
      console.error('[API score.ts] Error fetching student exams taken:', error);
      throw error;
    });
};

export const getStudentScoreReport = (studentId: number, examId: number): Promise<ApiResponse<StudentScoreReport | null>> => {
  console.log(`调用getStudentScoreReport API, studentId: ${studentId}, examId: ${examId}`);
  return request.get<ApiResponse<StudentScoreReport | null>>(`api/score/student/${studentId}/exam-report/${examId}`) // Added api/
    .catch(error => {
      console.error('[API score.ts] Error fetching student score report:', error);
      throw error;
    });
};

export function getStudentUpcomingExams(studentId: number): Promise<ApiResponse<ExamTaken[]>> {
  console.log('调用getStudentUpcomingExams API, studentId:', studentId);
  return request.get<ApiResponse<ExamTaken[]>>(`api/score/student/${studentId}/upcoming-exams`) // Added api/
    .catch(error => {
      console.error('[API score.ts] Error fetching student upcoming exams:', error);
      throw error;
    });
}