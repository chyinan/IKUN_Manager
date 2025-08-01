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

// 分页结果类型
export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
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

// 新增：用于 UserInfo 中关联的学生信息子类型
export interface StudentRelatedInfo {
  student_pk: number;
  student_id_str: string; // 学号字符串
  name: string;         // 学生真实姓名
  email?: string | null; // 学生表中的Email
  phone?: string | null; // 学生表中的Phone
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
  status: number
  description?: string | null
  create_time: string
  subjects: string
  subject_ids: string
  class_names: string
  class_ids: string
}

// 考试类型 - 前端使用格式 (Adapter Pattern)
export interface Exam extends BaseFields {
  examName: string
  examType: string
  examDate: string
  startTime: string
  endTime?: string
  duration?: number | null
  status: number
  description?: string | null
  createTime: string
  subjects: string[]
  subjectIds: number[]
  classNames: string[]
  classIds: number[]
}

// 考试表单数据接口
export interface ExamFormData {
  id?: number | null
  exam_name: string
  exam_type: string
  exam_date: Date | null
  start_time: Date | null
  duration: number | null
  status: number
  description: string
  subjectIds: number[]
  classIds: number[]
}

// 考试类型 - 后端响应格式 (for lists)
// (ExamItemResponse can be reused if the structure is the same)

// 考试信息 (详细)
export interface ExamInfo extends Omit<Exam, 'subjects'> {
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
  id: number;
  username: string;
  email?: string;
  avatar?: string | null;
  role: string; // Or a more specific role type e.g. 'admin' | 'student' | 'employee'
  roles?: string[];
  permissions?: string[];
  createTime?: string; // Assuming create_time from backend is string
  displayName?: string; // Add display_name
  studentInfo?: StudentRelatedInfo | null; // Add studentInfo using the new type
  phone?: string | null; // Add phone property
}

// User Info Data (Frontend)
export interface UserInfo {
  id: number;
  username: string;
  email?: string;
  avatar?: string | null;
  role: string;
  roles?: string[]; // Frontend specific, derived from role
  permissions?: string[];
  createTime: string;
  updateTime: string;
  displayName?: string; // 修正为驼峰命名，匹配后端JSON
  phone?: string | null; // 新增手机号字段
  studentInfo?: StudentRelatedInfo | null; // 学生信息对象
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

// --- Electron API Declaration ---
// This section tells TypeScript about the API exposed via contextBridge in preload.js

// Define the structure of the API
export interface IElectronAPI {
  performAction: (arg: any) => Promise<{ success: boolean; message: string }>;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  onWindowStateChange: (callback: (isMaximized: boolean) => void) => void;
  // Add other functions exposed in preload.js here if needed
}

// Extend the global Window interface to include electronAPI
declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}