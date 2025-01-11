// Axios请求配置与拦截器
import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例并配置
const request = axios.create({
  baseURL: 'http://127.0.0.1:8080/api',  // 修改为实际的后端地址
  timeout: 600000     // 请求超时时间
})

// 添加请求拦截器
request.interceptors.request.use(
  config => {
    // 从localStorage获取token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    // 简化登录验证逻辑用于测试
    if (response.config.url?.includes('login')) {
      const data = response.data
      // 模拟验证账号密码
      if (data.username === 'admin' && data.password === '123456') {
        return {
          code: 200,
          data: {
            token: 'admin-token',
            userInfo: {
              username: 'admin',
              role: 'admin'
            }
          },
          message: '登录成功'
        }
      }
      return {
        code: 401,
        message: '用户名或密码错误'
      }
    }
    return response.data  // 成功直接返回数据
  },
  (error) => {
    ElMessage.error(error.message || '请求失败')
    return Promise.reject(error) // 失败返回错误
  }
)

export default request