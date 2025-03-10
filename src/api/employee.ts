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
export const getEmployeeList = () => {
  return request.get<ApiResponse<EmployeeItemResponse[]>>('/employee/list')
}

// 添加员工
export const addEmployee = (data: EmployeeFormData) => {
  return request.post<EmployeeResponse>('/employee/add', {
    emp_id: data.empId,
    name: data.name,
    gender: data.gender,
    age: data.age,
    position: data.position,
    department: data.deptName,
    salary: data.salary,
    status: data.status,
    phone: data.phone,
    email: data.email,
    join_date: data.joinDate
  })
}

// 更新员工
export const updateEmployee = (id: number, data: Partial<EmployeeFormData>) => {
  return request.put<EmployeeResponse>(`/employee/${id}`, {
    emp_id: data.empId,
    name: data.name,
    gender: data.gender,
    age: data.age,
    position: data.position,
    department: data.deptName,
    salary: data.salary,
    status: data.status,
    phone: data.phone,
    email: data.email,
    join_date: data.joinDate
  })
}

// 删除员工
export const deleteEmployee = (id: number) => {
  return request.delete<void>(`/employee/${id}`)
}

// 获取部门列表
export const getDeptList = () => {
  return request.get<ApiResponse<DeptResponseData[]>>('/dept/list')
}

// 添加部门检查
export const checkDepartment = (id: number) => {
  return request.get<ApiResponse<boolean>>(`/employee/checkDept/${id}`)
}