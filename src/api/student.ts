import request from '@/utils/request'
import type { StudentItemResponse, StudentSubmitData, ApiResponse } from '@/types/common'
import type { AxiosResponse } from 'axios'

// 获取学生列表
export function getStudentList(params?: any): Promise<AxiosResponse<ApiResponse<StudentItemResponse[]>>> {
  return request.get<ApiResponse<StudentItemResponse[]>>('/student/list', { params })
}

// 获取学生详情
export function getStudentDetail(id: number): Promise<ApiResponse<StudentItemResponse>> {
  return request.get<ApiResponse<StudentItemResponse>>(`/student/${id}`)
}

// 添加学生
export function addStudent(data: StudentSubmitData): Promise<ApiResponse<StudentItemResponse>> {
  console.log('调用addStudent API, 数据:', data);
  // Rely on the interceptor to handle success/error based on response.data.code
  return request.post<ApiResponse<StudentItemResponse>>('/student/add', data)
    // We extract .data here because the interceptor returns the full AxiosResponse on success
    .then(response => response.data) 
    .catch(error => {
        // Interceptor should have already processed and possibly thrown an error
        // This catch is for network errors or errors thrown by the interceptor/then block
        console.error('addStudent API catch block:', error);
        // Re-throw the error potentially formatted by the interceptor or previous catch
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
  // DELETE requests might return minimal data or just status 200/204
  // Rely on the interceptor to validate the response code
  return request.delete<ApiResponse<void>>(`/student/${id}`)
    .then(response => response.data) // Interceptor returns full response, extract data
    .catch(error => {
        console.error('deleteStudent API catch block:', error);
        throw error;
    });
}

// 批量删除学生
export function batchDeleteStudent(ids: number[]): Promise<ApiResponse<void>> {
  return request.delete<ApiResponse<void>>('/student/batch', { data: { ids } })
}

// 获取学生统计数据
export function getStudentStats(): Promise<ApiResponse<any>> {
  return request.get<ApiResponse<any>>('/student/stats')
}

// 导入学生数据
export function importStudents(file: File): Promise<ApiResponse<any>> {
  const formData = new FormData()
  formData.append('file', file)
  
  return request.post<ApiResponse<any>>('/student/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 导出学生数据
export function exportStudents(params?: any): Promise<Blob> {
  return request.get<Blob>('/student/export', {
    params,
    responseType: 'blob'
  })
}

// 获取最大学生ID
export function getMaxStudentId(): Promise<ApiResponse<string>> {
  return request.get<ApiResponse<string>>('/student/max-id')
}