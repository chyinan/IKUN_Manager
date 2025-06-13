import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, logout, getUserInfo, updateUserProfile as apiUpdateUserProfile } from '@/api/user'
import { ElMessage } from 'element-plus'
import type { LoginData, UserInfo, ApiResponse } from '@/types/common'
import router from '@/router'

const USER_INFO_KEY = 'user_info';

export const useUserStore = defineStore('user', () => {
  // State
  const token = ref<string>(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfo | null>(null)
  const username = ref<string>('')
  const avatar = ref<string>(localStorage.getItem('user_avatar_url') || '')
  const roles = ref<string[]>([])
  const permissions = ref<string[]>([])

  // Helper function to update both Pinia state and storage
  const _updateState = (responseToken: string, responseUserInfo: UserInfo) => {
    // Update Pinia state
    token.value = responseToken;
    userInfo.value = responseUserInfo;
    username.value = responseUserInfo.username;
    avatar.value = responseUserInfo.avatar || '';
    roles.value = responseUserInfo.role ? [responseUserInfo.role] : [];
    
    // Persist to storage
    localStorage.setItem('token', responseToken);
    sessionStorage.setItem(USER_INFO_KEY, JSON.stringify(responseUserInfo));
    if (responseUserInfo.avatar) {
      localStorage.setItem('user_avatar_url', responseUserInfo.avatar);
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
          avatar.value = parsedInfo.avatar || '';
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
    avatar.value = newAvatarUrl;
    // Also save to localStorage to keep it synchronized
    localStorage.setItem('user_avatar_url', newAvatarUrl);
    console.log('[userStore] Avatar state updated:', newAvatarUrl);
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
          display_name: receivedApiUserInfo.display_name || receivedApiUserInfo.username,
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
      roles: receivedUser.roles,
      permissions: receivedUser.permissions,
      createTime: receivedUser.createTime || new Date().toISOString(),
      studentInfo: receivedUser.studentInfo || null, // Correctly handle studentInfo
      display_name: receivedUser.display_name || receivedUser.username, // Preserve display_name
      phone: receivedUser.phone || null // Preserve phone
    };
    // Consider if storing the full object in localStorage is necessary/secure
    // For now, we assume localStorage might not be the primary source for studentInfo if it's frequently updated
    // or if login/getUserInfo always provides it fresh.
    // localStorage.setItem('user-info', JSON.stringify(userInfo.value)); // Optional: re-evaluate storing complex objects
  }

  // 从本地存储加载用户信息 (ensure createTime and studentInfo)
  const loadUserInfo = () => {
    const storedInfo = localStorage.getItem('user-info');
    if (storedInfo) {
      try {
        const parsedInfo = JSON.parse(storedInfo) as UserInfo; // Type assertion
        if (parsedInfo && typeof parsedInfo === 'object' && parsedInfo.id && parsedInfo.username) {
          userInfo.value = {
            id: parsedInfo.id,
            username: parsedInfo.username,
            email: parsedInfo.email,
            avatar: parsedInfo.avatar,
            roles: parsedInfo.roles,
            permissions: parsedInfo.permissions,
            createTime: parsedInfo.createTime || new Date().toISOString(),
            studentInfo: parsedInfo.studentInfo || null, // Correctly load studentInfo
            display_name: parsedInfo.display_name || parsedInfo.username, // Preserve display_name
            phone: parsedInfo.phone || null // Preserve phone
          };
          console.log('从本地存储加载用户信息:', userInfo.value);
        } else {
          console.warn('本地存储的用户信息格式不正确:', parsedInfo);
          resetState(); // Reset if format is incorrect
        }
      } catch (error) {
        console.error('解析本地存储的用户信息失败:', error);
        resetState(); // Reset on parse error
      }
    }
  }

  // Action to specifically update the user's email in the store
  const updateUserEmailAction = (newEmail: string) => {
    if (userInfo.value && userInfo.value.email !== newEmail) {
      userInfo.value.email = newEmail;
      // Potentially update localStorage if you decide to keep full user-info there
      // localStorage.setItem('user-info', JSON.stringify(userInfo.value));
    }
  };

  // 获取并设置用户信息
  async function fetchAndSetUserInfo() {
    if (!token.value) {
      console.warn('没有token, 无法获取用户信息');
      return;
    }
    try {
      console.log('开始获取用户信息...');
      const res = await getUserInfo(); // res 类型是 ApiResponse<UserInfo>
      console.log('获取用户信息响应:', res);
      if (res.code === 200 && res.data) {
        // 确保传递给 setUserInfo 的是 UserInfo 类型
        setUserInfo(res.data as UserInfo); 
        console.log('用户信息获取并设置成功');
      } else {
        console.error('获取用户信息失败:', res.message);
        ElMessage.error(res.message || '获取用户信息失败');
      }
    } catch (error: any) {
      console.error('获取用户信息时出错:', error);
      ElMessage.error(error.message || '获取用户信息时出错');
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
    try {
      // The API expects a specific shape, so we create it from the incoming data.
      // This also handles the type mismatch where data.phone could be `null`.
      const apiData = {
        email: data.email,
        display_name: data.display_name,
        phone: data.phone === null ? undefined : data.phone,
        avatar: data.avatar,
      };

      const res = await apiUpdateUserProfile(apiData);
      if (res.code === 200 && res.data) {
        // Update local state with the full user info object returned from the API
        const fullUserInfo = {
          ...userInfo.value,
          ...res.data,
        } as UserInfo;

        _updateState(token.value, fullUserInfo);

        ElMessage.success('个人资料更新成功！');
        return true;
      } else {
        ElMessage.error(res.message || '资料更新失败');
        return false;
      }
    } catch (error: any) {
      console.error('[User Store] updateUserProfile failed:', error);
      ElMessage.error(error.message || '更新资料时发生错误');
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
  }
}, {
  // Optional: Enable persistence if needed, though manual localStorage is used here
  // persist: true,
}) 