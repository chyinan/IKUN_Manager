import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, logout, getUserInfo } from '@/api/user'
import { ElMessage } from 'element-plus'
import type { LoginData, UserInfo, ApiResponse } from '@/types/common'
import router from '@/router'

export const useUserStore = defineStore('user', () => {
  // State
  const token = ref<string>(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfo | null>(null)
  const username = ref<string>('')
  const avatar = ref<string>(localStorage.getItem('user_avatar_url') || '')
  const roles = ref<string[]>([])
  const permissions = ref<string[]>([])

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
      const res: ApiResponse<LoginData> = await login(credentials);
      console.log('[userStore loginAction] Received API response:', JSON.stringify(res)); // Log the full response

      // Log the values being checked in the condition
      console.log(`[userStore loginAction] Checking condition: res.code === 200 (${res.code === 200})`);
      console.log(`[userStore loginAction] Checking condition: res.data?.token exists (${!!res.data?.token})`);
      console.log(`[userStore loginAction] Checking condition: res.data?.id exists (${!!res.data?.id})`);
      console.log(`[userStore loginAction] Checking condition: res.data?.username exists (${!!res.data?.username})`);
      console.log('[userStore loginAction] res.data.token value:', res.data?.token);
      console.log('[userStore loginAction] res.data (user info context):', JSON.stringify(res.data));

      if (res.code === 200 && res.data?.token && res.data?.id && res.data?.username) {
        const receivedToken = res.data.token;
        const receivedApiUserInfo = res.data; 
        
        console.log('[userStore loginAction] Login successful, token received (inside if block):', receivedToken);
        console.log('[userStore loginAction] Received user info from API (inside if block):', JSON.stringify(receivedApiUserInfo));

        const userApiRole = receivedApiUserInfo.role; 
        const userRolesArray = userApiRole ? [userApiRole] : []; 

        token.value = receivedToken;
        userInfo.value = {
          id: receivedApiUserInfo.id,
          username: receivedApiUserInfo.username,
          email: receivedApiUserInfo.email || undefined,
          avatar: receivedApiUserInfo.avatar || avatar.value || '',
          role: receivedApiUserInfo.role, 
          roles: userRolesArray,         
          permissions: receivedApiUserInfo.permissions || [],
          createTime: receivedApiUserInfo.createTime || new Date().toISOString(),
          studentInfo: receivedApiUserInfo.studentInfo || null,
          display_name: receivedApiUserInfo.display_name || receivedApiUserInfo.username, // Fallback to username if display_name is not present
          phone: receivedApiUserInfo.phone || null // Add phone field
        };
        
        username.value = receivedApiUserInfo.username;
        avatar.value = userInfo.value.avatar; 
        roles.value = userRolesArray; 

        localStorage.setItem('token', receivedToken);
        if (avatar.value) {
           localStorage.setItem('user_avatar_url', avatar.value);
        }
        console.log('[userStore loginAction] Returning true from success path.');
        return true;
      } else {
        const errorMsg = res?.message || '登录失败: 响应数据格式无效或缺少token/用户信息';
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

        const userApiRole = receivedApiUserInfo.role; // e.g., "admin"
        const userRolesArray = userApiRole ? [userApiRole] : []; // e.g., ["admin"]

        userInfo.value = {
          id: receivedApiUserInfo.id,
          username: receivedApiUserInfo.username,
          email: receivedApiUserInfo.email || undefined,
          avatar: receivedApiUserInfo.avatar,
          role: receivedApiUserInfo.role, // Keep original role
          roles: userRolesArray,         // Store derived roles array
          permissions: receivedApiUserInfo.permissions || [], // Ensure permissions is an array
          createTime: receivedApiUserInfo.createTime || new Date().toISOString(),
          display_name: receivedApiUserInfo.display_name || receivedApiUserInfo.username, // Fallback to username
          studentInfo: receivedApiUserInfo.studentInfo || null, // Add studentInfo here
          phone: receivedApiUserInfo.phone || null // Add phone field
        };
        username.value = receivedApiUserInfo.username;
        if (receivedApiUserInfo.avatar) {
          avatar.value = receivedApiUserInfo.avatar;
        }
        // CRITICAL FIX: Ensure the standalone roles ref is updated
        roles.value = userRolesArray; 
        
        // Update standalone permissions ref as well, for consistency if it exists and is used elsewhere directly
        // If you only use permissions via userInfo.value.permissions, this line is optional
        if (typeof permissions !== 'undefined' && permissions.value !== undefined) { // Check if permissions ref exists
            permissions.value = receivedApiUserInfo.permissions || [];
        }

        // Sync avatar to localStorage if fetched
        if (avatar.value) {
            localStorage.setItem('user_avatar_url', avatar.value);
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

    console.log('[userStore resetState] State reset. Attempting to redirect to /login...');
    router.push('/login').catch(err => {
      console.error('[userStore resetState] Redirect to login failed:', err);
    });
    console.log('[userStore resetState] Redirection to login initiated (or failed if error above).');
  }

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

  // 设置用户信息 (ensure createTime)
  const setUserInfo = (receivedUser: UserInfo) => {
    console.log('更新用户信息:', receivedUser);
    userInfo.value = {
      id: receivedUser.id,
      username: receivedUser.username,
      email: receivedUser.email,
      avatar: receivedUser.avatar,
      roles: receivedUser.roles,
      permissions: receivedUser.permissions,
      createTime: receivedUser.createTime || new Date().toISOString() // <-- Add createTime
    };
    // Consider if storing the full object in localStorage is necessary/secure
    localStorage.setItem('user-info', JSON.stringify(userInfo.value));
  }

  // 从本地存储加载用户信息 (ensure createTime)
  const loadUserInfo = () => {
    const storedInfo = localStorage.getItem('user-info');
    if (storedInfo) {
      try {
        const parsedInfo = JSON.parse(storedInfo);
        if (parsedInfo && typeof parsedInfo === 'object' && parsedInfo.id && parsedInfo.username) {
          userInfo.value = {
            id: parsedInfo.id,
            username: parsedInfo.username,
            email: parsedInfo.email,
            avatar: parsedInfo.avatar,
            roles: parsedInfo.roles,
            permissions: parsedInfo.permissions,
            createTime: parsedInfo.createTime || new Date().toISOString() // <-- Add createTime
          };
          console.log('从本地存储加载用户信息:', userInfo.value);
        } else {
          console.warn('本地存储的用户信息格式不正确:', parsedInfo);
          resetState();
        }
      } catch (error) {
        console.error('解析本地存储的用户信息失败:', error);
        resetState();
      }
    }
  }

  // Action to specifically update the user's email in the store
  const updateUserEmailAction = (newEmail: string) => {
    if (userInfo.value) {
      userInfo.value.email = newEmail;
      console.log('[userStore] Updated email in store state:', newEmail);
      // Optionally update localStorage if email is stored there separately
      // localStorage.setItem('email', newEmail); // Example if needed
    } else {
      console.warn('[userStore] Tried to update email, but userInfo is null.');
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

  return {
    token,
    userInfo,
    username,
    avatar,
    roles,     // Expose roles array
    permissions,
    loginAction,
    getUserInfoAction,
    logoutAction,
    resetState,
    setAvatar,
    isAdmin,  // Expose isAdmin
    isStudent // Expose isStudent
  }
}, {
  // Optional: Enable persistence if needed, though manual localStorage is used here
  // persist: true,
}) 