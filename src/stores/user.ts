import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, logout, getUserInfo } from '@/api/user'
import router from '@/router'
import { ElMessage } from 'element-plus'

// Define a type for the user info object
interface UserInfo {
  id: number;
  username: string;
  email: string;
  // Add other relevant fields if returned by the API
}

export const useUserStore = defineStore('user', () => {
  // State
  const token = ref<string>(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfo | null>(null) // Store user object
  const username = ref<string>('')
  // Initialize avatar state from localStorage first
  const initialAvatarFromStorage = localStorage.getItem('user_avatar_url') || ''
  console.log('[userStore Init] Reading avatar from localStorage:', initialAvatarFromStorage);
  const avatar = ref<string>(initialAvatarFromStorage) 
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
      // 'res' here is the full Axios response object because the interceptor returns it
      const res = await login(credentials);
      
      // Access the backend payload from res.data
      const backendPayload = res.data; 

      // Check for successful response based on backend structure within backendPayload
      if (backendPayload?.code === 200 && backendPayload?.data?.token && backendPayload?.data?.user) {
        // Extract token and user info from backendPayload.data
        const receivedToken = backendPayload.data.token;
        const receivedUser = backendPayload.data.user;
        
        // Update store state
        token.value = receivedToken;
        userInfo.value = receivedUser; 
        username.value = receivedUser.username; // Keep this for convenience if needed elsewhere
        // Set avatar from login response if available, otherwise keep localStorage/empty
        avatar.value = receivedUser.avatar || avatar.value || ''; 
        
        // Save token to localStorage
        localStorage.setItem('token', receivedToken);
        
        ElMessage.success('登录成功');
        return true; // Indicate success
      } else {
        // Handle login failure using message from backendPayload
        ElMessage.error(backendPayload?.message || '登录失败: 无效的响应数据');
        return false;
      }
    } catch (error: any) {
      console.error('登录 API 调用失败 (catch block):', error);
      // Error might be from network or interceptor rejection
      // Use the error message provided by the interceptor or a default
      const message = error?.message || '登录失败，请稍后重试'; 
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
        userInfo.value = res.data; // Assuming API returns the user object directly in data
        username.value = res.data.username
        // Only update avatar state if backend provides a new avatar URL
        if (res.data.avatar) {
          console.log('[userStore] Updating avatar from getUserInfo response:', res.data.avatar);
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