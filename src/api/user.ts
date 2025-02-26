import request from '@/utils/request'
import type { LoginForm, RegisterForm, PasswordForm, LoginResponse } from '@/types/user'

// 用户登录
export const login = (data: LoginForm) => {
  return request.post<LoginResponse>('/user/login', data)
}

// 用户注册
export const register = (data: RegisterForm) => {
  return request.post<LoginResponse>('/user/register', data)
}

// 修改密码
export const updatePassword = (data: PasswordForm) => {
  return request.post<LoginResponse>('/user/updatePassword', data)
}

// 检查token有效性
export const checkToken = () => {
  return request.get<{valid: boolean}>('/user/checkToken')
}