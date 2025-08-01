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
  return request.post<ApiResponse<LoginData>>('api/auth/login', data)
    .then(response => response.data)
    .catch(error => {
        console.error('[API user.ts] Login failed:', error);
        throw error;
    });
}

/**
 * 用户登出
 */
export const logout = (): Promise<ApiResponse<void>> => {
  return request.post<ApiResponse<void>>('api/user/logout')
    .then(response => response.data)
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
  return request.get<ApiResponse<UserInfo>>('api/user/info')
    .then(response => response.data)
    .catch(error => {
        console.error('[API user.ts] Fetch user info failed:', error);
        throw error;
    });
}

/**
 * 更新密码
 */
export function updatePassword(passwordData: PasswordUpdateData): Promise<ApiResponse<any>> {
  return request.post<ApiResponse<any>>('api/user/update-password', passwordData)
    .then(response => response.data)
    .catch(error => {
        console.error('updatePassword API catch block:', error);
        throw error; 
    });
}

/**
 * 更新用户信息 (例如邮箱)
 */
export const updateUserInfo = (data: Partial<UserInfo>): Promise<ApiResponse<any>> => {
  return request.put<ApiResponse<any>>('api/user/info', data)
    .then(response => response.data)
    .catch(error => {
        console.error('[API user.ts] Update user info failed:', error);
        throw error;
    });
}

/**
 * 更新用户信息 (例如邮箱、电话、显示名称)
 * 后端接口: PUT /api/user/profile
 */
export const updateUserProfile = (data: { email?: string; phone?: string; display_name?: string }): Promise<ApiResponse<UserInfo>> => {
  return request.put<ApiResponse<UserInfo>>('api/user/profile', data)
    .then(response => response.data)
    .catch(error => {
        console.error('[API user.ts] Update user profile details failed:', error);
        throw error;
    });
}

/**
 * 上传文件（例如头像）
 */
export const uploadFile = (file: File): Promise<ApiResponse<{ filePath: string }>> => {
  const formData = new FormData();
  formData.append('file', file); // Use 'file' to match generic backend handler
  return request.post<ApiResponse<{ filePath: string }>>('api/upload/file', formData) // Use a generic endpoint
    .then(response => response.data)
    .catch(error => {
        console.error('[API user.ts] Upload file failed:', error);
        throw error;
    });
}

// 上传头像 (示例)
export const uploadAvatar = (file: File): Promise<ApiResponse<{ filePath: string }>> => {
  const formData = new FormData();
  formData.append('file', file); // Use 'file' to match generic backend handler
  return request.post<ApiResponse<{ filePath: string }>>('api/upload/avatar', formData) // Use a specific endpoint for avatars
    .then(response => response.data)
    .catch(error => {
      console.error('[API user.ts] Upload avatar failed:', error);
      throw error;
    });
};