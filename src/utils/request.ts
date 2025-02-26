import axios from 'axios'
import type { AxiosResponse, AxiosInstance } from 'axios'
import type { Response } from '@/types/response'

const request: AxiosInstance = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 5000
})

request.interceptors.response.use(
  <T>(response: AxiosResponse<Response<T>>): Response<T> => {
    return response.data
  },
  error => Promise.reject(error)
)

const http = {
  get<T>(url: string, config?: any): Promise<Response<T>> {
    return request.get(url, config)
  },
  post<T>(url: string, data?: any, config?: any): Promise<Response<T>> {
    return request.post(url, data, config)
  },
  put<T>(url: string, data?: any, config?: any): Promise<Response<T>> {
    return request.put(url, data, config)
  },
  delete<T>(url: string, config?: any): Promise<Response<T>> {
    return request.delete(url, config)
  }
}

export default http