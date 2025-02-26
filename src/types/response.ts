export interface Response<T = any> {
  code: number
  message: string
  data?: T
}

export interface Pagination {
  currentPage: number
  pageSize: number
  total: number
}