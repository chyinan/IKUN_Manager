<template>
  <div class="login-wrapper">
    <background-slider />
    <div class="login-container">
      <el-form 
        :model="loginForm" 
        :rules="loginRules"
        ref="loginFormRef"
        class="login-form">
        <h2 class="title">IKUN高校管理系统</h2>
        
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

        <!-- 添加注册按钮 -->
        <div class="register-link">
          <el-button type="text" @click="showRegisterDialog">注册账号</el-button>
        </div>
      </el-form>

      <!-- 注册对话框 -->
      <el-dialog
        v-model="registerVisible"
        title="注册账号"
        width="30%">
        <el-form
          :model="registerForm"
          :rules="registerRules"
          ref="registerFormRef">
          <el-form-item prop="username" label="用户名">
            <el-input v-model="registerForm.username" />
          </el-form-item>
          <el-form-item prop="email" label="邮箱">
            <el-input v-model="registerForm.email" />
          </el-form-item>
          <el-form-item prop="password" label="密码">
            <el-input
              v-model="registerForm.password"
              type="password" />
          </el-form-item>
          <el-form-item prop="confirmPassword" label="确认密码">
            <el-input
              v-model="registerForm.confirmPassword"
              type="password" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="registerVisible = false">取消</el-button>
          <el-button type="primary" @click="handleRegister">注册</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import BackgroundSlider from '@/views/BackgroundSlider/BackgroundSlider.vue'
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
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
        const response = await axios.post('http://localhost:3000/api/user/login', {
          username: loginForm.username,
          password: loginForm.password
        })

        if (response.data.code === 200) {
          // 保存完整的用户信息
          localStorage.setItem('token', response.data.data.token)
          localStorage.setItem('username', response.data.data.username)
          localStorage.setItem('userId', response.data.data.id)
          ElMessage.success('登录成功')
          router.push('/home')
        } else {
          ElMessage.error(response.data.message)
        }
      } catch (error) {
        ElMessage.error('登录失败')
      } finally {
        loading.value = false
      }
    }
  })
}

// 注册相关
const registerVisible = ref(false)
const registerFormRef = ref<FormInstance>()
const registerForm = reactive({
  username: '',
  email: '',    // 新增邮箱字段
  password: '',
  confirmPassword: ''
})

// 注册表单验证规则
const registerRules = reactive<FormRules>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.password) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
})

// 显示注册对话框
const showRegisterDialog = () => {
  registerVisible.value = true
}

// 注册处理函数
const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const response = await axios.post('http://localhost:3000/api/user/register', {
          username: registerForm.username,
          email: registerForm.email,    // 添加邮箱字段
          password: registerForm.password
        })
        
        if (response.data.code === 200) {
          ElMessage.success('注册成功')
          registerVisible.value = false
          registerForm.username = ''
          registerForm.email = ''
          registerForm.password = ''
          registerForm.confirmPassword = ''
        } else {
          ElMessage.error(response.data.message)
        }
      } catch (error) {
        ElMessage.error('注册失败')
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

.register-link {
  text-align: right;
  margin-top: 10px;
}
</style>