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
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
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

<style lang="scss" scoped>
.profile-container {
  padding: 30px;
  background-color: var(--el-bg-color-page); /* Use variable for light mode */
  min-height: calc(100vh - 84px); /* Ensure full height minus header/nav */
  transition: background-color 0.3s ease; /* Smooth transition */

  .profile-card {
    max-width: 600px;
    margin: 20px auto;
  }

  .avatar-section {
    text-align: center;
    margin-bottom: 30px;

    .user-avatar {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      cursor: pointer;
      border: 2px solid var(--el-border-color);
      transition: border-color 0.3s;

      &:hover {
        border-color: var(--el-color-primary);
      }
    }

    .upload-tip {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-top: 10px;
    }
  }

  .info-section {
    .el-descriptions {
      margin-top: 20px;
    }

    .el-descriptions__label {
      font-weight: bold;
      width: 100px; // Adjust label width if needed
    }

  }

  .action-section {
    text-align: center;
    margin-top: 30px;
  }

  /* Hidden file input */
  .avatar-uploader-input {
    display: none;
  }
}

/* Dark mode specific overrides */
html.dark {
  .profile-container {
    .profile-card {
      background-color: #1f2937; /* Match container dark bg or slightly different */
      border-color: var(--el-border-color-darker);
    }

    .avatar-section .user-avatar {
      border-color: var(--el-border-color-darker);
       &:hover {
        border-color: var(--el-color-primary-light-3); /* Adjust hover color for dark */
      }
    }

    .info-section .el-descriptions {
       /* Element Plus dark variables should handle most description styles */
       /* Adjust if necessary, e.g., for border color */
       --el-descriptions-border-color: var(--el-border-color-darker);
    }
  }
}

.card-header {
  font-size: 18px;
  font-weight: bold;
  color: var(--el-text-color-primary);
}
.dark .card-header {
  color: #E0E0E0;
}

.profile-content {
  display: flex;
  gap: 40px;
  padding-bottom: 30px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: 30px;
}
.dark .profile-content {
  border-bottom-color: var(--el-border-color-darker);
}

.avatar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  flex-shrink: 0;
}

.upload-btn {
  margin-top: 10px;
}

.info-container {
  flex-grow: 1;
}

.dark .el-form-item__label {
  color: #C0C0C0;
}

.security-container {
  margin-top: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 20px;
  color: var(--el-text-color-primary);
}
.dark .section-title {
  color: #E0E0E0;
}

.security-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.security-item {
  display: flex;
  align-items: center;
  padding: 20px;
  border-radius: 8px;
  background-color: var(--el-fill-color-lighter);
  cursor: pointer;
  transition: background-color 0.3s, box-shadow 0.3s, border-color 0.3s;
  border: 1px solid var(--el-border-color-lighter);
}
.security-item:hover {
  box-shadow: var(--el-box-shadow-light);
  background-color: var(--el-color-primary-light-9);
}

.dark .security-item {
  background-color: rgba(255, 255, 255, 0.05);
  border-color: var(--el-border-color-darker);
}
.dark .security-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.security-icon {
  font-size: 24px;
  margin-right: 15px;
  color: var(--el-text-color-secondary);
}
.dark .security-icon {
  color: #A0A0A0;
}

.security-info h4 {
  margin: 0 0 5px 0;
  font-size: 15px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}
.dark .security-info h4 {
  color: #E0E0E0;
}

.security-info p {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.dark .security-info p {
  color: #A0A0A0;
}

.security-item .el-icon:last-child {
  margin-left: auto;
  color: var(--el-text-color-placeholder);
}
.dark .security-item .el-icon:last-child {
  color: #777;
}

.security-item.danger {
  border-left: 4px solid var(--el-color-danger);
}
.security-item.danger:hover {
  background-color: var(--el-color-danger-light-9);
}
.dark .security-item.danger {
   border-color: var(--el-color-danger);
}
.dark .security-item.danger:hover {
  background-color: rgba(245, 108, 108, 0.1);
}
.security-item.danger .security-icon,
.dark .security-item.danger .security-icon,
.dark .security-item.danger h4 {
  color: var(--el-color-danger);
}

/* Dialog Styles */
.dark :deep(.el-dialog) {
  background-color: #263445;
}
.dark :deep(.el-dialog__header) {
  color: #E0E0E0;
}
.dark :deep(.el-dialog__title) {
   color: #E0E0E0;
}
.dark :deep(.el-dialog__body) {
  color: var(--el-text-color-primary);
}

/* Remove specific dark-component-bg rules */

</style> 