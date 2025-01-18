import request from '@/utils/request'

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

export const getEmployeeList = () => {
  return request.get<{code: number, data: EmployeeData[]}>('/employee/list')
}

export const addEmployee = (data: EmployeeData) => {
  return request.post('/employee/add', data)
}

// 更新员工
export const updateEmployee = (data: EmployeeData) => {
  return request.put(`/employee/update/${data.id}`, {
    empId: data.empId,
    name: data.name,
    gender: data.gender,
    age: data.age,
    position: data.position,
    department: data.department,
    salary: data.salary,
    status: data.status,
    phone: data.phone,
    email: data.email,
    joinDate: data.joinDate
  })
}

export const deleteEmployee = (id: number) => {
  return request.delete(`/employee/delete/${id}`)
}