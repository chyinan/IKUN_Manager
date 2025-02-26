import type { ApiResponse } from './common'

// 用户相关类型定义
export interface UserInfo {
  id: number
  username: string
  email: string
  createTime: string
}

// 登录表单数据
export interface LoginForm {
  username: string
  password: string
}

// 注册表单数据
export interface RegisterForm extends LoginForm {
  email: string
  confirmPassword: string
}

// 修改密码表单数据
export interface PasswordForm {
  username: string
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

// 登录返回的数据结构
export interface LoginResponseData {
  token: string
  username: string
  email?: string
}

// API响应类型
export type LoginResponse = ApiResponse<LoginResponseData>