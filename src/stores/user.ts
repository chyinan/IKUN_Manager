import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, logout, getUserInfo, updateUserProfile as apiUpdateUserProfile } from '@/api/user'
import { ElMessage } from 'element-plus'
import type { LoginData, UserInfo, ApiResponse } from '@/types/common'

const USER_INFO_KEY = 'user_info';
// The base URL for accessing uploaded files from the backend.
const BASE_UPLOAD_URL = 'http://localhost:8081'; 

export const useUserStore = defineStore('user', () => {
  // State
  const token = ref<string>(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfo | null>(null)
  const username = ref<string>('')
  const avatar = ref<string>(localStorage.getItem('user_avatar_url') || '')
  const roles = ref<string[]>([])
  const permissions = ref<string[]>([])

  // Getters
  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => roles.value.includes('admin'))
  const isStudent = computed(() => roles.value.includes('student'))

  // Helper function to get full avatar URL
  const getFullAvatarUrl = (relativePath: string | null | undefined): string => {
    if (!relativePath) {
      return '';
    }
    // If it's already a full URL, return as is
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
      return relativePath;
    }
    // Handle paths that might incorrectly include '/uploads/' already
    const pathSegment = relativePath.startsWith('/uploads/') ? relativePath : `/uploads/${relativePath}`;
    return BASE_UPLOAD_URL + pathSegment;
  };

  // Helper function to update both Pinia state and storage
  const _updateState = (responseToken: string, responseUserInfo: UserInfo) => {
    // Update Pinia state
    token.value = responseToken;
    userInfo.value = responseUserInfo;
    username.value = responseUserInfo.username;
    avatar.value = getFullAvatarUrl(responseUserInfo.avatar); // Apply helper here
    roles.value = responseUserInfo.role ? [responseUserInfo.role] : [];
    
    // Persist to storage
    localStorage.setItem('token', responseToken);
    sessionStorage.setItem(USER_INFO_KEY, JSON.stringify(responseUserInfo));
    if (responseUserInfo.avatar) {
      localStorage.setItem('user_avatar_url', getFullAvatarUrl(responseUserInfo.avatar)); // Apply helper here
    }
    console.log('[User Store] State and storage updated.', responseUserInfo);
  };

  // Add rehydrateStateFromSession function
  const rehydrateStateFromSession = () => {
    const storedUserInfo = sessionStorage.getItem(USER_INFO_KEY);
    if (storedUserInfo) {
      try {
        const parsedInfo = JSON.parse(storedUserInfo) as UserInfo;
        if (parsedInfo && typeof parsedInfo === 'object' && parsedInfo.id && parsedInfo.username) {
          userInfo.value = parsedInfo;
          username.value = parsedInfo.username;
          avatar.value = getFullAvatarUrl(parsedInfo.avatar); // Apply helper here
          roles.value = parsedInfo.role ? [parsedInfo.role] : [];
          console.log('[User Store] Rehydrated user info from sessionStorage (rehydrateStateFromSession).');
          return true;
        }
      } catch(e) {
        console.error('[User Store] Failed to parse user info from sessionStorage in rehydrateStateFromSession', e);
      }
    }
    return false;
  };

  // Action to set avatar
  const setAvatar = (newAvatarUrl: string) => {
    avatar.value = getFullAvatarUrl(newAvatarUrl); // Apply helper here
    // Also save to localStorage to keep it synchronized
    localStorage.setItem('user_avatar_url', getFullAvatarUrl(newAvatarUrl)); // Apply helper here
    console.log('[userStore] Avatar state updated:', getFullAvatarUrl(newAvatarUrl));
  };

  // Login Action
  const loginAction = async (credentials: { username: string; password: string }): Promise<string | null> => {
    try {
      const res: any = await login(credentials); 
      console.log('[userStore loginAction] Received API response:', JSON.stringify(res));

      if (res && res.accessToken && res.tokenType) {
        const receivedToken = res.accessToken;
        
        console.log('[userStore loginAction] Login successful, token received:', receivedToken);

        localStorage.setItem('token', receivedToken);
        token.value = receivedToken;

        const userInfoFetched = await getUserInfoAction();
        if (userInfoFetched) {
          console.log('[userStore loginAction] User info fetched successfully.');
          // Determine path *after* user info is confirmed
          if (isStudent.value) {
            return '/student-portal/dashboard';
          }
          return '/dashboard';
        } else {
          console.error('[userStore loginAction] Failed to fetch user info after login.');
          return null;
        }
      } else {
        const errorMsg = res?.message || '登录失败: 响应数据格式无效或缺少token';
        console.error('[userStore loginAction] Login condition failed. Error message:', errorMsg, 'Full Response Payload:', JSON.stringify(res));
        console.log('[userStore loginAction] Returning null due to failed condition.');
        return null;
      }
    } catch (error: any) {
      console.error('[userStore loginAction] Login API call failed (catch block in store):', error);
      console.log('[userStore loginAction] Returning null due to exception.');
      return null;
    }
  }

  // Get User Info Action
  const getUserInfoAction = async () => {
    if (!token.value) return false
    
    try {
      console.log('[userStore] Attempting to fetch user info via API...');
      const res = await getUserInfo(); 
      console.log('[userStore] API response for user info:', res);

      if (res.code === 200 && res.data) {
        const receivedApiUserInfo = res.data; 

        const fullUserInfo: UserInfo = {
          id: receivedApiUserInfo.id,
          username: receivedApiUserInfo.username,
          email: receivedApiUserInfo.email || undefined,
          avatar: receivedApiUserInfo.avatar,
          role: receivedApiUserInfo.role,
          roles: receivedApiUserInfo.role ? [receivedApiUserInfo.role] : [],
          permissions: receivedApiUserInfo.permissions || [],
          createTime: receivedApiUserInfo.createTime || new Date().toISOString(),
          updateTime: receivedApiUserInfo.updateTime || new Date().toISOString(),
          displayName: receivedApiUserInfo.displayName,
          studentInfo: receivedApiUserInfo.studentInfo || null,
          phone: receivedApiUserInfo.phone || null
        };

        if (token.value) {
          _updateState(token.value, fullUserInfo);
        }
        
        return true
      } else {
        console.warn('[userStore] getUserInfoAction failed or API returned non-200 code. Response:', res);
        return false
      }
    } catch (error) {
      console.error('获取用户信息失败 (catch block in getUserInfoAction):', error)
      return false
    }
  }

  // Logout Action
  const logoutAction = async () => {
    console.log('[userStore logoutAction] START :: Attempting to logout...');
    try {
      console.log(`[userStore logoutAction] Current token: ${token.value}, Is DEV env: ${import.meta.env.DEV}`);
      if (token.value && !import.meta.env.DEV) {
        console.log('[userStore logoutAction] TRY block :: Calling API logout...');
        await logout(); 
        console.log('[userStore logoutAction] TRY block :: API logout call finished.');
      } else {
        console.log('[userStore logoutAction] TRY block :: Skipped API logout call.');
      }
    } catch (error) {
      console.error('[userStore logoutAction] CATCH block :: Logout API call failed:', error);
    } finally {
      console.log('[userStore logoutAction] FINALLY block :: Entering, calling resetState().');
      resetState();
    }
    console.log('[userStore logoutAction] END :: Action finished.');
  }

  // Reset State
  const resetState = () => {
    console.log('[userStore resetState] Resetting user state...');
    token.value = ''
    userInfo.value = null
    username.value = ''
    avatar.value = ''
    roles.value = []
    permissions.value = []
    localStorage.removeItem('token')
    localStorage.removeItem('user_avatar_url')
    localStorage.removeItem('user-info'); 
    sessionStorage.removeItem(USER_INFO_KEY); 
    console.log('[userStore resetState] State has been reset.');
  };

  // This function is intended to be used on app initialization
  const clearAllAuthData = () => {
    console.log('[userStore] Clearing all authentication data from localStorage and sessionStorage.');
    localStorage.clear();
    sessionStorage.clear();
    resetState();
  };

  const setUserInfo = (receivedUser: UserInfo) => {
    userInfo.value = receivedUser;
    username.value = receivedUser.username;
    roles.value = receivedUser.role ? [receivedUser.role] : [];
    permissions.value = receivedUser.permissions || [];
    avatar.value = getFullAvatarUrl(receivedUser.avatar); // Use helper

    // Also update storage for consistency
    sessionStorage.setItem(USER_INFO_KEY, JSON.stringify(receivedUser));
    if(receivedUser.avatar) {
      localStorage.setItem('user_avatar_url', getFullAvatarUrl(receivedUser.avatar)); // Use helper
    }
    console.log('[userStore] setUserInfo called, state updated.');
  };

  const updateUserEmailAction = async (newEmail: string) => {
    if (!userInfo.value) {
      ElMessage.error('用户未登录，无法更新邮箱');
      return;
    }
    try {
      const response = await apiUpdateUserProfile({ id: userInfo.value.id, email: newEmail });
      if (response && response.data) {
        if (userInfo.value) {
          userInfo.value.email = newEmail;
          sessionStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo.value));
        }
        ElMessage.success('邮箱更新成功');
      }
    } catch (error) {
      console.error('更新邮箱失败:', error);
      ElMessage.error('更新邮箱失败');
    }
  };

  // Wrapper action to simplify fetching user info from components
  async function fetchAndSetUserInfo() {
    await getUserInfoAction();
  }
  const updateUserProfile = async (data: Partial<UserInfo>) => {
    if (!userInfo.value?.id) {
      ElMessage.error("无法更新个人资料：缺少用户信息。");
      return Promise.reject("缺少用户信息");
    }

    const updateData = {
      ...data,
      id: userInfo.value.id
    };

    try {
      const response = await apiUpdateUserProfile(updateData);
      if (response && response.code === 200) {
        // Update local state with the newly provided data
        userInfo.value = { ...userInfo.value, ...data };
        // If avatar was part of the update, handle it via setAvatar
        if (data.avatar) {
          setAvatar(data.avatar);
        }
        sessionStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo.value));
        ElMessage.success("个人资料更新成功！");
        return Promise.resolve(response.data);
      } else {
        ElMessage.error(response.message || "更新失败");
        return Promise.reject(response.message);
      }
    } catch (error) {
      console.error("更新个人资料失败:", error);
      ElMessage.error("更新个人资料失败，请稍后再试。");
      return Promise.reject(error);
    }
  };

  return {
    token,
    userInfo,
    username,
    avatar,
    roles,
    permissions,
    isLoggedIn,
    isAdmin,
    isStudent,
    loginAction,
    getUserInfoAction,
    logoutAction,
    resetState,
    setUserInfo,
    updateUserEmailAction,
    fetchAndSetUserInfo,
    updateUserProfile,
    rehydrateStateFromSession,
    setAvatar,
    getFullAvatarUrl,
    clearAllAuthData
  }
}) 