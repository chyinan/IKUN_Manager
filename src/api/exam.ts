import request from '@/utils/request'
import type { Exam, ExamItemResponse, ApiResponse, Subject, ExamListResponse, ExamInfo, ExamFormData } from '@/types/common'
import type { AxiosResponse } from 'axios'

/**
 * 获取考试列表
 * @param params 查询参数
 * @returns Promise resolving to ApiResponse containing ExamListResponse in its data field
 */
export function getExamList(params?: any): Promise<ApiResponse<ExamListResponse>> {
  console.log('调用getExamList API, 参数:', params);
  return request.get<ApiResponse<ExamListResponse>>('/api/exam/list', { params })
    .then(response => {
        console.log('[getExamList API] 完整响应:', response);
        return response; // 确保返回完整的响应对象
    })
    .catch(error => {
      console.error('考试列表API请求失败:', error);
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(`API请求失败: ${error.response.data.message}`);
      }
      if (error.message && !error.response) {
        throw new Error(`API请求失败: ${error.message}`);
      }
      throw error;
    });
}

/**
 * 获取考试详情
 * @param id 考试ID
 */
export function getExamDetail(id: number): Promise<ApiResponse<ExamInfo>> {
  console.log('调用getExamDetail API, ID:', id); // 这里是修正后的行，注意单引号转义
  return request.get<ApiResponse<ExamInfo>>(`/api/exam/${id}`)
    .catch(error => {
      console.error('考试详情API请求失败:', error);
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(`API请求失败: ${error.response.data.message}`);
      }
      if (error.message && !error.response) {
        throw new Error(`API请求失败: ${error.message}`);
      }
      throw error;
    });
}

/**
 * 添加考试
 * @param data 考试信息
 * @returns Promise resolving to ApiResponse containing the created ExamInfo
 */
export function addExam(data: Partial<ExamFormData>): Promise<ApiResponse<ExamInfo>> {
  console.log('调用addExam API, 数据:', data);
  return request.post<ApiResponse<ExamInfo>>('/api/exam/add', data)
    .catch(error => {
      console.error('添加考试API请求失败:', error);
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(`API请求失败: ${error.response.data.message}`);
      }
      if (error.message && !error.response) {
        throw new Error(`API请求失败: ${error.message}`);
      }
      throw error;
    });
}

/**
 * 更新考试
 * @param id 考试ID
 * @param data 考试信息
 * @returns Promise resolving to ApiResponse containing the updated ExamInfo
 */
export function updateExam(id: number, data: Partial<ExamFormData>): Promise<ApiResponse<ExamInfo>> {
  console.log('调用updateExam API, ID:', id, '数据:', data); // 这里是修正后的行
  return request.put<ApiResponse<ExamInfo>>('/api/exam/update', data)
    .catch(error => {
      console.error('更新考试API请求失败:', error);
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(`API请求失败: ${error.response.data.message}`);
      }
      if (error.message && !error.response) {
        throw new Error(`API请求失败: ${error.message}`);
      }
      throw error;
    });
}

/**
 * 删除考试
 * @param id 考试ID
 * @returns Promise resolving to ApiResponse with null data
 */
export function deleteExam(id: number): Promise<ApiResponse<void>> {
  console.log('调用deleteExam API, ID:', id); // 这里是修正后的行
  return request.delete<ApiResponse<void>>(`/api/exam/delete/${id}`)
    .catch(error => {
      console.error('删除考试API请求失败:', error);
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(`API请求失败: ${error.response.data.message}`);
      }
      if (error.message && !error.response) {
        throw new Error(`API请求失败: ${error.message}`);
      }
      throw error;
    });
}

/**
 * 批量删除考试
 * @param ids 考试ID数组
 */
export function batchDeleteExam(ids: number[]): Promise<ApiResponse<void>> {
  console.log('调用batchDeleteExam API, IDs:', ids); // 这里是修正后的行
  return request.delete<ApiResponse<void>>('/api/exam/batch', { data: { ids } })
    .catch(error => {
      console.error('批量删除考试API请求失败:', error);
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(`API请求失败: ${error.response.data.message}`);
      }
      if (error.message && !error.response) {
        throw new Error(`API请求失败: ${error.message}`);
      }
      throw error;
    });
}

/**
 * 获取考试统计数据
 */
export function getExamStats() {
  console.log('调用getExamStats API');
  return request.get<ApiResponse<{
    total: number;
    completedCount: number;
    inProgressCount: number;
    upcomingCount: number;
    typeDistribution: Array<{type: string; count: number}>;
  }>>('/api/exam/stats')
}

/**
 * 导入考试数据
 * @param file 考试数据文件
 */
export function importExams(file: File) {
  console.log('调用importExams API, 文件:', file.name); // 这里是修正后的行
  const formData = new FormData()
  formData.append('file', file)
  
  return request.post<ApiResponse<any>>('/api/exam/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 导出考试数据
 * @param params 导出参数
 */
export function exportExams(params?: any) {
  console.log('调用exportExams API, 参数:', params); // 这里是修正后的行
  return request.get<Blob>('/api/exam/export', {
    params,
    responseType: 'blob'
  })
}

/**
 * 获取班级选项列表 (用于下拉框等)
 * @returns Promise resolving to ApiResponse containing an array of class options
 */
export function getClassOptions(): Promise<ApiResponse<{ id: number; class_name: string }[]>> {
  console.log('调用getClassOptions API');
  // 假设后端或 mock 返回 ApiResponse<{ id: number; class_name: string }[]>;
  return request.get<ApiResponse<{ id: number; class_name: string }[]>>('/api/class/options')
    .catch(error => {
      console.error('班级选项API请求失败:', error);
      if (error.response && error.response.data && error.response.data.message) {
         throw new Error(`API请求失败: ${error.response.data.message}`);
      }
       if (error.message && !error.response) {
         throw new Error(`API请求失败: ${error.message}`);
      }
      throw error;
    });
}

/**
 * 获取所有不重复的考试类型选项
 * @returns Promise resolving to ApiResponse containing an array of exam type strings
 */
export function getExamTypeOptions(): Promise<ApiResponse<string[]>> {
  console.log('调用getExamTypeOptions API');
  return request.get<ApiResponse<string[]>>('/api/exam/types')
    .catch(error => {
      console.error('考试类型选项API请求失败:', error);
      if (error.response && error.response.data && error.response.data.message) {
         throw new Error(`API请求失败: ${error.response.data.message}`);
      }
       if (error.message && !error.response) {
         throw new Error(`API请求失败: ${error.message}`);
      }
      throw error;
    });
}

/**
 * 发布考试 (更新考试状态)
 * @param id 考试ID
 */
export function publishExam(id: number): Promise<ApiResponse<null>> {
  console.log('调用publishExam API, ID:', id);
  return request.put<ApiResponse<null>>(`/api/exam/${id}/publish`)
    .catch(error => {
      console.error('发布考试API请求失败:', error);
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(`API请求失败: ${error.response.data.message}`);
      }
      if (error.message && !error.response) {
        throw new Error(`API请求失败: ${error.message}`);
      }
      throw error;
    });
}

/**
 * 取消发布考试 (更新考试状态)
 * @param id 考试ID
 */
export function unpublishExam(id: number): Promise<ApiResponse<null>> {
  console.log('调用unpublishExam API, ID:', id);
  return request.put<ApiResponse<null>>(`/api/exam/${id}/unpublish`)
    .catch(error => {
      console.error('取消发布考试API请求失败:', error);
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(`API请求失败: ${error.response.data.message}`);
      }
      if (error.message && !error.response) {
        throw new Error(`API请求失败: ${error.message}`);
      }
      throw error;
    });
}

/**
 * 更新考试状态
 * @param id 考试ID
 * @param status 状态值 (0: 未开始, 1: 进行中, 2: 已结束)
 */
export function updateExamStatus(id: number, status: number): Promise<ApiResponse<void>> {
  console.log('调用updateExamStatus API, ID:', id, '状态:', status);
  return request.put<ApiResponse<void>>(`/api/exam/${id}/status`, { status })
    .catch(error => {
      console.error('更新考试状态API请求失败:', error);
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(`API请求失败: ${error.response.data.message}`);
      }
      if (error.message && !error.response) {
        throw new Error(`API请求失败: ${error.message}`);
      }
      throw error;
    });
}

/**
 * 创建考试（如果不存在）
 * 主要用于前端表单提交时，判断是创建新考试还是更新现有考试
 * @param data 考试数据
 */
export function createExamIfNotExists(data: Partial<ExamFormData>): Promise<ApiResponse<ExamItemResponse>> {
  console.log('调用createExamIfNotExists API, 数据:', data);
  return request.post<ApiResponse<ExamItemResponse>>('/api/exam/create-if-not-exists', data)
    .catch(error => {
      console.error('创建考试（如果不存在）API请求失败:', error);
      throw error;
    });
}

/**
 * 根据考试类型获取考试列表
 * @param examType 考试类型
 */
export function getExamListByType(examType: string): Promise<ApiResponse<ExamItemResponse[]>> {
  console.log('调用getExamListByType API, 考试类型:', examType);
  return request.get<ApiResponse<ExamItemResponse[]>>(`/api/exam/type/${examType}`)
    .catch(error => {
      console.error('根据考试类型获取考试列表API请求失败:', error);
      throw error;
    });
}

/**
 * 获取所有考试类型
 */
export function getExamTypes(): Promise<ApiResponse<string[]>> {
  console.log('调用getExamTypes API');
  return request.get<ApiResponse<string[]>>('/api/exam/types')
    .catch(error => {
      console.error('获取考试类型API请求失败:', error);
      throw error;
    });
}

/**
 * 获取所有考试状态
 */
export function getExamStatuses(): Promise<ApiResponse<string[]>> {
  console.log('调用getExamStatuses API');
  return request.get<ApiResponse<string[]>>('/api/exam/statuses')
    .catch(error => {
      console.error('获取考试状态API请求失败:', error);
      throw error;
    });
}

/**
 * 获取考试科目列表
 */
export function getExamSubjects(): Promise<ApiResponse<Subject[]>> { // <<< Ensure this export exists
  console.log('调用getExamSubjects API');
  return request.get<ApiResponse<Subject[]>>('/api/exam/subjects')
    .catch(error => {
      console.error('获取考试科目列表API请求失败:', error);
      throw error;
    });
}

/**
 * 检查考试是否可以删除
 * @param id 考试ID
 */
export function checkExamCanDelete(id: number): Promise<ApiResponse<{ canDelete: boolean; message?: string }>> {
  console.log('调用checkExamCanDelete API, ID:', id);
  return request.get<ApiResponse<{ canDelete: boolean; message?: string }>>(`/api/exam/${id}/can-delete`)
    .catch(error => {
      console.error('检查考试是否可删除API请求失败:', error);
      throw error;
    });
}