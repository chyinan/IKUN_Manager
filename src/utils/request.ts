import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import type { ApiResponse } from '@/types/common'

const request: AxiosInstance = axios.create({
  // 使用环境变量，如果未设置则默认使用本地开发地址
  baseURL: import.meta.env.VITE_APP_BASE_URL || 'http://localhost:3000/api',
  timeout: 5000
})

request.interceptors.response.use(
  <T>(response: AxiosResponse<ApiResponse<T>>): AxiosResponse<ApiResponse<T>> => {
    response.data = response.data;
    return response;
  },
  error => Promise.reject(error)
)

// 请求方法
export const http = {
  async get<T>(url: string, config?: any): Promise<ApiResponse<T>> {
    const response = await request.get<ApiResponse<T>>(url, config)
    return response.data
  },

  async post<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    const response = await request.post<ApiResponse<T>>(url, data, config)
    return response.data
  },

  async put<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    const response = await request.put<ApiResponse<T>>(url, data, config)
    return response.data
  },

  async delete<T>(url: string, config?: any): Promise<ApiResponse<T>> {
    const response = await request.delete<ApiResponse<T>>(url, config)
    return response.data
  }
}

export default http