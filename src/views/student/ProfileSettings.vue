<template>
  <div class="profile-settings-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>个人信息设置</span>
        </div>
      </template>

      <el-form 
        v-if="studentInfo" 
        :model="profileForm" 
        :rules="profileRules" 
        ref="profileFormRef"
        label-width="100px"
        class="profile-form"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名:">
              <span>{{ studentInfo.username }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学号:">
              <!-- Assuming student ID is part of userStore or fetched separately for students -->
              <span>{{ studentInfo.studentId || 'N/A' }}</span> 
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
        
        <el-form-item style="margin-top: 20px;">
          <el-button type="primary" @click="handleSubmit" :loading="loading">保存更改</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-skeleton v-else :rows="5" animated />

    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, watch } from 'vue';
import { useUserStore } from '@/stores/user';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
// import { updateUserProfile } from '@/api/user'; // Assuming an API function to update profile

const userStore = useUserStore();
const profileFormRef = ref<FormInstance>();
const loading = ref(false);

// Define studentInfo structure, expecting it from userStore or similar
// For now, we'll map from userStore's general info
const studentInfo = ref<{
  username: string;
  email: string | null;
  phone: string | null;
  studentId?: string; // Assuming studentId might be available for students
  avatar?: string;
} | null>(null);

const profileForm = reactive({
  email: '',
  phone: ''
});

const profileRules = reactive<FormRules>({
  email: [
    { type: 'email', message: '请输入有效的邮箱地址', trigger: ['blur', 'change'] },
  ],
  phone: [
    // Basic phone validation (can be enhanced with regex from your utils/validate.ts)
    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的中国大陆手机号码', trigger: ['blur', 'change'] }
  ]
});

const populateForm = () => {
  if (userStore.username) {
    studentInfo.value = {
      username: userStore.username,
      email: userStore.email, // Assuming email is available in userStore
      phone: userStore.phone, // Assuming phone is available in userStore
      studentId: userStore.studentId, // Assuming studentId is available in userStore for students
      avatar: userStore.avatar
    };
    profileForm.email = studentInfo.value.email || '';
    profileForm.phone = studentInfo.value.phone || '';
  } else {
    // Handle case where userStore might not be fully populated yet
    // This could happen on direct navigation or refresh if getUserInfo is still pending
    console.warn("User store data not yet available for profile page.");
  }
};

onMounted(async () => {
  // Ensure user info is loaded. If not, the store should ideally fetch it.
  // The main navigation guard usually handles this, but a local check can be a fallback.
  if (!userStore.username) {
    try {
      await userStore.getUserInfo(); // Attempt to fetch if not already loaded
    } catch (error) {
      ElMessage.error('获取用户信息失败，请稍后重试');
      console.error("Error fetching user info on profile page mount:", error);
      return;
    }
  }
  populateForm();
});

// Watch for changes in userStore if it loads asynchronously after mount
watch(() => [userStore.username, userStore.email, userStore.phone, userStore.studentId], () => {
  populateForm();
});

const handleSubmit = async () => {
  if (!profileFormRef.value) return;
  await profileFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        // const updatedData = { ...profileForm };
        // const response = await updateUserProfile(userStore.userId, updatedData); // Pass userId and data
        // if (response.code === 200) {
        //   ElMessage.success('个人信息更新成功！');
        //   // Refresh user store with new data
        //   await userStore.getUserInfo(); 
        // } else {
        //   ElMessage.error(response.message || '更新失败，请稍后再试');
        // }
        ElMessage.info('后端更新接口暂未实现，此为模拟成功。');
        // Simulate update in store for UI feedback
        userStore.email = profileForm.email;
        userStore.phone = profileForm.phone;
        populateForm(); // Re-populate form with (simulated) new data

      } catch (error: any) {
        console.error('更新个人信息失败:', error);
        ElMessage.error(error.message || '更新过程中发生错误');
      } finally {
        loading.value = false;
      }
    } else {
      ElMessage.error('请检查表单输入是否正确');
      return false;
    }
  });
};

const handleReset = () => {
  if (studentInfo.value) {
    profileForm.email = studentInfo.value.email || '';
    profileForm.phone = studentInfo.value.phone || '';
    profileFormRef.value?.clearValidate();
  }
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