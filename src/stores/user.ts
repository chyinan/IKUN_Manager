import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, logout, getUserInfo, updateUserProfile as apiUpdateUserProfile } from '@/api/user'
import { ElMessage } from 'element-plus'
import type { LoginData, UserInfo, ApiResponse } from '@/types/common'
import router from '@/router'

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
          console.log('[User Store] Rehydrated user info from sessionStorage.');
          return true;
        }
      } catch(e) {
        console.error('[User Store] Failed to parse user info from sessionStorage', e);
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

  // Login Action (修正)
  const loginAction = async (credentials: { username: string; password: string }) => {
    try {
      const res: any = await login(credentials); // Change type to any to handle direct token response
      console.log('[userStore loginAction] Received API response:', JSON.stringify(res)); // Log the full response

      // Instead of checking res.code, res.data.token, etc., check for accessToken directly
      if (res && res.accessToken && res.tokenType) {
        const receivedToken = res.accessToken; // Directly get accessToken
        
        console.log('[userStore loginAction] Login successful, token received:', receivedToken);

        // Store token in localStorage
        localStorage.setItem('token', receivedToken);
        token.value = receivedToken; // Update Pinia state immediately

        // After token is stored, fetch full user info
        const userInfoFetched = await getUserInfoAction();
        if (userInfoFetched) {
          console.log('[userStore loginAction] User info fetched successfully. Returning true.');
          return true;
        } else {
          console.error('[userStore loginAction] Failed to fetch user info after login.');
          // Even if token is received, if user info cannot be fetched, login is considered failed
          return false;
        }
      } else {
        const errorMsg = res?.message || '登录失败: 响应数据格式无效或缺少token';
        console.error('[userStore loginAction] Login condition failed. Error message:', errorMsg, 'Full Response Payload:', JSON.stringify(res));
        console.log('[userStore loginAction] Returning false due to failed condition.');
        return false;
      }
    } catch (error: any) {
      console.error('[userStore loginAction] Login API call failed (catch block in store):', error);
      console.log('[userStore loginAction] Returning false due to exception.');
      return false;
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
        const receivedApiUserInfo = res.data; // UserInfo from API

        const fullUserInfo: UserInfo = {
          id: receivedApiUserInfo.id,
          username: receivedApiUserInfo.username,
          email: receivedApiUserInfo.email || undefined,
          avatar: receivedApiUserInfo.avatar,
          role: receivedApiUserInfo.role,
          roles: receivedApiUserInfo.role ? [receivedApiUserInfo.role] : [],
          permissions: receivedApiUserInfo.permissions || [],
          createTime: receivedApiUserInfo.createTime || new Date().toISOString(),
          displayName: receivedApiUserInfo.displayName,
          studentInfo: receivedApiUserInfo.studentInfo || null,
          phone: receivedApiUserInfo.phone || null
        };

        if (token.value) {
          _updateState(token.value, fullUserInfo);
        }
        
        return true
      } else {
        // Added log for failure case
        console.warn('[userStore] getUserInfoAction failed or API returned non-200 code. Response:', res);
        return false
      }
    } catch (error) {
      console.error('获取用户信息失败 (catch block in getUserInfoAction):', error)
      return false
    }
  }

  // Logout Action (Keep existing logic)
  const logoutAction = async () => {
    console.log('[userStore logoutAction] START :: Attempting to logout...');
    try {
      console.log(`[userStore logoutAction] Current token: ${token.value}, Is DEV env: ${import.meta.env.DEV}`);
      if (token.value && !import.meta.env.DEV) {
        console.log('[userStore logoutAction] TRY block :: Calling API logout...');
        await logout(); // Calls API: import { logout } from '@/api/user'
        console.log('[userStore logoutAction] TRY block :: API logout call finished.');
      } else {
        console.log('[userStore logoutAction] TRY block :: Skipped API logout call.');
      }
      console.log('[userStore logoutAction] TRY block :: Successfully finished.');
    } catch (error) {
      console.error('[userStore logoutAction] CATCH block :: Logout API call failed:', error);
      // Still proceed with local state reset even if API fails
    } finally {
      console.log('[userStore logoutAction] FINALLY block :: Entering, calling resetState().');
      try {
        resetState();
        console.log('[userStore logoutAction] FINALLY block :: resetState() call completed.');
      } catch (resetError) {
        console.error('[userStore logoutAction] FINALLY block :: resetState() THREW an error:', resetError);
        // This error in finally would cause the logoutAction promise to reject if not handled.
        // However, resetState has its own internal catch for router.push.
      }
      console.log('[userStore logoutAction] FINALLY block :: Exiting.');
    }
    console.log('[userStore logoutAction] END :: Action finished.');
    // logoutAction implicitly returns Promise<void> which resolves if no unhandled error occurred.
  }

  // Reset State (Updated)
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
    localStorage.removeItem('user-info'); // Ensure this is here from previous steps
    sessionStorage.removeItem(USER_INFO_KEY); // Clear sessionStorage too

    console.log('[userStore resetState] State reset. Attempting to redirect to /login...');
    router.push('/login').catch(err => {
      console.error('[userStore resetState] Redirect to login failed:', err);
    });
    console.log('[userStore resetState] Redirection to login initiated (or failed if error above).');
  }

  // New: Clear All Auth Data (for testing/debugging purposes)
  const clearAllAuthData = () => {
    console.log('[userStore clearAllAuthData] Clearing all authentication related data...');
    localStorage.removeItem('token');
    localStorage.removeItem('user_avatar_url');
    localStorage.removeItem('user-info');
    sessionStorage.removeItem(USER_INFO_KEY); // Assuming USER_INFO_KEY resolves to 'user_info'
    token.value = '';
    userInfo.value = null;
    username.value = '';
    avatar.value = '';
    roles.value = [];
    permissions.value = [];
    console.log('[userStore clearAllAuthData] All authentication related data cleared.');
  };

  // Attempt to load user info if token exists on initial store creation
  // This helps maintain login state across page refreshes
  if (token.value) {
      console.log('Token found in localStorage, attempting to fetch user info...');
      getUserInfoAction().then(success => {
          if (!success) {
              console.warn('Failed to fetch user info with existing token. Clearing state.');
              resetState(); // Clear invalid token/state
          }
      });
  }

  // 设置用户信息 (ensure createTime and studentInfo)
  const setUserInfo = (receivedUser: UserInfo) => {
    console.log('更新用户信息:', receivedUser);
    userInfo.value = {
      id: receivedUser.id,
      username: receivedUser.username,
      email: receivedUser.email,
      avatar: receivedUser.avatar,
      role: receivedUser.role,
      roles: receivedUser.roles,
      permissions: receivedUser.permissions,
      createTime: receivedUser.createTime || new Date().toISOString(),
      updateTime: receivedUser.updateTime || new Date().toISOString(),
      displayName: receivedUser.displayName,
      phone: receivedUser.phone || null,
      studentInfo: receivedUser.studentInfo || null
    };
    sessionStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo.value));
    console.log('[User Store] User info updated in Pinia and sessionStorage:', userInfo.value);
  };

  // 从本地存储加载用户信息 (ensure createTime and studentInfo)
  const loadUserInfo = () => {
    const storedUserInfo = sessionStorage.getItem(USER_INFO_KEY);
    if (storedUserInfo) {
      try {
        const parsedInfo = JSON.parse(storedUserInfo) as UserInfo;
        if (parsedInfo && typeof parsedInfo === 'object' && parsedInfo.id && parsedInfo.username) {
          userInfo.value = parsedInfo;
          username.value = parsedInfo.username;
          avatar.value = getFullAvatarUrl(parsedInfo.avatar); // Apply helper here
          roles.value = parsedInfo.role ? [parsedInfo.role] : [];
          console.log('[User Store] Rehydrated user info from sessionStorage (loadUserInfo).');
          return true;
        }
      } catch(e) {
        console.error('[User Store] Failed to parse user info from sessionStorage (loadUserInfo)', e);
      }
    }
    return false;
  };

  // Initial load on store creation
  loadUserInfo();

  // Action to specifically update the user's email in the store
  const updateUserEmailAction = (newEmail: string) => {
    if (userInfo.value) {
      userInfo.value.email = newEmail;
      // Optionally update sessionStorage here as well if you want this change to persist immediately
      sessionStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo.value));
    }
  };

  // 获取并设置用户信息
  async function fetchAndSetUserInfo() {
    if (!token.value) {
      console.log('[fetchAndSetUserInfo] No token available, skipping fetch user info.');
      return;
    }
    console.log('[fetchAndSetUserInfo] Token available, attempting to fetch user info.');
    const success = await getUserInfoAction();
    if (!success) {
      console.warn('[fetchAndSetUserInfo] Failed to fetch user info, resetting state.');
      resetState(); // Clear invalid token/state
    }
  }

  // --- ADD isAdmin GETTER ---
  const isAdmin = computed(() => {
    console.log('[userStore] isAdmin computed. roles.value:', JSON.stringify(roles.value));
    const result = roles.value.includes('admin');
    console.log('[userStore] isAdmin result:', result);
    return result;
  });
  const isStudent = computed(() => {
    console.log('[userStore] isStudent computed. roles.value:', JSON.stringify(roles.value));
    const result = roles.value.includes('student');
    console.log('[userStore] isStudent result:', result);
    return result;
  });

  const updateUserProfile = async (data: Partial<UserInfo>) => {
    console.log('[User Store] Attempting to update user profile with data:', data);
    try {
      // If the avatar data contains the full path, extract just the filename
      if (data.avatar && data.avatar.includes('/')) {
        data.avatar = data.avatar.split('/').pop();
      }

      const response = await apiUpdateUserProfile(data);
      console.log('[API user.ts] API response for update user profile:', response);
      if (response.code === 200 && response.data) {
        console.log('[User Store] Update user profile details success, new user info:', response.data);
        const updatedUserInfo: UserInfo = response.data;
        if (token.value) {
          _updateState(token.value, updatedUserInfo);
        }
        ElMessage.success('用户资料更新成功');
        return true;
      } else {
        ElMessage.error(response.message || '更新用户资料失败');
        return false;
      }
    } catch (error: any) {
      console.error('[User Store] Update user profile API call failed:', error);
      ElMessage.error('更新用户资料失败');
      return false;
    }
  };

  // --- RETURN ---
  // Expose state, getters, and actions
  return {
    token,
    userInfo,
    username,
    avatar,
    roles,
    permissions,
    isLoggedIn: computed(() => !!token.value),
    isAdmin: computed(() => roles.value.includes('admin')),
    isStudent: computed(() => roles.value.includes('student')),
    isEmployee: computed(() => roles.value.includes('employee')),
    login: loginAction,
    logout: logoutAction,
    getUserInfo: getUserInfoAction,
    setUserInfo,
    setAvatar,
    rehydrateStateFromSession,
    updateUserEmailAction,
    updateUserProfile,
    clearAllAuthData,
    fetchAndSetUserInfo,
  }
}, {
  // Optional: Enable persistence if needed, though manual localStorage is used here
  // persist: true,
}) 