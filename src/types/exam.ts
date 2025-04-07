// 考试信息接口
export interface ExamInfo {
  id?: number;
  exam_name: string;
  exam_type: string;
  exam_date: string;
  duration: number;
  subjects: string | string[];
  status: number;
  remark?: string;
  create_time?: string;
  update_time?: string;
}

// 考试查询参数
export interface ExamQueryParams {
  page: number;
  pageSize: number;
  keyword?: string;
  examType?: string;
  startDate?: string;
  endDate?: string;
  status?: number;
}

// 考试列表响应 (定义 data 字段的结构)
export interface ExamListResponse {
  list: ExamInfo[];
  total: number;
}

// API响应 (这个通用类型可能在 src/types/common.ts 中定义)
// 假设 ApiResponse<T> 结构为 { code: number; message: string; data: T | null; }
// export interface ApiResponse<T> { ... }

// (可选，但推荐) 为 getExamList 定义一个更具体的响应类型
// export interface ApiGetExamListResponse extends ApiResponse<ExamListResponse> {}