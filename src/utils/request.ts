import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import type { Response } from '@/types/common'

const request = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
})

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    const username = localStorage.getItem('username')
    
    if (!config.headers) config.headers = {}
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    if (username) {
      config.headers['x-user-name'] = username
    }
    
    return config
  },
  error => Promise.reject(error)
)

request.interceptors.response.use(
  <T>(response: AxiosResponse<Response<T>>): Response<T> => {
    return response.data
  },
  error => {
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      return {
        code: 200,
        message: '操作可能已成功，正在刷新数据...'
      } as Response
    }
    ElMessage.error(error.message || '请求失败')
    return Promise.reject(error)
  }
)

const customRequest = {
  get: <T>(url: string, config?: any): Promise<Response<T>> => 
    request.get<any, Response<T>>(url, config),
  
  post: <T>(url: string, data?: any, config?: any): Promise<Response<T>> =>
    request.post<any, Response<T>>(url, data, config),
  
  put: <T>(url: string, data?: any, config?: any): Promise<Response<T>> =>
    request.put<any, Response<T>>(url, data, config),
  
  delete: <T>(url: string, config?: any): Promise<Response<T>> =>
    request.delete<any, Response<T>>(url, config)
}

export default customRequest