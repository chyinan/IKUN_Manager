export interface ClassItem {
  id: number
  className: string  // 后端返回为 class_name
  studentCount: number  // 后端返回为 student_count
  teacher: string
  createTime: string   // 后端返回为 create_time
  description?: string
}

export interface ClassFormData {
  id?: number
  className: string
  teacher: string
  studentCount?: number
}

export type ClassResponse = Response<ClassItem[]>