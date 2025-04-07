import request from '@/utils/request'
import type { ExamItem, ExamItemResponse, ApiResponse, Subject, ExamListResponse, ExamInfo } from '@/types/common'
import type { AxiosResponse } from 'axios'

/**
 * 获取考试列表
 * @param params 查询参数
 * @returns Promise resolving to ApiResponse containing ExamListResponse in its data field
 */
export function getExamList(params?: any): Promise<ApiResponse<ExamListResponse>> {
  console.log('调用getExamList API, 参数:', params);
  return request.get<ApiResponse<ExamListResponse>>('/exam/list', { params })
    .then(response => response.data)
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
  console.log('调用getExamDetail API, ID:', id);
  return request.get<ApiResponse<ExamInfo>>(`/exam/${id}`)
    .then(response => response.data)
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
export function addExam(data: Partial<ExamItem>): Promise<ApiResponse<ExamInfo>> {
  console.log('调用addExam API, 数据:', data);
  return request.post<ApiResponse<ExamInfo>>('/exam/add', data)
    .then(response => response.data)
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
export function updateExam(id: number, data: Partial<ExamItem>): Promise<ApiResponse<ExamInfo>> {
  console.log('调用updateExam API, ID:', id, '数据:', data);
  return request.put<ApiResponse<ExamInfo>>(`/exam/${id}`, data)
    .then(response => response.data)
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
  console.log('调用deleteExam API, ID:', id);
  return request.delete<ApiResponse<void>>(`/exam/${id}`)
    .then(response => response.data)
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
  console.log('调用batchDeleteExam API, IDs:', ids);
  return request.delete<ApiResponse<void>>('/exam/batch', { data: { ids } })
    .then((response: AxiosResponse<ApiResponse<void>>) => {
      console.log('批量删除考试API响应成功 (AxiosResponse):', response);
      const apiResponse = response.data;
      if (apiResponse && typeof apiResponse.code === 'number') {
        return apiResponse;
      } else {
        console.error('批量删除考试API响应数据格式不符合预期 (Data):', apiResponse);
        return Promise.reject(apiResponse || new Error('API响应数据格式不正确'));
      }
    })
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
  }>>('/exam/stats')
}

/**
 * 导入考试数据
 * @param file 考试数据文件
 */
export function importExams(file: File) {
  console.log('调用importExams API, 文件:', file.name);
  const formData = new FormData()
  formData.append('file', file)
  
  return request.post<ApiResponse<any>>('/exam/import', formData, {
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
  console.log('调用exportExams API, 参数:', params);
  return request.get<Blob>('/exam/export', {
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
  // 假设后端或 mock 返回 ApiResponse<{ id: number; class_name: string }[]>
  return request.get<ApiResponse<{ id: number; class_name: string }[]>>('/class/options')
    .then((response: AxiosResponse<ApiResponse<{ id: number; class_name: string }[]>>) => {
      console.log('班级选项API响应成功 (AxiosResponse):', response);
      const apiResponse = response.data; // 提取 data

      // 检查 apiResponse.data 是否为数组
      if (apiResponse && apiResponse.code === 200 && Array.isArray(apiResponse.data)) {
        // 数据格式符合预期，直接返回 ApiResponse
        // 注意：这里返回的是原始数据结构，调用方需要自行映射为 { value, label }
        return apiResponse;
      } else {
        console.error('班级选项API响应数据格式不符合预期 (Data):', apiResponse);
        return Promise.reject(apiResponse || new Error('API响应数据格式不正确或数据字段非数组'));
      }
    })
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
  return request.get<ApiResponse<string[]>>('/exam/types')
    .then((response: AxiosResponse<ApiResponse<string[]>>) => {
      console.log('考试类型选项API响应成功 (AxiosResponse):', response);
      const apiResponse = response.data;
      // 检查 code 和 data 是否为数组
      if (apiResponse && apiResponse.code === 200 && Array.isArray(apiResponse.data)) {
        return apiResponse;
      } else {
        console.error('考试类型选项API响应数据格式不符合预期 (Data):', apiResponse);
        return Promise.reject(apiResponse || new Error('API响应数据格式不正确或数据字段非数组'));
      }
    })
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
 * 获取科目选项
 */
export function getSubjectOptions(): Promise<ApiResponse<string[]>> {
  console.log('调用getSubjectOptions API');
  return request.get<ApiResponse<string[]>>('/exam/subjects')
    .then((response: AxiosResponse<ApiResponse<string[]>>) => {
      console.log('获取科目选项API响应成功 (AxiosResponse):', response);
      const apiResponse = response.data;
      if (apiResponse && typeof apiResponse.code === 'number' && Array.isArray(apiResponse.data)) {
        return apiResponse;
      } else {
        console.error('获取科目选项API响应数据格式不符合预期 (Data):', apiResponse);
        return Promise.reject(apiResponse || new Error('API响应数据格式不正确'));
      }
    })
    .catch(error => {
      console.error('获取科目选项API请求失败:', error);
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
 * 发布考试
 * @param id 考试ID
 * @returns Promise resolving to ApiResponse with null data
 */
export function publishExam(id: number): Promise<ApiResponse<null>> {
  console.log('调用publishExam API, ID:', id);
  return request.put<ApiResponse<null>>(`/exam/publish/${id}`)
    .then((response: AxiosResponse<ApiResponse<null>>) => {
      console.log('发布考试API响应成功 (AxiosResponse):', response);
      const apiResponse = response.data;
      if (apiResponse && typeof apiResponse.code === 'number') {
        return apiResponse;
      } else {
        console.error('发布考试API响应数据格式不符合预期 (Data):', apiResponse);
        return Promise.reject(apiResponse || new Error('API响应数据格式不正确'));
      }
    })
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
 * 取消发布考试
 * @param id 考试ID
 * @returns Promise resolving to ApiResponse with null data
 */
export function unpublishExam(id: number): Promise<ApiResponse<null>> {
  console.log('调用unpublishExam API, ID:', id);
  return request.put<ApiResponse<null>>(`/exam/unpublish/${id}`)
    .then((response: AxiosResponse<ApiResponse<null>>) => {
      console.log('取消发布考试API响应成功 (AxiosResponse):', response);
      const apiResponse = response.data;
      if (apiResponse && typeof apiResponse.code === 'number') {
        return apiResponse;
      } else {
        console.error('取消发布考试API响应数据格式不符合预期 (Data):', apiResponse);
        return Promise.reject(apiResponse || new Error('API响应数据格式不正确'));
      }
    })
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
 * @param status 状态值
 */
export function updateExamStatus(id: number, status: number): Promise<ApiResponse<void>> {
  console.log('调用updateExamStatus API, ID:', id, '状态:', status);
  return request.put<ApiResponse<void>>(`/exam/${id}/status`, { status })
    .then(response => response.data)
    .catch(error => {
      console.error('更新考试状态API响应失败:', error);
      throw error;
    });
}

// 创建考试记录（如果不存在）
export function createExamIfNotExists(data: Partial<ExamItem>): Promise<ApiResponse<ExamItemResponse>> {
  console.log('调用 createExamIfNotExists API, 数据:', data);
  return request.post<ApiResponse<ExamItemResponse>>('/exam/find-or-create', data)
    .then(response => response.data)
    .catch(error => {
      console.error('createExamIfNotExists API catch block:', error);
      throw error;
    });
}

// 获取考试列表（按类型筛选）
export function getExamListByType(examType: string): Promise<ApiResponse<ExamItemResponse[]>> {
  console.log('调用 getExamListByType API, 类型:', examType);
  return request.get<ApiResponse<ExamItemResponse[]>>('/exam/list-by-type', { params: { examType } })
    .then(response => response.data)
    .catch(error => {
      console.error('getExamListByType API catch block:', error);
      throw error;
    });
}

// 获取考试类型选项
export function getExamTypes(): Promise<ApiResponse<string[]>> {
  console.log('调用getExamTypes API');
  return request.get<ApiResponse<string[]>>('/exam/types')
    .then(response => response.data) 
    .catch(error => {
        console.error('getExamTypes API catch block:', error);
        throw error; 
    });
}

// 获取考试状态选项
export function getExamStatuses(): Promise<ApiResponse<string[]>> {
  console.log('调用getExamStatuses API');
  return request.get<ApiResponse<string[]>>('/exam/statuses') // Assuming endpoint exists
    .then(response => response.data) 
    .catch(error => {
        console.error('getExamStatuses API catch block:', error);
        throw error; 
    });
}

// 获取考试科目选项 (Assuming this returns Subject objects)
export function getExamSubjects(): Promise<ApiResponse<Subject[]>> { // <<< Ensure this export exists
  console.log('调用getExamSubjects API');
  return request.get<ApiResponse<Subject[]>>('/subject/list') // Assuming endpoint is /subject/list
    .then(response => response.data) 
    .catch(error => {
        console.error('getExamSubjects API catch block:', error);
        throw error; 
    });
}

// 检查考试是否可以删除
export function checkExamCanDelete(id: number): Promise<ApiResponse<{ canDelete: boolean; message?: string }>> {
  console.log('调用checkExamCanDelete API, ID:', id);
  return request.get<ApiResponse<{ canDelete: boolean; message?: string }>>(`/exam/${id}/check-delete`)
    .then(response => response.data) 
    .catch(error => {
        console.error('checkExamCanDelete API catch block:', error);
        throw error; 
    });
}