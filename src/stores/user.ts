import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login, logout, getUserInfo } from '@/api/user'
import router from '@/router'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref<string>(localStorage.getItem('token') || '')
  const username = ref<string>('')
  const avatar = ref<string>('')
  const roles = ref<string[]>([])
  const permissions = ref<string[]>([])

  // 登录
  const loginAction = async (userInfo: { username: string; password: string }) => {
    try {
      // 开发环境下模拟登录
      if (import.meta.env.DEV) {
        if (userInfo.username === 'admin' && userInfo.password === '123456') {
          const mockToken = 'mock-token-' + Date.now()
          token.value = mockToken
          username.value = userInfo.username
          localStorage.setItem('token', mockToken)
          ElMessage.success('登录成功')
          return true
        } else {
          ElMessage.error('用户名或密码错误')
          return false
        }
      }

      // 生产环境下使用实际API
      const res = await login(userInfo)
      if (res.code === 200 && res.data) {
        token.value = res.data.token
        username.value = res.data.username
        localStorage.setItem('token', res.data.token)
        ElMessage.success('登录成功')
        return true
      } else {
        ElMessage.error(res.message || '登录失败')
        return false
      }
    } catch (error) {
      console.error('登录失败:', error)
      ElMessage.error('登录失败，请稍后重试')
      return false
    }
  }

  // 获取用户信息
  const getUserInfoAction = async () => {
    if (!token.value) return false
    
    try {
      // 开发环境下模拟用户信息
      if (import.meta.env.DEV) {
        username.value = 'admin'
        avatar.value = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
        roles.value = ['admin']
        permissions.value = ['*']
        return true
      }

      // 生产环境下使用实际API
      const res = await getUserInfo()
      if (res.code === 200 && res.data) {
        username.value = res.data.username
        avatar.value = res.data.avatar || ''
        roles.value = res.data.roles || []
        permissions.value = res.data.permissions || []
        return true
      } else {
        return false
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return false
    }
  }

  // 登出
  const logoutAction = async () => {
    try {
      if (token.value && !import.meta.env.DEV) {
        await logout()
      }
    } catch (error) {
      console.error('登出失败:', error)
    } finally {
      resetState()
      router.push('/login')
    }
  }

  // 重置状态
  const resetState = () => {
    token.value = ''
    username.value = ''
    avatar.value = ''
    roles.value = []
    permissions.value = []
    localStorage.removeItem('token')
  }

  return {
    token,
    username,
    avatar,
    roles,
    permissions,
    login: loginAction,
    getUserInfo: getUserInfoAction,
    logout: logoutAction,
    resetState
  }
}) 