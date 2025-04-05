import request from '@/utils/request'
import type { ApiResponse } from '@/types/common'

// 登录接口参数类型
export interface LoginParams {
  username: string
  password: string
}

// 登录结果类型
export interface LoginResult {
  token: string
  username: string
}

// 用户信息类型
export interface UserInfo {
  id: number
  username: string
  email: string
  avatar?: string
  roles: string[]
  permissions: string[]
}

// 密码表单类型
export interface PasswordForm {
  username: string
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

// 登录
export function login(data: LoginParams): Promise<ApiResponse<LoginResult>> {
  return request.post<ApiResponse<LoginResult>>('/user/login', data)
}

// 登出
export function logout(): Promise<ApiResponse<void>> {
  return request.post<ApiResponse<void>>('/user/logout')
}

// 获取用户信息
export function getUserInfo(): Promise<ApiResponse<UserInfo>> {
  return request.get<ApiResponse<UserInfo>>('/user/info')
}

// 更新密码
export function updatePassword(data: any): Promise<ApiResponse<any>> {
  console.log('调用 updatePassword API, 数据:', data); // Avoid logging passwords in production
  // 移除 username，后端从 token 获取用户信息
  const { username, ...passwordData } = data;
  return request.post<ApiResponse<any>>('/user/update-password', passwordData)
}

// 更新用户信息
export function updateUserInfo(data: Partial<UserInfo>): Promise<ApiResponse<void>> {
  return request.put<ApiResponse<void>>('/user/update', data)
}