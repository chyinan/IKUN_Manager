import request from '@/utils/request'
import type { ApiResponse } from '@/types/common'
import type { 
  EmployeeFormData,
  EmployeeItem,
  EmployeeItemResponse
} from '@/types/employee'
import type { DeptResponseData } from '@/types/dept' // 添加部门类型导入

export interface EmployeeData {
  id?: number
  empId: string
  name: string
  gender: string
  age: number
  position: string
  department: string
  salary: number
  status: string
  phone?: string
  email?: string
  joinDate: string
}

export interface EmployeeResponse {
  code: number
  data: {
    id: number
    emp_id: string
    name: string
    gender: string
    age: number
    position: string
    dept_id: number
    salary: string
    status: string
    phone: string
    email: string
    join_date: string
    department: string
  }[]
  message: string
}

// 获取员工列表
export function getEmployeeList(params?: any): Promise<ApiResponse<EmployeeItemResponse[]>> {
  console.log('调用getEmployeeList API, 参数:', params);
  return request.get<ApiResponse<EmployeeItemResponse[]>>('/employee/list', { params })
}

// 获取员工详情
export function getEmployeeDetail(id: number): Promise<ApiResponse<EmployeeItemResponse>> {
  console.log('调用getEmployeeDetail API, ID:', id);
  return request.get<ApiResponse<EmployeeItemResponse>>(`/employee/${id}`)
}

// 添加员工
export function addEmployee(data: EmployeeFormData): Promise<ApiResponse<EmployeeItemResponse>> {
  console.log('调用addEmployee API, 数据:', data);
  return request.post<ApiResponse<EmployeeItemResponse>>('/employee/add', data)
}

// 更新员工
export function updateEmployee(data: EmployeeFormData): Promise<ApiResponse<EmployeeItemResponse>> {
  console.log('调用updateEmployee API, 数据:', data);
  return request.put<ApiResponse<EmployeeItemResponse>>(`/employee/${data.id}`, data)
}

// 删除员工
export function deleteEmployee(id: number): Promise<ApiResponse<void>> {
  console.log('调用deleteEmployee API, ID:', id);
  return request.delete<ApiResponse<void>>(`/employee/${id}`)
}

// 批量删除员工
export function batchDeleteEmployee(ids: number[]): Promise<ApiResponse<void>> {
  console.log('调用batchDeleteEmployee API, IDs:', ids);
  return request.delete<ApiResponse<void>>('/employee/batch', { data: { ids } })
}

// 获取员工统计数据
export function getEmployeeStats(): Promise<ApiResponse<any>> {
  console.log('调用getEmployeeStats API');
  return request.get<ApiResponse<any>>('/employee/stats')
    .then(response => {
      console.log('员工统计数据API响应成功:', response);
      return response;
    })
    .catch(error => {
      console.error('员工统计数据API响应失败:', error);
      throw error;
    });
}

// 导入员工数据
export function importEmployees(file: File): Promise<ApiResponse<any>> {
  console.log('调用importEmployees API, 文件:', file.name);
  const formData = new FormData()
  formData.append('file', file)
  
  return request.post<ApiResponse<any>>('/employee/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 导出员工数据
export function exportEmployees(params?: any): Promise<Blob> {
  console.log('调用exportEmployees API, 参数:', params);
  return request.get<Blob>('/employee/export', {
    params,
    responseType: 'blob'
  })
}

// 获取部门列表
export const getDeptList = () => {
  console.log('调用getDeptList API');
  return request.get<ApiResponse<DeptResponseData[]>>('/dept/list')
}

// 添加部门检查
export const checkDepartment = (id: number) => {
  console.log('调用checkDepartment API, ID:', id);
  return request.get<ApiResponse<boolean>>(`/employee/checkDept/${id}`)
}