import request from '@/utils/request'
import type { 
  LoginForm, 
  LoginResult, 
  UserInfo, 
  ApiResponse, 
  PasswordUpdateData
} from '@/types/common'

// 登录接口参数类型
export interface LoginParams {
  username: string
  password: string
}

// 密码表单类型
export interface PasswordForm {
  username: string
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

/**
 * 用户登录
 * @param data 登录表单数据
 */
export function login(data: LoginForm): Promise<ApiResponse<LoginResult>> {
  console.log('调用login API, 数据:', data);
  return request.post<ApiResponse<LoginResult>>('/user/login', data)
    .then(response => response.data)
    .catch(error => {
        console.error('login API catch block:', error);
        throw error; 
    });
}

/**
 * 用户登出
 */
export function logout(): Promise<ApiResponse<void>> {
  return request.post<ApiResponse<void>>('/user/logout')
    .then(response => response.data)
    .catch(error => {
        console.error('logout API catch block:', error);
        throw error; 
    });
}

/**
 * 获取用户信息
 */
export function getUserInfo(): Promise<ApiResponse<UserInfo>> {
  return request.get<ApiResponse<UserInfo>>('/user/info')
    .then(response => response.data)
    .catch(error => {
        console.error('getUserInfo API catch block:', error);
        throw error; 
    });
}

/**
 * 更新密码
 */
export function updatePassword(passwordData: PasswordUpdateData): Promise<ApiResponse<any>> {
  return request.post<ApiResponse<any>>('/user/update-password', passwordData)
    .then(response => response.data)
    .catch(error => {
        console.error('updatePassword API catch block:', error);
        throw error; 
    });
}

/**
 * 更新用户信息 (例如邮箱)
 */
export function updateUserInfo(data: Partial<UserInfo>): Promise<ApiResponse<any>> {
  return request.put<ApiResponse<any>>('/user/info', data) // Use PUT method and /user/info endpoint
    .then(response => response.data)
    .catch(error => {
        console.error('updateUserInfo API catch block:', error);
        throw error; 
    });
}

/**
 * 上传用户头像
 */
export function uploadUserAvatar(formData: FormData): Promise<ApiResponse<{ avatarUrl: string }>> {
  console.log('调用 uploadUserAvatar API');
  return request.post<ApiResponse<{ avatarUrl: string }>>('/user/avatar', formData, {
    // No need to set Content-Type header manually for FormData,
    // Axios handles it correctly.
  })
    .then(response => response.data)
    .catch(error => {
        console.error('uploadUserAvatar API catch block:', error);
        throw error; 
    });
}

// 上传头像 (示例)