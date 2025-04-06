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
import { updatePassword, uploadUserAvatar, updateUserInfo } from '@/api/user'
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
  email: userStore.userInfo?.email || localStorage.getItem('email') || '', 
  // Initialize avatar primarily from store (which reads localStorage initially)
  avatar: userStore.avatar || defaultAvatar 
})

// --- Add state for initial values to track changes ---
const initialEmail = ref('');
const initialAvatar = ref('');
// --- End initial values ---

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

// --- Computed property to check for changes ---
const hasChanges = computed(() => {
  const emailChanged = userInfo.email !== initialEmail.value;
  const avatarChanged = userInfo.avatar !== initialAvatar.value;
  // console.log(`[Computed hasChanges] Email changed: ${emailChanged}, Avatar changed: ${avatarChanged}`);
  return emailChanged || avatarChanged;
});
// --- End computed property ---

// 初始化数据
onMounted(() => {
  console.log('[Profile onMounted] Initializing...'); 
  // If user data exists in store, populate form
  if (userStore.username) {
    userInfo.username = userStore.username
    userInfo.email = userStore.userInfo?.email || localStorage.getItem('email') || '' 
    // Ensure avatar is synced with store or default
    userInfo.avatar = userStore.avatar || defaultAvatar;
  }
  // Ensure avatar is at least the default if sync fails
  if (!userInfo.avatar) {
    console.log('[Profile onMounted] Avatar still null/empty, setting to default.'); 
    userInfo.avatar = defaultAvatar;
  }

  // Store initial values after potential population
  initialEmail.value = userInfo.email;
  initialAvatar.value = userInfo.avatar;
  console.log('[Profile onMounted] Initial Email set to:', initialEmail.value);
  console.log('[Profile onMounted] Initial Avatar set to:', initialAvatar.value);
})

// 头像上传错误处理
const avatarError = () => {
  userInfo.avatar = defaultAvatar
  ElMessage.warning('头像加载失败，已使用默认头像')
}

// 上传头像
const uploadAvatar = async (options: any) => {
  const file = options.file
  console.log('准备上传头像:', file.name);

  // 检查文件类型和大小 (moved earlier)
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('请上传图片文件')
    return
  }
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过2MB')
    return
  }

  // 创建 FormData
  const formData = new FormData()
  formData.append('avatar', file) // Key must match backend upload.single('avatar')

  try {
    loading.avatar = true
    console.log('调用 uploadUserAvatar API...');
    // 调用新的后端 API 上传
    const res = await uploadUserAvatar(formData)
    console.log('上传 API 响应:', res);

    // Explicitly check based on observed AxiosResponse structure
    if (res?.status === 200 && res.data?.code === 200 && res.data?.data?.avatarUrl) {
      // Success Case: Extract URL from nested data
      const avatarUrl = res.data.data.avatarUrl;
      console.log('头像上传成功, URL:', avatarUrl);
      // 更新页面显示
      userInfo.avatar = avatarUrl
      
      // --- Update userStore with the new avatar URL ---
      userStore.setAvatar(avatarUrl); 
      // --- End update userStore ---

      ElMessage.success(res.data.message || '头像上传成功')
      // --- Update initialAvatar after successful upload ---
      initialAvatar.value = avatarUrl; 
      // --- End update initialAvatar ---
    } else {
      // Failure Case: Log the received structure and show error message
      console.error('头像上传失败，响应结构不符合预期:', res);
      // Try to get a meaningful error message
      const errMsg = res?.data?.message || res?.message || '头像上传失败，请稍后重试';
      ElMessage.error(errMsg) 
    }
  } catch (error: any) {
    console.error('上传头像 API 调用失败:', error)
    // Handle network errors or errors thrown by the interceptor
    const message = error.response?.data?.message || error.message || '上传失败，请检查网络或联系管理员'
    ElMessage.error(message)
  } finally {
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
      
      // Call the backend API to update email
      const res = await updateUserInfo({ email: userInfo.email });

      // Check API response
      // Handle potential full Axios response vs direct payload
      const responseData = res.data || res; 

      if (responseData?.code === 200) {
        console.log('邮箱更新 API 成功:', responseData);
        const updatedEmail = responseData.data?.email || userInfo.email; // Use email from response if available

        // Update localStorage (still useful as a fallback, but store should be primary source)
        localStorage.setItem('email', updatedEmail)
        
        // --- Update userStore with the new email --- 
        if (userStore.userInfo) {
          userStore.userInfo.email = updatedEmail; 
          console.log('userStore updated with new email:', updatedEmail);
          // Optionally, trigger an action if direct modification isn't ideal
          // userStore.setUserEmail(updatedEmail);
        } else {
          console.warn('userStore.userInfo is null, cannot update email in store.');
        }
        // --- End update userStore ---

        // --- Update initialEmail after successful save ---
        initialEmail.value = updatedEmail; 
        // --- End update initialEmail ---
        
        ElMessage.success(responseData.message || '个人信息更新成功')
      } else {
        // Handle API error
        console.error('邮箱更新 API 失败:', responseData);
        ElMessage.error(responseData?.message || '邮箱更新失败')
      }

    } catch (error: any) {
      console.error('更新用户信息失败 (catch block):', error)
      const message = error.response?.data?.message || error.message || '更新失败，请稍后重试'
      ElMessage.error(message)
    } finally {
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