import request from '@/utils/request'
import type { StudentItemResponse, StudentSubmitData, ApiResponse } from '@/types/common'

// 获取学生列表
export const getStudentList = (params?: any): Promise<ApiResponse<StudentItemResponse[]>> => {
  return request.get<ApiResponse<StudentItemResponse[]>>('/student/list', { params })
    .catch(error => {
        console.error('[API student.ts] Error fetching student list:', error);
        throw error;
    });
};

// 获取学生详情
export const getStudentDetail = (id: number): Promise<ApiResponse<StudentItemResponse>> => {
  return request.get<ApiResponse<StudentItemResponse>>(`/student/${id}`)
    .catch(error => {
        console.error(`[API student.ts] Error fetching student detail for ID ${id}:`, error);
        throw error;
    });
};

// 添加学生
export const addStudent = (data: StudentSubmitData): Promise<ApiResponse<StudentItemResponse>> => {
  console.log('调用addStudent API, 数据:', data);
  return request.post<ApiResponse<StudentItemResponse>>('/student/add', data)
    .catch(error => {
        console.error('[API student.ts] Error adding student:', error);
        throw error;
    });
};

// 更新学生
export const updateStudent = (id: number, data: StudentSubmitData): Promise<ApiResponse<StudentItemResponse>> => {
  console.log('调用updateStudent API, ID:', id, '数据:', data);
  return request.put<ApiResponse<StudentItemResponse>>(`/student/${id}`, data)
    .catch(error => {
        console.error(`[API student.ts] Error updating student ID ${id}:`, error);
        throw error;
    });
};

// 删除学生
export const deleteStudent = (id: number): Promise<ApiResponse<void>> => {
  console.log('调用deleteStudent API, ID:', id);
  return request.delete<ApiResponse<void>>(`/student/${id}`)
    .catch(error => {
        console.error(`[API student.ts] Error deleting student ID ${id}:`, error);
        throw error;
    });
};

// 批量删除学生
export const batchDeleteStudent = (ids: number[]): Promise<ApiResponse<void>> => {
  return request.delete<ApiResponse<void>>('/student/batch', { data: { ids } })
    .catch(error => {
        console.error('[API student.ts] Error batch deleting students:', error);
        throw error;
    });
};

// 获取学生统计数据
export function getStudentStats(): Promise<ApiResponse<any>> {
  return request.get<ApiResponse<any>>('/student/stats')
    .catch(error => {
        console.error('getStudentStats API catch block:', error);
        throw error; 
    });
}

// 导入学生数据
export const importStudents = (file: File): Promise<ApiResponse<any>> => {
  console.log('[API student.ts] Importing students from file:', file.name);
  const formData = new FormData();
  formData.append('file', file);

  return request<ApiResponse<any>>({
    url: '/student/import', // API endpoint
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`[API student.ts] Upload Progress: ${percentCompleted}%`);
      }
    }
  }).catch(error => {
      console.error('[API student.ts] Student import request failed:', error);
      throw error;
    });
};

// 导出学生数据
export const exportStudents = (params?: any): Promise<Blob> => {
  console.log('[API student.ts] Exporting students with params:', params);
  return request.get<Blob>('/student/export', {
    params,
    responseType: 'blob' // Important: Tell Axios to expect a Blob
  }).catch(error => {
      console.error('[API student.ts] Export students request failed:', error);
      throw error;
    });
};

// 获取最大学生ID
export const getMaxStudentId = (): Promise<ApiResponse<string>> => {
  return request.get<ApiResponse<string>>('/student/max-id')
    .catch(error => {
        console.error('[API student.ts] Error fetching max student ID:', error);
        throw error;
    });
};