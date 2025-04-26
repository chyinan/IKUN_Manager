import request from '@/utils/request'
import type { DeptResponseData, ApiDeptResponse, DeptFormData, DeptBackendData } from '@/types/dept'
import type { ApiResponse } from '@/types/common'

/**
 * 获取部门列表
 * @param params 查询参数
 */
export const getDeptList = (params?: any): Promise<ApiResponse<DeptResponseData[]>> => {
  console.log('调用getDeptList API');
  return request.get<ApiResponse<DeptResponseData[]>>('/dept/list', { params })
    .catch(error => {
        console.error('[API dept.ts] Error fetching department list:', error);
        throw error;
    });
}

export const addDept = (data: DeptBackendData): Promise<ApiResponse<DeptResponseData>> => {
  console.log('调用addDept API, 数据:', data);
  return request.post<ApiResponse<DeptResponseData>>('/dept/add', data)
    .catch(error => {
        console.error('[API dept.ts] Error adding department:', error);
        throw error;
    });
}

export const updateDept = (id: number, data: Partial<DeptBackendData>) => {
  console.log('调用updateDept API, ID:', id, '数据:', data);
  return request.put<ApiResponse<DeptResponseData>>(`/dept/${id}`, data)
    .catch(error => {
        console.error(`[API dept.ts] Error updating department ID ${id}:`, error);
        throw error;
    });
}

export const deleteDept = (id: number) => {
  console.log('调用deleteDept API, ID:', id);
  return request.delete<ApiResponse<void>>(`/dept/${id}`)
    .catch(error => {
        console.error(`[API dept.ts] Error deleting department ID ${id}:`, error);
        throw error;
    });
}

// 新增：导入部门数据
export const importDepartments = (file: File): Promise<ApiResponse<any>> => {
  console.log('调用importDepartments API, 文件:', file.name);
  const formData = new FormData();
  formData.append('file', file);

  return request.post<ApiResponse<any>>('/dept/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  .catch(error => {
    console.error('importDepartments API catch block:', error);
    // 尝试从 Axios 错误中提取后端返回的 data (可能包含错误详情)
    if (error.response && error.response.data) {
      throw error.response.data; 
    }
    throw error; 
  });
}