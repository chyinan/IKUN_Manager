<template>
  <div class="profile-container">
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <span>个人中心</span>
        </div>
      </template>
      
      <div class="profile-content">
        <!-- 左侧头像区域 -->
        <div class="avatar-container">
          <el-avatar
            :size="120"
            :src="userInfo.avatar || defaultAvatar"
            @error="avatarError"
          />
          <el-upload
            class="avatar-uploader"
            action="#"
            :http-request="uploadAvatar"
            :show-file-list="false"
            accept="image/*"
          >
            <el-button size="small" type="primary" class="upload-btn">
              更换头像
            </el-button>
          </el-upload>
        </div>
        
        <!-- 右侧信息区域 -->
        <div class="info-container">
          <el-form 
            ref="formRef" 
            :model="userInfo" 
            :rules="rules" 
            label-position="top"
          >
            <el-form-item label="用户名" prop="username">
              <el-input v-model="userInfo.username" disabled />
            </el-form-item>
            
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="userInfo.email" placeholder="请输入您的邮箱" />
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="handleUpdateInfo" :loading="loading.updateInfo">
                保存信息
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
      
      <!-- 账户安全区域 -->
      <div class="security-container">
        <h3 class="section-title">账户安全</h3>
        
        <div class="security-options">
          <div class="security-item" @click="passwordDialogVisible = true">
            <el-icon class="security-icon"><Lock /></el-icon>
            <div class="security-info">
              <h4>修改密码</h4>
              <p>定期修改密码可以保障账户安全</p>
            </div>
            <el-icon><ArrowRight /></el-icon>
          </div>
          
          <div class="security-item" @click="confirmLogout">
            <el-icon class="security-icon"><SwitchButton /></el-icon>
            <div class="security-info">
              <h4>退出登录</h4>
              <p>安全退出当前登录的账户</p>
            </div>
            <el-icon><ArrowRight /></el-icon>
          </div>
          
          <div class="security-item danger" @click="confirmDeactivate">
            <el-icon class="security-icon"><Delete /></el-icon>
            <div class="security-info">
              <h4>注销账户</h4>
              <p>永久删除您的账户和所有数据</p>
            </div>
            <el-icon><ArrowRight /></el-icon>
          </div>
        </div>
      </div>
    </el-card>
    
    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="修改密码"
      width="30%"
      :close-on-click-modal="false"
    >
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="100px"
      >
        <el-form-item label="原密码" prop="oldPassword">
          <el-input
            v-model="passwordForm.oldPassword"
            type="password"
            show-password
            placeholder="请输入原密码"
          />
        </el-form-item>
        
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            show-password
            placeholder="请输入新密码"
          />
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            show-password
            placeholder="请确认新密码"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="passwordDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleChangePassword" :loading="loading.password">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { updatePassword } from '@/api/user'
import type { FormInstance } from 'element-plus'
import { 
  Lock, SwitchButton, Delete, ArrowRight
} from '@element-plus/icons-vue'

// 路由实例
const router = useRouter()

// 用户 store
const userStore = useUserStore()

// 表单 refs
const formRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()

// 默认头像
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

// 用户信息表单
const userInfo = reactive({
  username: userStore.username || localStorage.getItem('username') || '',
  email: localStorage.getItem('email') || '',
  avatar: userStore.avatar || defaultAvatar
})

// 加载状态
const loading = reactive({
  updateInfo: false,
  password: false,
  avatar: false
})

// 表单验证规则
const rules = {
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

// 对话框显示状态
const passwordDialogVisible = ref(false)

// 密码表单
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 密码表单验证规则
const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: Function) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 初始化数据
onMounted(() => {
  // 如果有用户数据，填充表单
  if (userStore.username) {
    userInfo.username = userStore.username
    userInfo.avatar = userStore.avatar || defaultAvatar
    // 从localStorage获取其他信息
    userInfo.email = localStorage.getItem('email') || ''
  }
})

// 头像上传错误处理
const avatarError = () => {
  userInfo.avatar = defaultAvatar
  ElMessage.warning('头像加载失败，已使用默认头像')
}

// 上传头像
const uploadAvatar = async (options: any) => {
  try {
    loading.avatar = true
    
    // 获取文件
    const file = options.file
    
    // 检查文件类型
    const isImage = file.type.startsWith('image/')
    if (!isImage) {
      ElMessage.error('请上传图片文件')
      return
    }
    
    // 检查文件大小（限制为2MB）
    const isLt2M = file.size / 1024 / 1024 < 2
    if (!isLt2M) {
      ElMessage.error('图片大小不能超过2MB')
      return
    }
    
    // 在生产环境中，这里应该调用API上传图片
    // const formData = new FormData()
    // formData.append('avatar', file)
    // const res = await uploadUserAvatar(formData)
    
    // 开发环境模拟
    // 使用FileReader将图片转为base64
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      // 更新头像
      userInfo.avatar = base64
      
      // 更新store
      // userStore.setAvatar(base64)
      
      ElMessage.success('头像上传成功')
      loading.avatar = false
    }
  } catch (error) {
    console.error('上传头像失败:', error)
    ElMessage.error('上传失败，请稍后重试')
    loading.avatar = false
  }
}

// 更新用户信息
const handleUpdateInfo = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) {
      ElMessage.warning('请完善表单信息')
      return
    }
    
    try {
      loading.updateInfo = true
      
      // 在生产环境中，这里应该调用API更新用户信息
      // const res = await updateUserInfo({
      //   nickname: userInfo.nickname,
      //   email: userInfo.email
      // })
      
      // 开发环境模拟
      setTimeout(() => {
        // 保存到localStorage
        localStorage.setItem('email', userInfo.email)
        
        ElMessage.success('个人信息更新成功')
        loading.updateInfo = false
      }, 1000)
    } catch (error) {
      console.error('更新用户信息失败:', error)
      ElMessage.error('更新失败，请稍后重试')
      loading.updateInfo = false
    }
  })
}

// 修改密码
const handleChangePassword = async () => {
  if (!passwordFormRef.value) return
  
  await passwordFormRef.value.validate(async (valid) => {
    if (!valid) {
      ElMessage.warning('请完善表单信息')
      return
    }
    
    try {
      loading.password = true
      
      // 构建密码数据
      const passwordData = {
        username: userInfo.username,
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword
      }
      
      // 调用API更新密码
      const res = await updatePassword(passwordData)
      
      // --- Add diagnostic log ---
      console.log('Response received by handleChangePassword:', res)
      // --- End diagnostic log ---
      
      if (res.data?.code === 200) {
        ElMessage.success('密码修改成功，请重新登录')
        passwordDialogVisible.value = false
        
        // 清空表单
        passwordForm.oldPassword = ''
        passwordForm.newPassword = ''
        passwordForm.confirmPassword = ''
        
        // 退出登录
        handleLogout()
      } else {
        ElMessage.error(res.message || '密码修改失败')
      }
    } catch (error) {
      console.error('修改密码失败:', error)
      ElMessage.error('修改失败，请稍后重试')
    } finally {
      loading.password = false
    }
  })
}

// 确认注销账户
const confirmDeactivate = () => {
  ElMessageBox.confirm(
    '注销账户将删除您的所有个人数据，此操作不可逆，是否继续？',
    '警告',
    {
      confirmButtonText: '确认注销',
      cancelButtonText: '取消',
      type: 'warning',
      distinguishCancelAndClose: true
    }
  ).then(() => {
    // 在生产环境中，这里应该调用API注销账户
    // await deactivateAccount()
    
    // 开发环境模拟
    ElMessage.success('账户已注销')
    handleLogout()
  }).catch(() => {
    // 用户取消操作
  })
}

// 确认退出登录
const confirmLogout = () => {
  ElMessageBox.confirm(
    '确定要退出登录吗？',
    '提示',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    handleLogout()
  }).catch(() => {
    // 用户取消操作
  })
}

// 退出登录
const handleLogout = () => {
  // 调用store的logout
  userStore.logout()
  
  // 跳转到登录页
  router.push('/login')
  
  ElMessage.success('退出成功')
}
</script>

<style scoped>
.profile-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 84px);
}

.profile-card {
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header span {
  font-size: 18px;
  font-weight: bold;
}

.profile-content {
  display: flex;
  gap: 40px;
  margin-bottom: 30px;
}

.avatar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.upload-btn {
  margin-top: 10px;
}

.info-container {
  flex: 1;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.security-container {
  margin-top: 30px;
}

.security-options {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.security-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border-radius: 8px;
  background-color: #f9f9f9;
  cursor: pointer;
  transition: all 0.3s;
}

.security-item:hover {
  background-color: #f0f0f0;
}

.security-icon {
  font-size: 24px;
  color: #409EFF;
  margin-right: 15px;
}

.security-info {
  flex: 1;
}

.security-info h4 {
  margin: 0 0 5px 0;
  font-size: 16px;
}

.security-info p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.danger .security-icon {
  color: #F56C6C;
}

.danger:hover {
  background-color: #fef0f0;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .profile-content {
    flex-direction: column;
    align-items: center;
  }
  
  .info-container {
    width: 100%;
  }
}
</style> 