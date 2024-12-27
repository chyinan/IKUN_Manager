// Axios请求配置与拦截器
import axios from 'axios'

// 创建axios实例并配置
const request = axios.create({
  baseURL: '/api',    // API基础路径
  timeout: 600000     // 请求超时时间
})

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    return response.data  // 成功直接返回数据
  },
  (error) => {
    return Promise.reject(error) // 失败返回错误
  }
)

export default request