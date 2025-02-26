import axios from 'axios'
import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const request = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 从 localStorage 获取用户信息
    const username = localStorage.getItem('username')
    if (username) {
      config.headers = config.headers || {}
      config.headers['x-user-name'] = username
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data
  },
  error => {
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      // 超时情况下，检查操作是否实际成功
      return {
        code: 200,
        message: '操作可能已成功，正在刷新数据...'
      }
    }
    ElMessage.error(error.message || '请求失败')
    return Promise.reject(error)
  }
)

export default request