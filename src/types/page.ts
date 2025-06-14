export interface PageInfo<T> {
    pageNum: number;
    pageSize: number;
    total: number;
    pages: number;
    size: number;
    list: T[];
  }