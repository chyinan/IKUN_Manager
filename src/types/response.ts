export interface Response<T = any> {
  code: number
  data?: T
  message: string
}

export interface PageResponse<T = any> extends Response<T> {
  total: number
  currentPage: number
  pageSize: number
}