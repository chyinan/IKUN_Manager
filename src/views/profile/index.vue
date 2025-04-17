<template>
  <div class="profile-container">
    <el-card class="profile-card" :class="{ 'dark-component-bg': isDark }">
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
            :http-request="handleUploadAvatar"
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
            
            <el-form-item v-if="hasChanges"> 
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
          <div class="security-item" :class="{ 'dark-component-bg': isDark }" @click="passwordDialogVisible = true">
            <el-icon class="security-icon"><Lock /></el-icon>
            <div class="security-info">
              <h4>修改密码</h4>
              <p>定期修改密码可以保障账户安全</p>
            </div>
            <el-icon><ArrowRight /></el-icon>
          </div>
          
          <div class="security-item" :class="{ 'dark-component-bg': isDark }" @click="confirmLogout">
            <el-icon class="security-icon"><SwitchButton /></el-icon>
            <div class="security-info">
              <h4>退出登录</h4>
              <p>安全退出当前登录的账户</p>
            </div>
            <el-icon><ArrowRight /></el-icon>
          </div>
          
          <div class="security-item danger" :class="{ 'dark-component-bg': isDark }" @click="confirmDeactivate">
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
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useDark } from '@vueuse/core'
import { useUserStore } from '@/stores/user'
import { updatePassword, uploadAvatar, updateUserInfo } from '@/api/user'
import type { FormInstance, FormRules } from 'element-plus'
import { 
  Lock, SwitchButton, Delete, ArrowRight
} from '@element-plus/icons-vue'

// 用户信息接口
interface UserInfo {
  username: string
  email: string
  avatar: string
}

// 密码表单接口
interface PasswordForm {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

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
const userInfo = reactive<UserInfo>({
  username: userStore.username || localStorage.getItem('username') || '',
  email: userStore.userInfo?.email || localStorage.getItem('email') || '', 
  avatar: userStore.avatar || defaultAvatar 
})

// 初始值
const initialEmail = ref(userInfo.email)
const initialAvatar = ref(userInfo.avatar)

// 加载状态
const loading = reactive({
  updateInfo: false,
  password: false,
  avatar: false
})

// 表单验证规则
const rules = reactive<FormRules>({
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
})

// 对话框显示状态
const passwordDialogVisible = ref(false)

// 密码表单
const passwordForm = reactive<PasswordForm>({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 密码表单验证规则
const passwordRules = reactive<FormRules>({
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
})

// 检查是否有更改
const hasChanges = computed(() => {
  return userInfo.email !== initialEmail.value || userInfo.avatar !== initialAvatar.value
})

// 头像上传错误处理
const avatarError = () => {
  userInfo.avatar = defaultAvatar
}

// 重命名: 上传头像处理函数
const handleUploadAvatar = async (options: any) => {
  try {
    // Check if the file exists on the options object
    if (!options || !options.file) {
      ElMessage.error('未选择文件');
      return;
    }
    const fileToUpload: File = options.file; // Extract the file

    loading.avatar = true
    // Removed FormData creation
    // const formData = new FormData()
    // formData.append('file', options.file)
    
    // Corrected: Pass the File object directly
    const response = await uploadAvatar(fileToUpload)
    
    if (response?.code === 200 && response.data?.avatarUrl) {
      const newAvatarUrl = response.data.avatarUrl;
      userInfo.avatar = newAvatarUrl;
      userStore.setAvatar(newAvatarUrl);
      initialAvatar.value = newAvatarUrl;
      ElMessage.success('头像更新成功');
    } else {
      ElMessage.error(response?.message || '上传头像失败，未收到有效的头像URL');
    }
  } catch (error: any) {
    console.error('上传头像失败 (catch):', error);
    ElMessage.error(error.response?.data?.message || error.message || '上传头像失败');
  } finally {
    loading.avatar = false
  }
}

// 更新用户信息
const handleUpdateInfo = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.updateInfo = true
    
    const updateData = {
      email: userInfo.email
    };
    
    const response = await updateUserInfo(updateData)
    
    if (response?.code === 200) {
      userStore.updateUserEmailAction(userInfo.email);
      initialEmail.value = userInfo.email;
      ElMessage.success('个人信息更新成功');
    } else {
      ElMessage.error(response?.message || '更新个人信息失败');
    }
  } catch (error: any) {
    console.error('更新个人信息失败 (catch):', error);
    ElMessage.error(error.response?.data?.message || error.message || '更新个人信息失败');
  } finally {
    loading.updateInfo = false
  }
}

// 修改密码
const handleChangePassword = async () => {
  if (!passwordFormRef.value) return
  
  try {
    await passwordFormRef.value.validate()
    loading.password = true
    
    const response = await updatePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    
    if (response?.code === 200) {
      passwordDialogVisible.value = false
      passwordForm.oldPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
      ElMessage.success('密码修改成功')
    }
  } catch (error) {
    console.error('修改密码失败:', error)
    ElMessage.error('修改密码失败')
  } finally {
    loading.password = false
  }
}

// 确认退出登录
const confirmLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userStore.logout()
    router.push('/login')
  })
}

// 确认注销账户
const confirmDeactivate = () => {
  ElMessageBox.confirm('确定要注销账户吗？此操作不可恢复！', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'error'
  }).then(() => {
    // TODO: 实现注销账户逻辑
    ElMessage.success('账户已注销')
    userStore.logout()
    router.push('/login')
  })
}

// Dark mode state
const isDark = useDark()

// 初始化数据
onMounted(() => {
  if (userStore.username) {
    userInfo.username = userStore.username
    userInfo.email = userStore.userInfo?.email || localStorage.getItem('email') || ''
    userInfo.avatar = userStore.avatar || defaultAvatar
  }
  
  if (!userInfo.avatar) {
    userInfo.avatar = defaultAvatar
  }
})
</script>

<style scoped>
.profile-container {
  padding: 20px;
  min-height: calc(100vh - 84px);
  transition: background-color 0.3s;
}

.profile-card {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  transition: background-color 0.3s, border-color 0.3s, box-shadow 0.3s;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header span {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  transition: color 0.3s;
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
  color: #303133;
  transition: color 0.3s, border-color 0.3s;
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
  transition: color 0.3s;
}

.security-info {
  flex: 1;
}

.security-info h4 {
  margin: 0 0 5px 0;
  font-size: 16px;
  color: #303133;
  transition: color 0.3s;
}

.security-info p {
  margin: 0;
  color: #909399;
  font-size: 14px;
  transition: color 0.3s;
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

/* --- Dark Mode Styles --- */

.dark-component-bg {
  background-color: #1f2937 !important;
  border-color: var(--el-border-color-lighter) !important;
  box-shadow: var(--el-box-shadow-light) !important;
}

/* Container background */
:deep(.app-wrapper.dark) .profile-container {
   background-color: var(--el-bg-color-page);
}

/* Profile Card */
.profile-card.dark-component-bg .card-header span {
  color: #e0e0e0;
}

.profile-card.dark-component-bg :deep(.el-form-item__label) {
   color: #a0a0a0 !important;
}
.profile-card.dark-component-bg :deep(.el-input__wrapper) {
  background-color: var(--el-fill-color-blank) !important;
  box-shadow: none !important;
}
.profile-card.dark-component-bg :deep(.el-input__inner) {
   color: var(--el-text-color-primary) !important;
}
/* Style disabled input */
.profile-card.dark-component-bg :deep(.el-input.is-disabled .el-input__wrapper) {
   background-color: var(--el-disabled-bg-color) !important;
   cursor: not-allowed;
}
.profile-card.dark-component-bg :deep(.el-input.is-disabled .el-input__inner) {
   color: var(--el-disabled-text-color) !important;
   cursor: not-allowed;
}
/* Save button styling */
.profile-card.dark-component-bg :deep(.el-form-item .el-button) {
   background-color: var(--el-button-bg-color);
   color: var(--el-button-text-color);
   border-color: var(--el-button-border-color);
}
.profile-card.dark-component-bg :deep(.el-form-item .el-button:hover),
.profile-card.dark-component-bg :deep(.el-form-item .el-button:focus) {
   background-color: var(--el-button-hover-bg-color);
   color: var(--el-button-hover-text-color);
   border-color: var(--el-button-hover-border-color);
}

/* Security Section */
.profile-card.dark-component-bg .section-title {
  color: #e0e0e0;
  border-bottom-color: #4b5563;
}

.security-item.dark-component-bg {
  background-color: #263445 !important;
}

.security-item.dark-component-bg:hover {
  background-color: #374151 !important;
}

.dark-component-bg .security-icon {
  color: #66b1ff;
}

.dark-component-bg .security-info h4 {
  color: #e0e0e0;
}

.dark-component-bg .security-info p {
  color: #a0a0a0;
}

.dark-component-bg.danger .security-icon {
  color: #ff7875;
}

.dark-component-bg.danger:hover {
  background-color: #4d2d2d !important;
}

</style> 