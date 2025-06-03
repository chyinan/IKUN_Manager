<template>
    <div class="login-container">
      <!-- 背景轮播 -->
      <el-carousel class="background-carousel" :interval="5000" arrow="never" indicator-position="none">
        <el-carousel-item v-for="(bg, index) in backgrounds" :key="index">
          <div class="carousel-image" :style="{ backgroundImage: `url(${bg})` }"></div>
        </el-carousel-item>
      </el-carousel>
  
      <div class="login-card">
        <div class="login-header">
          <h2>高校人事管理系统</h2>
          <p>欢迎登录系统</p>
        </div>
        
        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          class="login-form"
        >
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="用户名"
              prefix-icon="User"
              clearable
              @keyup.enter="handleLogin"
            />
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="密码"
              prefix-icon="Lock"
              show-password
              clearable
              @keyup.enter="handleLogin"
            />
          </el-form-item>
          
          <el-form-item>
            <el-button
              type="primary"
              :loading="loading"
              class="login-button"
              @click="handleLogin"
            >
              登录
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  import { useUserStore } from '@/stores/user'
  
  // 背景图片列表
  const backgrounds = [
    '/src/assets/images/bg1.jpg',
    '/src/assets/images/bg2.jpg',
    '/src/assets/images/bg3.jpg'
  ]
  
  // 路由
  const route = useRoute()
  const router = useRouter()
  
  // 用户存储
  const userStore = useUserStore()
  
  // 表单引用
  const loginFormRef = ref<FormInstance>()
  
  // 加载状态
  const loading = ref(false)
  
  // 登录表单
  const loginForm = ref({
    username: 'admin',
    password: '123456'
  })
  
  // 表单验证规则
  const loginRules: FormRules = {
    username: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
    ],
    password: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
    ]
  }
  
  // 处理登录
  const handleLogin = async () => {
    if (!loginFormRef.value) return
    
    await loginFormRef.value.validate(async (valid) => {
      if (!valid) {
        ElMessage.warning('请正确填写登录信息')
        return
      }
      
      loading.value = true
      
      try {
        const success = await userStore.loginAction(loginForm.value)
        console.log('[LoginComponent] loginAction success status:', success);
        
        if (success) {
          const redirect = route.query.redirect as string
          console.log('[LoginComponent] Redirect path from query:', redirect);
          const targetPath = redirect || '/';
          console.log('[LoginComponent] Navigating to target path:', targetPath);
          router.push(targetPath);
        }
      } catch (error) {
        console.error('[LoginComponent] Unknown error during login process:', error) 
      } finally {
        loading.value = false
      }
    })
  }
  </script>
  
  <style scoped>
  .login-container {
    position: relative;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
  }
  
  .background-carousel {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  
  .carousel-image {
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    transition: all 0.5s;
  }
  
  .login-card {
    position: relative;
    z-index: 2;
    width: 400px;
    padding: 40px;
    border-radius: 8px;
    background-color: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  
  .login-header {
    text-align: center;
    margin-bottom: 30px;
  }
  
  .login-header h2 {
    font-size: 24px;
    color: #303133;
    margin-bottom: 10px;
  }
  
  .login-header p {
    font-size: 14px;
    color: #909399;
  }
  
  .login-form {
    margin-bottom: 20px;
  }
  
  .login-button {
    width: 100%;
  }
  
  .login-tips {
    text-align: center;
    font-size: 12px;
    color: #909399;
    line-height: 1.5;
  }
  
  /* 轮播图自定义样式 */
  :deep(.el-carousel__container) {
    height: 100%;
  }
  
  :deep(.el-carousel__item) {
    height: 100%;
  }
  </style> 