import request from '@/utils/request'
import type { ClassItem, ClassItemResponse, ApiResponse } from '@/types/common'

/**
 * 获取班级列表
 * @param params 查询参数
 */
export const getClassList = (params?: any): Promise<ApiResponse<ClassItemResponse[]>> => {
  console.log('调用getClassList API, 参数:', params);
  return request.get<ApiResponse<ClassItemResponse[]>>('api/class/list', { params })
    .catch(error => {
        console.error('[API class.ts] Error fetching class list:', error);
        throw error;
    });
}

// 获取班级详情
export const getClassDetail = (id: number): Promise<ApiResponse<ClassItemResponse>> => {
  console.log('调用getClassDetail API, ID:', id);
  return request.get<ApiResponse<ClassItemResponse>>(`api/class/${id}`)
    .catch(error => {
        console.error(`[API class.ts] Error fetching class detail for ID ${id}:`, error);
        throw error;
    });
}

// 添加班级
export const addClass = (data: ClassItem): Promise<ApiResponse<ClassItemResponse>> => {
  console.log('调用addClass API, 数据:', data);
  return request.post<ApiResponse<ClassItemResponse>>('api/class/add', data)
    .catch(error => {
        console.error('[API class.ts] Error adding class:', error);
        throw error;
    });
}

// 更新班级
export const updateClass = (id: number, data: ClassItem): Promise<ApiResponse<ClassItemResponse>> => {
  console.log('调用updateClass API, ID:', id, '数据:', data);
  return request.put<ApiResponse<ClassItemResponse>>(`api/class/update`, data) // Note: Backend update might be api/class/{id} or api/class/update
    .catch(error => {
        console.error(`[API class.ts] Error updating class ID ${id}:`, error);
        throw error;
    });
}

// 删除班级
export const deleteClass = (id: number): Promise<ApiResponse<void>> => {
  console.log('调用deleteClass API, ID:', id);
  return request.delete<ApiResponse<void>>(`api/class/delete/${id}`)
    .catch(error => {
        console.error(`[API class.ts] Error deleting class ID ${id}:`, error);
        throw error;
    });
}

// 批量删除班级
export function batchDeleteClass(ids: number[]) {
  console.log('调用batchDeleteClass API, IDs:', ids);
  return request.delete<ApiResponse<void>>('api/class/batch', { data: { ids } })
}

// 获取班级统计数据
export function getClassStats() {
  console.log('调用getClassStats API');
  return request.get<ApiResponse<any>>('api/class/stats')
}

// 导入班级数据
export function importClasses(file: File): Promise<ApiResponse<any>> {
  console.log('调用 importClasses API, 文件:', file.name);
  const formData = new FormData();
  formData.append('file', file);

  return request.post<ApiResponse<any>>('api/class/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
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
  return request.get<Blob>('api/class/export', {
    responseType: 'blob'
  })
}

// 获取班级选项列表 (通常用于下拉框)
export const getClassOptions = (): Promise<ApiResponse<ClassItem[]>> => {
    console.log('[API class.ts] Fetching class options...');
    return request.get<ApiResponse<ClassItem[]>>('api/class/options')
      .catch(error => {
        console.error('[API class.ts] Error fetching class options:', error);
        throw error;
    });
}