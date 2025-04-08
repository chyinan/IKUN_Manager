import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, logout, getUserInfo } from '@/api/user'
import router from '@/router'
import { ElMessage } from 'element-plus'

// Define a type for the user info object
interface UserInfo {
  id: number;
  username: string;
  email?: string;
  avatar?: string | null | undefined;
  roles?: string[];
  permissions?: string[];
}

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

  // Login Action (Updated)
  const loginAction = async (credentials: { username: string; password: string }) => {
    try {
      // Call the actual backend login API
      // 'res' contains the full Axios response
      const res = await login(credentials);
      
      // Access the backend payload directly from res (assuming interceptor passes it through)
      // Or potentially res.data if your interceptor structure differs
      const backendPayload = res; // Adjust if needed based on request.ts interceptor

      console.log('[userStore loginAction] Received backend payload:', backendPayload); // Add detailed log

      // Check for successful response using the correct structure
      if (backendPayload?.code === 200 && backendPayload?.data?.data?.token && backendPayload?.data?.data?.user) {
        // Extract token and user info correctly
        const receivedToken = backendPayload.data.data.token;
        const receivedUser = backendPayload.data.data.user; // Use user instead of userInfo
        
        console.log('[userStore loginAction] Login successful, token received:', receivedToken);
        console.log('[userStore loginAction] Received user info:', receivedUser);

        // Update store state
        token.value = receivedToken;
        userInfo.value = {
          id: receivedUser.id,
          username: receivedUser.username,
          email: receivedUser.email || undefined,
          avatar: receivedUser.avatar,
          // Handle roles/permissions if they exist in userInfo
          roles: receivedUser.roles || [], 
          permissions: receivedUser.permissions || [] 
        };
        // Update derived state
        username.value = receivedUser.username;
        avatar.value = receivedUser.avatar || avatar.value || ''; // Keep existing if null/undefined
        roles.value = receivedUser.roles || [];
        permissions.value = receivedUser.permissions || [];
        
        // Save token and avatar to localStorage
        localStorage.setItem('token', receivedToken);
        if (avatar.value) { // Only save avatar if it exists
           localStorage.setItem('user_avatar_url', avatar.value);
        }
        
        ElMessage.success('登录成功');
        return true; // Indicate success
      } else {
        // Handle login failure using message from backendPayload
        const errorMsg = backendPayload?.message || '登录失败: 无效的响应数据格式';
        console.error('[userStore loginAction] Login failed:', errorMsg, 'Payload:', backendPayload);
        ElMessage.error(errorMsg);
        return false;
      }
    } catch (error: any) {
      console.error('登录 API 调用失败 (catch block):', error);
      const message = error?.response?.data?.message || error?.message || '登录失败，请稍后重试'; 
      ElMessage.error(message);
      return false;
    }
  }

  // Get User Info Action (Keep existing logic for now)
  const getUserInfoAction = async () => {
    if (!token.value) return false
    
    try {
      // 开发环境下模拟用户信息
      if (import.meta.env.DEV) {
        userInfo.value = { id: 1, username: 'admin', email: 'admin@example.com'}; // Update mock user info
        username.value = 'admin'
        // avatar.value = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png' // DO NOT OVERWRITE in dev mode
        roles.value = ['admin']
        permissions.value = ['*']
        return true
      }

      // 生产环境下使用实际API
      // This API call might need adjustment depending on your backend /api/user/info route
      const res = await getUserInfo()
      if (res.code === 200 && res.data) {
        userInfo.value = {
          id: res.data.id,
          username: res.data.username,
          email: res.data.email || undefined,
          avatar: res.data.avatar,
          roles: res.data.roles,
          permissions: res.data.permissions
        };
        username.value = res.data.username
        if (res.data.avatar) {
          avatar.value = res.data.avatar;
        } else {
          console.log('[userStore] No avatar in getUserInfo response, keeping existing avatar state:', avatar.value);
        }
        roles.value = res.data.roles || []
        permissions.value = res.data.permissions || []
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
      router.push('/login') // Redirect to login
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
    localStorage.removeItem('user_avatar_url') // <-- Clear avatar URL on logout
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

  // 设置用户信息
  const setUserInfo = (receivedUser: UserInfo) => {
    console.log('更新用户信息:', receivedUser);
    userInfo.value = {
      id: receivedUser.id,
      username: receivedUser.username,
      email: receivedUser.email,
      avatar: receivedUser.avatar,
      roles: receivedUser.roles,
      permissions: receivedUser.permissions
    };
    localStorage.setItem('user-info', JSON.stringify(userInfo.value));
  }

  // 从本地存储加载用户信息
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
            permissions: parsedInfo.permissions
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

  // 获取并设置用户信息
  async function fetchAndSetUserInfo() {
    if (!token.value) {
      console.warn('没有token, 无法获取用户信息');
      return;
    }
    try {
      console.log('开始获取用户信息...');
      const res = await getUserInfo();
      console.log('获取用户信息响应:', res);
      if (res.code === 200 && res.data) {
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
    // Add a getter for easier checking of authentication status
    isAuthenticated: computed(() => !!token.value && !!userInfo.value)
  }
}, {
  // Optional: Enable persistence if needed, though manual localStorage is used here
  // persist: true,
}) 