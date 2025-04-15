import request from '@/utils/request'
import type { StudentItemResponse, StudentSubmitData, ApiResponse } from '@/types/common'

// 获取学生列表
export function getStudentList(params?: any): Promise<ApiResponse<StudentItemResponse[]>> {
  return request.get<ApiResponse<StudentItemResponse[]>>('/student/list', { params })
    .then(response => response.data)
    .catch(error => {
        console.error('getStudentList API catch block:', error);
        throw error; 
    });
}

// 获取学生详情
export function getStudentDetail(id: number): Promise<ApiResponse<StudentItemResponse>> {
  return request.get<ApiResponse<StudentItemResponse>>(`/student/${id}`)
    .then(response => response.data)
    .catch(error => {
        console.error('getStudentDetail API catch block:', error);
        throw error; 
    });
}

// 添加学生
export function addStudent(data: StudentSubmitData): Promise<ApiResponse<StudentItemResponse>> {
  console.log('调用addStudent API, 数据:', data);
  return request.post<ApiResponse<StudentItemResponse>>('/student/add', data)
    .then(response => response.data) 
    .catch(error => {
        console.error('addStudent API catch block:', error);
        throw error; 
    });
}

// 更新学生
export function updateStudent(id: number, data: StudentSubmitData): Promise<ApiResponse<StudentItemResponse>> {
  console.log('调用updateStudent API, ID:', id, '数据:', data);
  return request.put<ApiResponse<StudentItemResponse>>(`/student/${id}`, data)
    .then(response => response.data)
    .catch(error => {
        console.error('updateStudent API catch block:', error);
        throw error;
    });
}

// 删除学生
export function deleteStudent(id: number): Promise<ApiResponse<void>> {
  console.log('调用deleteStudent API, ID:', id);
  return request.delete<ApiResponse<void>>(`/student/${id}`)
    .then(response => response.data) 
    .catch(error => {
        console.error('deleteStudent API catch block:', error);
        throw error;
    });
}

// 批量删除学生
export function batchDeleteStudent(ids: number[]): Promise<ApiResponse<void>> {
  return request.delete<ApiResponse<void>>('/student/batch', { data: { ids } })
    .then(response => response.data)
    .catch(error => {
        console.error('batchDeleteStudent API catch block:', error);
        throw error; 
    });
}

// 获取学生统计数据
export function getStudentStats(): Promise<ApiResponse<any>> {
  return request.get<ApiResponse<any>>('/student/stats')
    .then(response => response.data)
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

  return request({
    url: '/student/import', // API endpoint
    method: 'post',
    data: formData, // Send file as FormData
    headers: {
      'Content-Type': 'multipart/form-data' // Important for file uploads
    }
  }).catch(error => {
      console.error('[API student.ts] Student import request failed:', error);
      // Re-throw a structured error or handle it as needed
      // Check if it's an Axios error with a response
      if (error.response && error.response.data) {
        throw error.response.data; // Throw the backend's error response
      } else {
        throw new Error(error.message || '学生导入请求失败');
      }
    });
};

// 导出学生数据
export function exportStudents(params?: any): Promise<Blob> {
  return request.get<Blob>('/student/export', {
    params,
    responseType: 'blob'
  }).then(response => response.data)
   .catch(error => {
        console.error('exportStudents API catch block:', error);
        throw error; 
    });
}

// 获取最大学生ID
export function getMaxStudentId(): Promise<ApiResponse<string>> {
  return request.get<ApiResponse<string>>('/student/max-id')
    .then(response => response.data)
    .catch(error => {
        console.error('getMaxStudentId API catch block:', error);
        throw error; 
    });
}