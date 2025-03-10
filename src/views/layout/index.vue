<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { updatePassword } from '@/api/user'
import type { PasswordForm } from '@/types/user'  // 添加类型导入

const router = useRouter()
const formRef = ref()  // 添加表单引用
const username = ref(localStorage.getItem('username') || '')  // 从localStorage获取用户名
const dialogVisible = ref(false)
const loading = ref(false)

// 修改密码表单数据
const formData = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 表单验证规则
const rules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: Function) => {
        if (value !== formData.value.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 修改密码处理函数
const handleChangePassword = async (formEl: any) => {
  if (!formEl) return
  
  await formEl.validate(async (valid: boolean) => {
    if (valid) {
      try {
        loading.value = true
        // 创建完整的 PasswordForm 对象
        const passwordData: PasswordForm = {
          username: username.value,
          oldPassword: formData.value.oldPassword,
          newPassword: formData.value.newPassword,
          confirmPassword: formData.value.confirmPassword // 添加确认密码
        }
        
        const res = await updatePassword(passwordData)
        
        if (res.code === 200) {
          ElMessage.success('密码修改成功，请重新登录')
          dialogVisible.value = false
          // 清空表单
          formData.value = {
            oldPassword: '',
            newPassword: '',
            confirmPassword: ''
          }
          // 退出登录
          localStorage.removeItem('token')
          localStorage.removeItem('username')
          router.push('/login')
        } else {
          ElMessage.error(res.message || '修改失败')
        }
      } catch (error: any) {
        console.error('修改密码失败:', error)
        ElMessage.error(
          error.response?.data?.message || 
          error.message || 
          '修改密码失败，请稍后重试'
        )
      } finally {
        loading.value = false
      }
    }
  })
}

onMounted(() => {
  // 从localStorage获取用户名
  const storedUsername = localStorage.getItem('username')
  username.value = storedUsername || '用户'
})

// 退出登录处理函数
const handleLogout = () => {
// 清除token
  localStorage.removeItem('token')
  // 显示成功消息
  ElMessage.success('退出成功')
// 跳转到登录页
  router.push('/login')
}
</script>

<template>
   <div class="common-layout">
    <el-container>
      <!-- 顶栏 - header -->
      <el-header class="header">
        <span class="title">高校人事管理系统</span>
        <span class="right_tool">
          <span class="welcome">{{ username }}，欢迎你！</span>
          <a @click="dialogVisible = true" style="cursor: pointer">
            <el-icon><Lock /></el-icon> 修改密码 &nbsp;&nbsp;&nbsp;&nbsp;
          </a>
          <a @click="handleLogout" style="cursor: pointer">
            <el-icon><SwitchButton /></el-icon> 退出系统&nbsp;&nbsp;&nbsp;&nbsp;
          </a>
        </span>
      </el-header>
      

      <!-- 左侧菜单 & 主区域 -->
      <el-container>
        <!-- 左侧菜单 -->
        <el-aside width="200px" class="aside">
          <el-scrollbar>
            <el-menu router>
              <!-- 首页菜单 -->
              <el-menu-item index="/index">
                <el-icon><Promotion /></el-icon> 首页
              </el-menu-item>
              
              <!-- 班级管理菜单 -->
              <el-sub-menu index="/manage">
                <template #title>
                  <el-icon><Menu /></el-icon> 班级管理
                </template>
                <el-menu-item index="/clazz">
                  <el-icon><HomeFilled /></el-icon>班级管理
                </el-menu-item>
                <el-menu-item index="/stu">
                  <el-icon><UserFilled /></el-icon>学生管理
                </el-menu-item>
              </el-sub-menu>
              
              <!-- 系统信息管理 -->
              <el-sub-menu index="/system">
                <template #title>
                  <el-icon><Tools /></el-icon>人事管理
                </template>
                <el-menu-item index="/dept">
                  <el-icon><HelpFilled /></el-icon>部门管理
                </el-menu-item>
                <el-menu-item index="/emp">
                  <el-icon><Avatar /></el-icon>员工管理
                </el-menu-item>
              </el-sub-menu>

              <!-- 数据统计管理 -->
              <el-sub-menu index="/report">
                <template #title>
                  <el-icon><Histogram /></el-icon>数据统计管理
                </template>
                <el-menu-item index="/empReport">
                  <el-icon><PieChart /></el-icon>员工信息统计
                </el-menu-item>
                <el-menu-item index="/stuReport">
                  <el-icon><DataAnalysis /></el-icon>学员信息统计
                </el-menu-item>
                <el-menu-item index="/exam">
                  <el-icon><Calendar /></el-icon>考试管理
                </el-menu-item>
                <el-menu-item index="/score">
                  <el-icon><Edit /></el-icon>成绩管理
                </el-menu-item>
                <el-menu-item index="/log">
                  <el-icon><Monitor/></el-icon>日志信息统计
                </el-menu-item>
              </el-sub-menu>
			
            </el-menu>
          </el-scrollbar>
        </el-aside>

        <!-- 主展示区域 -->
        <el-main>
          <RouterView></RouterView>
        </el-main>
      </el-container>
    </el-container>
    
    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="修改密码"
      width="30%"
      :close-on-click-modal="false">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input
            v-model="formData.oldPassword"
            type="password"
            show-password
            placeholder="请输入原密码">
          </el-input>
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="formData.newPassword"
            type="password"
            show-password
            placeholder="请输入新密码">
          </el-input>
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="formData.confirmPassword"
            type="password"
            show-password
            placeholder="请确认新密码">
          </el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleChangePassword(formRef)" :loading="loading">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.header {
  background-image: linear-gradient(to right, #0cc6e7, #4db5e9, #6fc6eb, #8bd7ec, #a5e8ee);
  line-height: 60px;
}

.title {
  color: white;
  font-size: 35px;
  font-family: 方正剪纸简体;
  
}

.right_tool {
  float: right;
  display: flex;
  align-items: center;
}

a {
  text-decoration: none;
  color: white;
}

.aside {
  border: 1px solid #ccc;
  height: 690px;
  width: 220px;
}

.welcome {
  margin-right: 20px;
  color: white;
}
</style>