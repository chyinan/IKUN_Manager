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
}

export const addDept = (data: DeptBackendData): Promise<ApiResponse<DeptResponseData>> => {
  console.log('调用addDept API, 数据:', data);
  return request.post<ApiResponse<DeptResponseData>>('/dept/add', data)
    .then(response => {
      // Axios treats 2xx statuses (including 201) as success, landing here.
      console.log('新增部门API响应 (Axios .then):', response);
      const apiResponse = response.data;

      if (apiResponse && typeof apiResponse.code === 'number') {
        // Check the business code returned from the backend
        if (apiResponse.code === 200 || apiResponse.code === 201) {
          // Business operation succeeded
          return apiResponse;
        } else {
          // Business operation failed (e.g., validation error on backend)
          console.error('新增部门业务失败 (API Code):', apiResponse);
          // Throw an error to be caught by the .catch block
          throw new Error(apiResponse.message || '后端业务处理失败');
        }
      } else {
        // Unexpected response format from backend
        console.error('新增部门API响应数据格式不符合预期 (Data):', apiResponse);
        throw new Error('API响应数据格式不正确');
      }
    })
    .catch(error => {
      // This catch block handles actual request errors (network, 4xx, 5xx)
      // or errors explicitly thrown from the .then block above.
      console.error('新增部门API请求或处理失败 (Catch):', error);

      // Attempt to extract backend error message from Axios error response
      if (error && error.response && error.response.data && error.response.data.message) {
        throw new Error(`API请求失败: ${error.response.data.message}`);
      }

      // If the error was thrown from .then or is another type of Error
      if (error instanceof Error) {
        throw error; // Re-throw the existing error (could be business error or format error)
      }

      // Fallback for truly unknown errors
      throw new Error('新增部门时发生未知错误');
    });
}

export const updateDept = (id: number, data: Partial<DeptBackendData>) => {
  console.log('调用updateDept API, ID:', id, '数据:', data);
  return request.put<ApiResponse<DeptResponseData>>(`/dept/${id}`, data)
}

export const deleteDept = (id: number) => {
  console.log('调用deleteDept API, ID:', id);
  return request.delete<ApiResponse<void>>(`/dept/${id}`)
}