import request from '@/utils/request'
import type { DeptResponseData, ApiDeptResponse, DeptFormData, DeptBackendData } from '@/types/dept'
import type { ApiResponse } from '@/types/common'

/**
 * 获取部门列表
 * @param params 查询参数
 */
export const getDeptList = () => {
  console.log('调用getDeptList API');
  return request.get<ApiResponse<DeptResponseData[]>>('/dept/list')
    .then(response => response.data)
    .catch(error => {
        console.error('getDeptList API catch block:', error);
        throw error; 
    });
}

export const addDept = (data: DeptBackendData): Promise<ApiResponse<DeptResponseData>> => {
  console.log('调用addDept API, 数据:', data);
  return request.post<ApiResponse<DeptResponseData>>('/dept/add', data)
    .then(response => response.data)
    .catch(error => {
        console.error('addDept API catch block:', error);
        throw error; 
    });
}

export const updateDept = (id: number, data: Partial<DeptBackendData>) => {
  console.log('调用updateDept API, ID:', id, '数据:', data);
  return request.put<ApiResponse<DeptResponseData>>(`/dept/${id}`, data)
    .then(response => response.data)
    .catch(error => {
        console.error('updateDept API catch block:', error);
        throw error; 
    });
}

export const deleteDept = (id: number) => {
  console.log('调用deleteDept API, ID:', id);
  return request.delete<ApiResponse<void>>(`/dept/${id}`)
    .then(response => response.data)
    .catch(error => {
        console.error('deleteDept API catch block:', error);
        throw error; 
    });
}