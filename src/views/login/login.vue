<template>
  <div class="login-wrapper">
    <background-slider />
    <div class="login-container">
      <el-form 
        :model="loginForm" 
        :rules="loginRules"
        ref="loginFormRef"
        class="login-form">
        <h2 class="title">IKUN管理系统</h2>
        
        <el-form-item prop="username">
          <el-input 
            v-model="loginForm.username"
            placeholder="用户名"
            prefix-icon="User">
          </el-input>
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input 
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            prefix-icon="Lock"
            @keyup.enter="handleLogin">
          </el-input>
        </el-form-item>

        <el-button 
          type="primary" 
          :loading="loading"
          @click="handleLogin"
          class="login-button">
          登录
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import BackgroundSlider from '@/views/BackgroundSlider/BackgroundSlider.vue'
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import axios from 'axios'

const router = useRouter()
const loginFormRef = ref<FormInstance>()
const loading = ref(false)

// 登录表单数据
const loginForm = reactive({
  username: '',
  password: ''
})

// 表单验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

// 登录处理函数
const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        // 直接使用模拟验证
        if (loginForm.username === 'admin' && loginForm.password === '123456') {
          localStorage.setItem('token', 'admin-token')
          ElMessage.success('登录成功')
          router.push('/home')  // 修改为正确的路由路径
        } else {
          ElMessage.error('用户名或密码错误')
        }
      } catch (error) {
        ElMessage.error('登录失败')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.login-wrapper {
  position: relative;
  min-height: 100vh;
}

.login-container {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.login-form {
  background: rgba(255, 255, 255, 0.9);
  padding: 35px;
  border-radius: 10px;
  width: 350px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.title {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.login-button {
  width: 100%;
  margin-top: 10px;
}
</style>