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
  return request.get<ApiResponse<ScoreDetail[]>>('/score/list', { params })
    .catch(error => {
        console.error('[API score.ts] Error fetching score list:', error);
        throw error;
    });
}

// 获取成绩详情
export function getScoreDetail(id: number) {
  console.log('调用getScoreDetail API, ID:', id);
  return request.get<ApiResponse<ScoreDetail>>(`/score/${id}`)
}

// 添加成绩
export function addScore(data: SaveScoreParams) {
  console.log('调用addScore API, 数据:', data);
  return request.post<ApiResponse<ScoreDetail>>('/score/add', data)
}

// 更新成绩
export function updateScore(id: number, data: Partial<SaveScoreParams>) {
  console.log('调用updateScore API, ID:', id, '数据:', data);
  return request.put<ApiResponse<ScoreDetail>>(`/score/${id}`, data)
}

// 删除成绩
export function deleteScore(id: number) {
  console.log('调用deleteScore API, ID:', id);
  return request.delete<ApiResponse<void>>(`/score/${id}`)
}

// 批量删除成绩
export function batchDeleteScore(ids: number[]) {
  console.log('调用batchDeleteScore API, IDs:', ids);
  return request.delete<ApiResponse<void>>('/score/batch', { data: { ids } })
}

// 获取成绩统计数据
export const getScoreStats = (): Promise<ApiResponse<any>> => {
  console.log('调用getScoreStats API');
  return request.get<ApiResponse<any>>('/score/stats')
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
  
  return request.post<ApiResponse<any>>('/score/import', formData, {
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
  return request.get<Blob>('/score/export', {
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
  }>>>('/student/options')
}

// 获取考试类型选项
export function getExamTypeOptions(): Promise<ApiResponse<string[]>> {
  return request.get<ApiResponse<string[]>>('/score/exam-types')
    .catch(error => {
      console.error('[API score.ts] Error fetching exam types for score:', error);
      throw error;
    });
}

// 获取科目选项
export function getSubjectOptions(): Promise<ApiResponse<string[]>> {
  return request.get<ApiResponse<string[]>>('/score/subjects')
    .catch(error => {
      console.error('[API score.ts] Error fetching subjects for score:', error);
      throw error;
    });
}

// 获取学生成绩
export const getStudentScore = (studentId: number, examType: string): Promise<ApiResponse<ScoreData>> => {
  return request.get<ApiResponse<ScoreData>>(`/score/student/${studentId}`, {
    params: { examType }
  })
    .catch(error => {
        console.error(`[API score.ts] Error fetching scores for student ${studentId}, exam type ${examType}:`, error);
        throw error;
    });
}

// 保存学生成绩
export const saveStudentScore = (data: SaveScoreParams): Promise<ApiResponse<boolean>> => {
  return request.post<ApiResponse<boolean>>('/score/save', data)
    .catch(error => {
        console.error('[API score.ts] Error saving student score:', error);
        throw error;
    });
}

// 获取班级成绩
export function getClassScores(classId: number, examType: string): Promise<ApiResponse<any>> {
  return request.get<ApiResponse<any>>(`/score/class/${classId}`, {
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
  return request.get<ApiResponse<any>>('/score/student-stats', { params })
    .catch(error => {
        console.error('[API score.ts] Error fetching student score stats:', error);
        throw error;
    });
}

// 获取学生成绩汇总
export const getStudentScoreSummary = (params: ScoreStatsQueryParams): Promise<ApiResponse<any>> => {
  console.log('调用getStudentScoreSummary API, 参数:', params);
  return request.get<ApiResponse<any>>('/score/student-summary', { params })
    .catch(error => {
        console.error('[API score.ts] Error fetching student score summary:', error);
        throw error;
    });
}

// 获取班级成绩统计
export const getClassScoreStats = (params: ScoreStatsQueryParams): Promise<ApiResponse<any>> => {
  console.log('调用getClassScoreStats API, 参数:', params);
  return request.get<ApiResponse<any>>('/score/class-stats', { params })
    .catch(error => {
        console.error('[API score.ts] Error fetching class score stats:', error);
        throw error;
    });
}

// 测试API连接
export async function testConnection() {
  try {
    const response = await request.get<ApiResponse<boolean>>('/score/test');
    return response.data;
  } catch (error) {
    console.error('测试API连接失败:', error);
    return false;
  }
}

/**
 * 获取考试类型列表
 * @returns {Promise<string[]>} 考试类型列表
 */
export async function getExamTypes() {
  try {
    const response = await axios.get(`${apiUrl}/score/exam-types`);
    return response.data.data || [];
  } catch (error) {
    console.error('获取考试类型列表失败:', error);
    return [];
  }
}

/**
 * 获取考试列表 (根据类型，用于成绩录入)
 * @param {string} examType 考试类型
 * @returns {Promise<any[]>} 考试列表 - 只返回列表本身
 */
export async function getExams(examType: string): Promise<any[]> {
  try {
    const response = await request.get<ApiResponse<{ list: any[], total: number }>>(`/exam/list`, {
      params: { examType }
    });
    console.log('[API score.ts] getExams response:', response);
    return response.data?.list || [];
  } catch (error) {
    console.error('获取考试列表失败:', error);
    throw error;
  }
}

// 获取学生成绩（通过考试ID）
export const getStudentScoreByExamId = (studentId: number, examId: number): Promise<ApiResponse<ScoreData>> => {
  return request.get<ApiResponse<ScoreData>>(`/score/student/${studentId}`, {
    params: { examId }
  })
    .catch(error => {
        console.error(`[API score.ts] Error fetching scores for student ${studentId}, exam ID ${examId}:`, error);
        throw error;
    });
}

// 获取学生成绩（通过考试类型，兼容旧接口）
export async function getStudentScoreByType(studentId: number, examType: string) {
  try {
    const response = await axios.get(`${apiUrl}/score/student/${studentId}`, {
      params: { examType }
    });
    return response.data.data;
  } catch (error) {
    console.error('获取学生成绩失败:', error);
    return null;
  }
}

/**
 * 保存学生成绩
 * @param {object} scoreData 成绩数据
 * @returns {Promise<boolean>} 保存结果
 */
export async function saveStudentScoreDirectly(scoreData: any) {
  try {
    const response = await axios.post(`${apiUrl}/score/save`, scoreData);
    return response.data.success;
  } catch (error) {
    console.error('保存学生成绩失败:', error);
    return false;
  }
}

export const getScoreReportByClass = (params: { examId: number; classId: number }): Promise<ApiResponse<any[]>> => {
  return request.get<ApiResponse<any[]>>('/score/report/class', { params })
    .then(response => {
        console.log('[API score.ts] getScoreReportByClass response:', response);
        // Return the entire response object as declared
        return response; 
    })
    .catch(error => {
        console.error('[API score.ts] Error fetching class score report:', error);
        // Re-throw the error for the caller to handle
        throw error; 
    });
};

// 获取学生成绩报告 (单个学生的所有考试)
export const getScoreReportByStudent = (studentId: number): Promise<ApiResponse<any[]>> => {
  return request.get<ApiResponse<any[]>>(`/score/report/student/${studentId}`)
    .then(response => {
      console.log('[API score.ts] getScoreReportByStudent response:', response);
      // Return the entire response object as declared
      return response;
    })
    .catch(error => {
      console.error(`[API score.ts] Error fetching score report for student ID ${studentId}:`, error);
       // Re-throw the error for the caller to handle
      throw error;
    });
};

// 获取特定考试下某个班级所有学生的成绩列表
export const getScoresByExamAndClass = (examId: number, classId: number): Promise<ApiResponse<any[]>> => {
  return request.get<ApiResponse<any[]>>('/score/report/class', { params: { examId, classId } })
    .then(response => {
        console.log('[API score.ts] getScoresByExamAndClass response:', response);
        // Return the entire response object as declared
        return response; 
    })
    .catch(error => {
        console.error('[API score.ts] Error fetching scores by exam and class:', error);
        // Re-throw the error for the caller to handle
        throw error; 
    });
};

// Interface for the response of /api/student/:studentId/exams-taken
export interface ExamTaken {
  exam_id: number;
  exam_name: string;
  exam_date: string; // Assuming 'YYYY-MM-DD'
  exam_type: string; // Added exam_type
}

// Interface for the detailed score report
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

/**
 * 获取学生已参加的考试列表
 * @param studentId 学生ID (student table primary key)
 */
export const getStudentExamsTaken = (studentId: number): Promise<ApiResponse<ExamTaken[]>> => {
  return request.get<ApiResponse<ExamTaken[]>>(`/student/${studentId}/exams-taken`)
    .catch(error => {
      console.error(`[API score.ts] Error fetching exams taken for student ${studentId}:`, error);
      // Return a consistent error structure that front-end can expect
      return Promise.resolve({
        code: error.response?.status || 500,
        message: error.message || '获取已参加考试列表失败',
        data: [] // Return empty array on error
      });
    });
};

/**
 * 获取学生的详细成绩报告
 * @param studentId 学生ID (student table primary key)
 * @param examId 考试ID
 */
export const getStudentScoreReport = (studentId: number, examId: number): Promise<ApiResponse<StudentScoreReport | null>> => {
  return request.get<ApiResponse<StudentScoreReport | null>>(`/score-report/student/${studentId}/exam/${examId}`)
    .catch(error => {
      console.error(`[API score.ts] Error fetching score report for student ${studentId}, exam ${examId}:`, error);
      return Promise.resolve({
        code: error.response?.status || 500,
        message: error.message || '获取成绩报告失败',
        data: null // Return null on error
      });
    });
};

/**
 * 获取指定学生即将参加的考试列表
 * @param studentId - 学生的 user.id
 * @returns
 */
export function getStudentUpcomingExams(studentId: number): Promise<ApiResponse<ExamTaken[]>> {
    return request.get<ApiResponse<ExamTaken[]>>(`/student/${studentId}/exams-upcoming`);
}

export default {
  testConnection,
  getExamTypes,
  getExams,
  getStudentScoreByType,
  getStudentScoreByExamId,
  saveStudentScoreDirectly
};