import request from '@/utils/request'
import type { 
  LoginForm, 
  LoginData, 
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
export const login = (data: LoginForm): Promise<ApiResponse<LoginData>> => {
  console.log('调用login API, 数据:', data);
  return request.post<ApiResponse<LoginData>>('/user/login', data)
    .catch(error => {
        console.error('[API user.ts] Login failed:', error);
        throw error;
    });
}

/**
 * 用户登出
 */
export const logout = (): Promise<ApiResponse<void>> => {
  return request.post<ApiResponse<void>>('/user/logout')
    .catch(error => {
        console.error('[API user.ts] Logout request failed (may ignore):', error);
        // Corrected: Return a resolved promise satisfying ApiResponse<void>
        return Promise.resolve({ code: -1, message: 'Logout request failed locally', data: undefined }); 
    });
}

/**
 * 获取用户信息
 */
export const getUserInfo = (): Promise<ApiResponse<UserInfo>> => {
  return request.get<ApiResponse<UserInfo>>('/user/info')
    .catch(error => {
        console.error('[API user.ts] Fetch user info failed:', error);
        throw error;
    });
}

/**
 * 更新密码
 */
export function updatePassword(passwordData: PasswordUpdateData): Promise<ApiResponse<any>> {
  return request.post<ApiResponse<any>>('/user/update-password', passwordData)
    .catch(error => {
        console.error('updatePassword API catch block:', error);
        throw error; 
    });
}

/**
 * 更新用户信息 (例如邮箱)
 */
export const updateUserInfo = (data: Partial<UserInfo>): Promise<ApiResponse<any>> => {
  return request.put<ApiResponse<any>>('/user/info', data)
    .catch(error => {
        console.error('[API user.ts] Update user info failed:', error);
        throw error;
    });
}

/**
 * 上传用户头像
 */
export const uploadAvatar = (file: File): Promise<ApiResponse<{ avatarUrl: string }>> => {
  const formData = new FormData();
  formData.append('file', file);
  return request.post<ApiResponse<{ avatarUrl: string }>>('/user/avatar', formData, {
    // No need to set Content-Type header manually for FormData,
    // browser and Axios will handle it.
  })
    .catch(error => {
        console.error('[API user.ts] Upload avatar failed:', error);
        throw error;
    });
}

// 上传头像 (示例)