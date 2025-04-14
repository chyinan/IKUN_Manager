import request from '@/utils/request'
import type { ClassItem, ClassItemResponse, ApiResponse } from '@/types/common'

/**
 * 获取班级列表
 * @param params 查询参数
 */
export function getClassList(params?: any): Promise<ApiResponse<ClassItemResponse[]>> {
  console.log('调用getClassList API, 参数:', params);
  return request.get<ApiResponse<ClassItemResponse[]>>('/class/list', { params })
    .then(response => response.data)
    .catch(error => {
        console.error('getClassList API catch block:', error);
        throw error; 
    });
}

// 获取班级详情
export function getClassDetail(id: number): Promise<ApiResponse<ClassItemResponse>> {
  console.log('调用getClassDetail API, ID:', id);
  return request.get<ApiResponse<ClassItemResponse>>(`/class/${id}`)
    .then(response => response.data)
    .catch(error => {
        console.error('getClassDetail API catch block:', error);
        throw error; 
    });
}

// 添加班级
export function addClass(data: ClassItem): Promise<ApiResponse<ClassItemResponse>> {
  console.log('调用addClass API, 数据:', data);
  return request.post<ApiResponse<ClassItemResponse>>('/class/add', data)
    .then(response => response.data)
    .catch(error => {
        console.error('addClass API catch block:', error);
        throw error; 
    });
}

// 更新班级
export function updateClass(id: number, data: ClassItem): Promise<ApiResponse<ClassItemResponse>> {
  console.log('调用updateClass API, ID:', id, '数据:', data);
  return request.put<ApiResponse<ClassItemResponse>>(`/class/${id}`, data)
    .then(response => response.data)
    .catch(error => {
        console.error('updateClass API catch block:', error);
        throw error; 
    });
}

// 删除班级
export function deleteClass(id: number): Promise<ApiResponse<void>> {
  console.log('调用deleteClass API, ID:', id);
  return request.delete<ApiResponse<void>>(`/class/${id}`)
    .then(response => response.data)
    .catch(error => {
        console.error('deleteClass API catch block:', error);
        throw error; 
    });
}

// 批量删除班级
export function batchDeleteClass(ids: number[]) {
  console.log('调用batchDeleteClass API, IDs:', ids);
  return request.delete<ApiResponse<void>>('/class/batch', { data: { ids } })
}

// 获取班级统计数据
export function getClassStats() {
  console.log('调用getClassStats API');
  return request.get<ApiResponse<any>>('/class/stats')
}

// 导入班级数据
export function importClasses(file: File): Promise<ApiResponse<any>> {
  console.log('调用 importClasses API, 文件:', file.name);
  const formData = new FormData();
  formData.append('file', file);

  return request.post<ApiResponse<any>>('/class/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  .then(response => response.data) // 直接返回后端响应体中的 data 部分
  .catch(error => {
    console.error('importClasses API catch block:', error);
    // 尝试从 Axios 错误中提取后端返回的 data (可能包含错误详情)
    if (error.response && error.response.data) {
      throw error.response.data; 
    }
    throw error; 
  });
}

// 导出班级数据
export function exportClasses() {
  console.log('调用exportClasses API');
  return request.get<Blob>('/class/export', {
    responseType: 'blob'
  })
}

// 获取班级选项列表 (通常用于下拉框)
export function getClassOptions(): Promise<ApiResponse<ClassItem[]>> {
    return request.get<ApiResponse<ClassItem[]>>('/class/options')
      .then(response => response.data)
      .catch(error => {
        console.error('getClassOptions API catch block:', error);
        throw error; 
    });
}