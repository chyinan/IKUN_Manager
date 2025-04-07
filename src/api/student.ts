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
export function importStudents(file: File): Promise<ApiResponse<any>> {
  const formData = new FormData()
  formData.append('file', file)
  
  return request.post<ApiResponse<any>>('/student/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
    .then(response => response.data)
    .catch(error => {
        console.error('importStudents API catch block:', error);
        throw error; 
    });
}

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