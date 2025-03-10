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
}

// 考试列表响应
export interface ExamListResponse {
  list: ExamInfo[];
  total: number;
}

// API响应
export interface ApiExamResponse {
  code: number;
  message: string;
  data: ExamInfo | ExamListResponse | null;
}