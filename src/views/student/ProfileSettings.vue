<template>
  <div class="profile-settings-container">
    <el-card shadow="never" class="page-main-card">
      <template #header>
        <div class="card-header">
          <span>个人信息设置</span>
        </div>
      </template>

      <el-card shadow="never" class="glass-card form-wrapper">
        <el-form 
          v-if="userStore.userInfo"
          :model="profileForm" 
          :rules="profileRules" 
          ref="profileFormRef"
          label-width="100px"
          class="profile-form"
        >
          <el-row :gutter="40">
            <el-col :span="12">
              <el-form-item label="姓名:">
                <span class="info-text">{{ userStore.userInfo.displayName || userStore.userInfo.username }}</span>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="学号:">
                <span class="info-text">{{ userStore.userInfo.studentInfo?.student_id_str || 'N/A' }}</span> 
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="40">
            <el-col :span="12">
              <el-form-item label="邮箱地址:" prop="email">
                <el-input v-model="profileForm.email" placeholder="请输入邮箱地址" clearable />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="手机号码:" prop="phone">
                <el-input v-model="profileForm.phone" placeholder="请输入手机号码" clearable />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item style="margin-top: 20px; padding-left: 10px;" v-if="isFormChanged">
            <el-button type="primary" @click="handleSubmit" :loading="submitLoading">保存更改</el-button>
            <el-button @click="handleReset" class="reset-button">重置</el-button>
          </el-form-item>
        </el-form>

        <el-skeleton v-else :rows="5" animated />
      </el-card>

    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed, watch } from 'vue';
import { useUserStore } from '@/stores/user';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { updateUserProfile } from '@/api/user';
import type { UserInfo } from '@/types/common';

const userStore = useUserStore();
const profileFormRef = ref<FormInstance>();
const submitLoading = ref(false);

const profileForm = reactive({
  email: '',
  phone: '',
});

const profileRules = reactive<FormRules>({
  email: [
    { type: 'email', message: '请输入有效的邮箱地址', trigger: ['blur', 'change'] },
  ],
  phone: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的中国大陆手机号码', trigger: ['blur', 'change'] }
  ]
});

const populateFormFromStore = () => {
  if (userStore.userInfo) {
    profileForm.email = userStore.userInfo.email || '';
    profileForm.phone = userStore.userInfo.phone || '';
  }
};

onMounted(async () => {
  // If userInfo is not available, fetch it. The watcher will populate the form.
  if (!userStore.userInfo) {
    await userStore.getUserInfoAction();
  } else {
    populateFormFromStore();
  }
});

// Computed property to check if the form has changed
const isFormChanged = computed(() => {
  if (!userStore.userInfo) {
    return false;
  }
  const emailChanged = profileForm.email !== (userStore.userInfo.email || '');
  const phoneChanged = profileForm.phone !== (userStore.userInfo.phone || '');
  return emailChanged || phoneChanged;
});

// Watch for changes in userStore.userInfo to populate the form when it becomes available
watch(() => userStore.userInfo, (newUserInfo) => {
  if (newUserInfo) {
    populateFormFromStore();
  }
}, { deep: true, immediate: true });


const handleSubmit = async () => {
  if (!profileFormRef.value) return;
  
  await profileFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitLoading.value = true;
      try {
        const res = await updateUserProfile({
          email: profileForm.email,
          phone: profileForm.phone,
        });

        if (res.code === 200) {
          ElMessage.success('个人信息更新成功');
          // Update user store with new info returned from the API
          await userStore.getUserInfoAction(); // Re-fetch to ensure store is synced
        } else {
          ElMessage.error(res.message || '更新失败');
        }
      } catch (error: any) {
        ElMessage.error(error.message || '更新时发生错误');
      } finally {
        submitLoading.value = false;
      }
    }
  });
};

const handleReset = () => {
  populateFormFromStore();
  profileFormRef.value?.clearValidate();
};
</script>

<style scoped lang="scss">
.profile-settings-container {
  padding: 0; 
}

.page-main-card {
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;

  :deep(.el-card__header) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    padding-bottom: 20px;
    .card-header span {
      font-weight: bold;
      font-size: 1.5rem;
      color: #fff;
      text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
    }
  }
}



.form-wrapper.glass-card {
  padding: 30px;
  max-width: 900px;
  margin: 0 auto;
  background-color: rgb(69 66 89 / 4%);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);

  :deep(.el-card__body) {
    padding: 0;
  }
}

.profile-form {
  .info-text {
    color: #fff;
    font-size: 1rem;
    font-weight: 500;
  }

  :deep(.el-form-item__label) {
    color: #e5e7eb; // A slightly softer white for labels
    font-weight: 500;
    font-size: 1rem;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
  }

  :deep(.el-input__wrapper) {
    background: rgba(0, 0, 0, 0.2) !important;
    box-shadow: none !important;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.25) !important;
    
    &.is-focused {
      border-color: #81d4fa !important; // A light blue focus color
      background: rgba(0, 0, 0, 0.25) !important;
    }
  }
  :deep(.el-input__inner) {
    color: #fff !important;
  }
  :deep(.el-input .el-input__clear .el-icon) {
    color: rgba(255, 255, 255, 0.7);
  }
}

.reset-button {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  color: #fff;
  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.4);
  }
}

:deep(.el-button--primary) {
  --el-button-bg-color: rgba(64, 158, 255, 0.7);
  --el-button-border-color: rgba(64, 158, 255, 0.5);
  --el-button-hover-bg-color: rgba(64, 158, 255, 0.9);
  --el-button-hover-border-color: rgba(64, 158, 255, 0.7);
}

:deep(.el-skeleton) {
  --el-skeleton-color: rgba(255, 255, 255, 0.1);
  --el-skeleton-to-color: rgba(255, 255, 255, 0.25);
}
</style> 