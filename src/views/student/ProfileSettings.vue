<template>
  <div class="profile-settings-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>个人信息设置</span>
        </div>
      </template>

      <el-form 
        v-if="userStore.userInfo"
        :model="profileForm" 
        :rules="profileRules" 
        ref="profileFormRef"
        label-width="100px"
        class="profile-form"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名:">
              <span>{{ userStore.userInfo.display_name || userStore.userInfo.username }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学号:">
              <span>{{ userStore.userInfo.studentInfo?.studentIdStr || 'N/A' }}</span> 
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
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
        
        <el-form-item style="margin-top: 20px;" v-if="isFormChanged">
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading">保存更改</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-skeleton v-else :rows="5" animated />

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
    await userStore.getUserInfo();
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
          await userStore.getUserInfo(); // Re-fetch to ensure store is synced
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
  padding: 0; // Main padding is handled by StudentLayout
}

.card-header span {
  font-weight: bold;
  font-size: 18px;
}

.profile-form {
  margin-top: 20px;
  max-width: 700px; // Limit form width for better readability
}

// Add some spacing for form items if needed
.el-form-item {
  margin-bottom: 22px;
}
</style> 