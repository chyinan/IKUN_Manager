import axios from 'axios'
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { Response } from '@/types/common'

const request = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 5000
})

request.interceptors.response.use(
  (response: AxiosResponse<Response<any>>) => {
    return Promise.resolve(response.data as Response<any>)
  },
  error => Promise.reject(error)
)

// 导出类型安全的请求方法
const http = {
  get: async <T>(url: string, config?: any): Promise<Response<T>> => {
    const response = await request.get<Response<T>>(url, config)
    return response.data
  },
  
  post: async <T>(url: string, data?: any, config?: any): Promise<Response<T>> => {
    const response = await request.post<Response<T>>(url, data, config)
    return response.data
  },
  
  put: async <T>(url: string, data?: any, config?: any): Promise<Response<T>> => {
    const response = await request.put<Response<T>>(url, data, config)
    return response.data
  },
  
  delete: async <T>(url: string, config?: any): Promise<Response<T>> => {
    const response = await request.delete<Response<T>>(url, config)
    return response.data
  }
}

export default http