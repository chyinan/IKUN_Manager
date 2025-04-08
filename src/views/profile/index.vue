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

// 上传头像
const uploadAvatar = async (options: any) => {
  try {
    loading.avatar = true
    const formData = new FormData()
    formData.append('file', options.file)
    
    const response = await uploadUserAvatar(formData)
    
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