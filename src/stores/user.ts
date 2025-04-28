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
      // login 返回 ApiResponse<LoginData>
      const res: ApiResponse<LoginData> = await login(credentials);
      
      console.log('[userStore loginAction] Received API response:', res);

      // 检查 res.code 和 res.data 是否存在，并检查 userInfo 而不是 user
      if (res.code === 200 && res.data?.token && res.data?.userInfo) {
        // 从 res.data 中提取 token 和 userInfo
        const receivedToken = res.data.token;
        const receivedUserInfo = res.data.userInfo;
        
        console.log('[userStore loginAction] Login successful, token received:', receivedToken);
        console.log('[userStore loginAction] Received user info:', receivedUserInfo);

        // Update store state
        token.value = receivedToken;
        userInfo.value = {
          id: receivedUserInfo.id,
          username: receivedUserInfo.username,
          email: receivedUserInfo.email || undefined,
          avatar: receivedUserInfo.avatar || avatar.value || '',
          roles: receivedUserInfo.roles || [], 
          permissions: receivedUserInfo.permissions || [],
          createTime: receivedUserInfo.createTime || new Date().toISOString()
        };
        // Update derived state
        username.value = receivedUserInfo.username;
        avatar.value = receivedUserInfo.avatar || avatar.value || '';
        roles.value = receivedUserInfo.roles || [];
        permissions.value = receivedUserInfo.permissions || [];
        
        // Save token and avatar to localStorage
        localStorage.setItem('token', receivedToken);
        if (avatar.value) {
           localStorage.setItem('user_avatar_url', avatar.value);
        }
        
        // 不需要再显示 ElMessage，交给 request.ts 拦截器处理成功提示
        // ElMessage.success('登录成功');
        return true; // Indicate success
      } else {
        // Handle login failure using message from res
        const errorMsg = res?.message || '登录失败: 无效的响应数据格式';
        console.error('[userStore loginAction] Login failed:', errorMsg, 'Payload:', res);
        // ElMessage.error(errorMsg); // 错误消息由 request.ts 拦截器处理
        return false;
      }
    } catch (error: any) {
      // 错误已在 request.ts 拦截器中处理并提示，这里只记录日志
      console.error('登录 API 调用失败 (catch block in store):', error);
      // 不需要再次 ElMessage.error
      return false;
    }
  }

  // Get User Info Action (Keep existing logic for now)
  const getUserInfoAction = async () => {
    if (!token.value) return false
    
    try {
      // **移除开发环境模拟数据逻辑**
      /*
      if (import.meta.env.DEV) {
        userInfo.value = { 
          id: 1, 
          username: 'admin', 
          email: 'admin@example.com',
          createTime: new Date().toISOString() // <-- Add createTime for mock
        }; 
        username.value = 'admin'
        roles.value = ['admin']
        permissions.value = ['*']
        return true
      }
      */

      // **始终尝试调用 API 获取用户信息**
      console.log('[userStore] Attempting to fetch user info via API...');
      const res = await getUserInfo(); // res is ApiResponse<UserInfo>
      console.log('[userStore] API response for user info:', res);

      // **res 的类型是 ApiResponse<UserInfo>**
      if (res.code === 200 && res.data) {
        // 从 res.data 获取 UserInfo
        const receivedUserInfo = res.data;
        userInfo.value = {
          id: receivedUserInfo.id,
          username: receivedUserInfo.username,
          email: receivedUserInfo.email || undefined,
          avatar: receivedUserInfo.avatar,
          roles: receivedUserInfo.roles,
          permissions: receivedUserInfo.permissions,
          createTime: receivedUserInfo.createTime || new Date().toISOString() // Ensure createTime
        };
        username.value = receivedUserInfo.username
        if (receivedUserInfo.avatar) {
          avatar.value = receivedUserInfo.avatar;
        } else {
          console.log('[userStore] No avatar in getUserInfo response, keeping existing avatar state:', avatar.value);
        }
        roles.value = receivedUserInfo.roles || []
        permissions.value = receivedUserInfo.permissions || []
        return true
      } else {
        // Optionally clear state if fetching info fails after login
        // resetState(); 
        return false
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      // Optionally clear state on error
      // resetState();
      return false
    }
  }

  // Logout Action (Keep existing logic)
  const logoutAction = async () => {
    try {
      if (token.value && !import.meta.env.DEV) {
        // Call backend logout if it exists
        await logout()
      }
    } catch (error) {
      console.error('登出 API 调用失败:', error)
      // Still proceed with local state reset even if API fails
    } finally {
      resetState()
    }
  }

  // Reset State (Updated)
  const resetState = () => {
    token.value = ''
    userInfo.value = null // Reset user info object
    username.value = ''
    avatar.value = ''
    roles.value = []
    permissions.value = []
    localStorage.removeItem('token')
    localStorage.removeItem('user_avatar_url') 

    // Add redirection to login page
    router.push('/login').catch(err => {
      console.error('Redirect to login failed:', err);
    });
    console.log('User state reset and redirected to login.');
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

  return {
    token,
    userInfo, // Export new state
    username,
    avatar,
    roles,
    permissions,
    login: loginAction,
    getUserInfo: getUserInfoAction,
    logout: logoutAction,
    resetState,
    setAvatar, // <-- Export the new action
    updateUserEmailAction, // <-- Export the new action
    // Add a getter for easier checking of authentication status
    isAuthenticated: computed(() => !!token.value && !!userInfo.value)
  }
}, {
  // Optional: Enable persistence if needed, though manual localStorage is used here
  // persist: true,
}) 