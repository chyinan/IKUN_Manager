import request from '@/utils/request'
import type {
  EmployeeFormData,
  EmployeeItem,
  EmployeeItemResponse
} from '@/types/employee'
import type { DeptResponseData } from '@/types/dept' // 添加部门类型导入
import type { ApiResponse } from '@/types/common' // 确保导入 ApiResponse

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
export const getEmployeeList = (params?: any): Promise<ApiResponse<EmployeeItemResponse[]>> => {
  console.log('调用getEmployeeList API, 参数:', params);
  return request.get<ApiResponse<EmployeeItemResponse[]>>('api/employee/list', { params }) // Added api/
    .catch(error => {
        console.error('[API employee.ts] Error fetching employee list:', error);
        throw error;
    });
}

// 获取员工详情
export const getEmployeeDetail = (id: number): Promise<ApiResponse<EmployeeItemResponse>> => {
  console.log('调用getEmployeeDetail API, ID:', id);
  return request.get<ApiResponse<EmployeeItemResponse>>(`api/employee/${id}`) // Added api/
    .catch(error => {
        console.error(`[API employee.ts] Error fetching employee detail for ID ${id}:`, error);
        throw error;
    });
}

// 添加员工
export const addEmployee = (data: EmployeeFormData): Promise<ApiResponse<EmployeeItemResponse>> => {
  console.log('调用addEmployee API, 数据:', data);
  return request.post<ApiResponse<EmployeeItemResponse>>('api/employee/add', data) // Added api/
    .catch(error => {
        console.error('[API employee.ts] Error adding employee:', error);
        throw error;
    });
}

// 更新员工
export const updateEmployee = (id: number, data: EmployeeFormData): Promise<ApiResponse<EmployeeItemResponse>> => {
  console.log('调用updateEmployee API, 数据:', data);
  return request.put<ApiResponse<EmployeeItemResponse>>(`api/employee/${id}`, data) // Added api/
    .catch(error => {
        console.error(`[API employee.ts] Error updating employee ID ${id}:`, error);
        throw error;
    });
}

// 删除员工
export const deleteEmployee = (id: number): Promise<ApiResponse<void>> => {
  console.log('调用deleteEmployee API, ID:', id);
  return request.delete<ApiResponse<void>>(`api/employee/${id}`) // Added api/
    .catch(error => {
        console.error(`[API employee.ts] Error deleting employee ID ${id}:`, error);
        throw error;
    });
}

// 批量删除员工
export const batchDeleteEmployee = (ids: number[]): Promise<ApiResponse<void>> => {
  console.log('调用batchDeleteEmployee API, IDs:', ids);
  return request.delete<ApiResponse<void>>('api/employee/batch', { data: { ids } }) // Added api/
    .catch(error => {
        console.error('[API employee.ts] Error batch deleting employees:', error);
        throw error;
    });
}

// 获取员工统计数据
export const getEmployeeStats = (): Promise<ApiResponse<any>> => {
  console.log('调用getEmployeeStats API');
  return request.get<ApiResponse<any>>('api/employee/stats') // Added api/
    .catch(error => {
        console.error('[API employee.ts] Error fetching employee stats:', error);
        throw error;
    });
}

// 导入员工数据
export function importEmployees(file: File): Promise<ApiResponse<any>> {
  console.log('调用importEmployees API, 文件:', file.name);
  const formData = new FormData()
  formData.append('file', file)
  
  return request.post<ApiResponse<any>>('api/employee/import', formData, { // Added api/
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
    .catch(error => {
        console.error('importEmployees API catch block:', error);
        if (error.response && error.response.data) {
          throw error.response.data; 
        }
        throw error; 
    });
}

// 导出员工数据
export const exportEmployees = (params?: any): Promise<Blob> => {
  console.log('调用exportEmployees API, 参数:', params);
  return request.get<Blob>('api/employee/export', { // Added api/
    params,
    responseType: 'blob'
  }).then(response => response.data)
  .catch(error => {
    console.error('[API employee.ts] Export employees failed:', error);
    throw error;
  });
}

// 获取部门列表
export const getDeptList = () => {
  console.log('调用getDeptList API');
  return request.get<ApiResponse<DeptResponseData[]>>('api/dept/list') // Assuming dept list is also under /api/dept. Added api/
}

// 添加部门检查
export const checkDepartment = (id: number) => {
  console.log('调用checkDepartment API, ID:', id);
  return request.get<ApiResponse<boolean>>(`api/employee/checkDept/${id}`) // Added api/
}