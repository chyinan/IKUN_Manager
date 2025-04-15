// 基础通用类型定义
export interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
  total?: number // For pagination total count
}

// 基础字段类型
export interface BaseFields {
  id: number
  create_time?: string // snake_case from backend
  update_time?: string // snake_case from backend
}

export type ResponseData<T> = T extends Array<any> ? T : T[]

// API 响应数据类型
export interface ApiData<T> {
  code: number
  data: T
  message: string
}

// 后端返回的类型
export interface BackendResponse<T> {
  data: T[]
  total?: number
}

// 分页相关类型
export interface Pagination {
  currentPage: number
  pageSize: number
  total: number
}

// 学生类型 - 从后端接收的格式
export interface StudentItemResponse extends BaseFields {
  student_id: string // snake_case
  name: string
  gender: string
  class_id?: number
  class_name?: string // snake_case
  phone?: string
  email?: string
  join_date?: string // snake_case
}

// 学生类型 - 前端使用的格式
export interface StudentItem extends BaseFields {
  studentId: string // camelCase
  name: string
  gender: string
  classId?: number
  className?: string // camelCase
  phone?: string
  email?: string
  joinDate?: string // camelCase
  createTime: string // camelCase (mapped from create_time)
}

// 学生类型 - 前端提交的格式
export interface StudentSubmitData {
  id?: number
  studentId?: string
  name: string
  gender: string
  classId?: number
  className?: string
  phone?: string
  email?: string
  joinDate?: string
}

// 科目相关类型
export type SubjectType = '语文' | '数学' | '英语' | '物理' | '化学' | '生物'

// 科目成绩接口
export interface SubjectScore {
  sum: number
  count: number
}

// 成绩数据类型
export interface ScoreData {
  语文?: SubjectScore // Make individual subjects optional
  数学?: SubjectScore
  英语?: SubjectScore
  物理?: SubjectScore
  化学?: SubjectScore
  生物?: SubjectScore
  exam_type?: string
  exam_time?: string
  // Allow other keys for flexibility if needed
  [key: string]: SubjectScore | string | undefined;
}

// 日志数据类型
export interface LogItem {
  id: number
  type: 'database' | 'vue' | 'system'
  operation: string
  content: string
  operator: string
  createTime: string
}

// API 响应类型
export type ClassResponse = ApiResponse<ClassItem[]>
export type StudentResponse = ApiResponse<StudentItem[]>
export type DeptResponse = ApiResponse<DeptItem[]>
export type EmployeeResponse = ApiResponse<EmployeeItem[]>
export type ScoreResponse = ApiResponse<ScoreData>
export type LogResponse = ApiResponse<LogItem[]>

// 分页响应类型
export interface PaginatedResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

// 班级类型 - 后端响应格式
export interface ClassItemResponse extends BaseFields {
  class_name: string
  teacher: string
  student_count: number
  description?: string | null
  create_time: string
}

// 班级类型 - 前端使用格式
export interface ClassItem extends BaseFields {
  className: string
  teacher: string
  studentCount: number
  description?: string | null
  createTime: string
}

// 班级类型 - 后端提交格式
export interface ClassBackendData {
  class_name: string
  teacher: string
  description?: string | null
}

// 部门类型 - 后端响应格式
export interface DeptItemResponse extends BaseFields {
  dept_name: string
  manager: string
  member_count: number
  description?: string | null
  create_time: string
}

// 部门类型 - 前端使用格式
export interface DeptItem extends BaseFields {
  deptName: string
  manager: string
  memberCount: number
  description?: string | null
  createTime: string
}

// 部门类型 - 后端提交格式
export interface DeptBackendData {
  dept_name: string
  manager: string
  description?: string | null
}

// 员工类型 - 后端响应格式
export interface EmployeeItemResponse extends BaseFields {
  emp_id: string
  name: string
  gender: string
  age: number
  position: string
  dept_name: string
  salary: number
  status: string
  phone?: string
  email?: string
  join_date: string
  create_time: string
}

// 员工类型 - 前端使用格式
export interface EmployeeItem extends BaseFields {
  empId: string
  name: string
  gender: string
  age: number
  position: string
  deptId?: number
  deptName: string
  salary: number
  status: string
  phone?: string
  email?: string
  joinDate: string
  createTime: string
}

// 员工类型 - 后端提交格式
export interface EmployeeBackendData {
  emp_id: string
  name: string
  gender: string
  age: number
  position: string
  dept_id: number
  salary: number
  status: string
  phone?: string
  email?: string
  join_date: string
}

// 考试查询参数接口
export interface ExamQueryParams {
  page?: number
  pageSize?: number
  keyword?: string
  examType?: string
  startDate?: string
  endDate?: string
  status?: number
}

// 考试类型 - 后端响应格式
export interface ExamItemResponse extends BaseFields {
  exam_name: string
  exam_type: string
  exam_date: string
  start_time: string
  end_time?: string
  duration?: number | null
  subjects?: string | string[] | null
  status: number
  description?: string | null
  create_time: string
}

// 考试类型 - 前端使用格式
export interface ExamItem extends BaseFields {
  examName: string
  examType: string
  startTime: string
  endTime: string
  status: number
  description?: string | null
  createTime: string
}

// 考试详情类型
export interface ExamInfo extends ExamItem {
  subjects: Subject[]
  totalScore: number
  averageScore: number
  passRate: number
  excellentRate: number
}

// 考试列表响应类型
export interface ExamListResponse {
  list: ExamItemResponse[]
  total: number
  page: number
  pageSize: number
}

// --- Subject --- 
export interface Subject extends BaseFields {
  subject_name: string // snake_case
  subject_code?: string // snake_case
}

// --- Log --- 
// Backend Response/Data format
export interface LogItemResponse extends BaseFields {
  type: 'database' | 'vue' | 'system'
  operation: string
  content: string
  operator: string
  create_time: string // snake_case from backend
}

// Frontend Item format
export interface LogItem extends BaseFields {
  type: 'database' | 'vue' | 'system'
  operation: string
  content: string
  operator: string
  createTime: string // camelCase (mapped from create_time)
}

// --- User --- 
// Login Form Data (Frontend)
export interface LoginForm {
  username: string;
  password?: string;
  code?: string; // Verification code
}

// Login API Result Data (Backend)
export interface LoginData {
  token: string;
  user: UserInfo;
}

// User Info Data (Frontend)
export interface UserInfo extends BaseFields {
  username: string
  email?: string
  avatar?: string | null
  roles?: string[]
  permissions?: string[]
  createTime: string
}

// Password Update Data (Frontend/Backend)
export interface PasswordUpdateData {
  oldPassword?: string; // Optional if backend gets current user from token
  newPassword?: string;
  confirmPassword?: string; // Usually only needed for frontend validation
}

// 提交到后端的类型（下划线命名）
export interface ClassBackendData {
  class_name: string
  teacher: string
  description?: string | null
}

export interface EmployeeBackendData {
  emp_id: string
  name: string
  gender: string
  age: number
  position: string
  dept_id: number
  salary: number
  status: string
  phone?: string
  email?: string
  join_date: string
}

export interface StudentBackendData {
  student_id: string
  name: string
  gender: string
  class_id: number
  phone?: string
  email?: string
  join_date: string
}

// ---- Added ExamStats Interface ----
export interface ExamStats {
  total?: number;
  completedCount?: number; 
  inProgressCount?: number;
  upcomingCount?: number;
  typeDistribution?: Array<{ type: string; count: number }>;
}