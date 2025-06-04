<template>
  <div class="profile-settings-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>个人信息设置</span>
        </div>
      </template>

      <el-form 
        v-if="studentProfileData" 
        :model="profileForm" 
        :rules="profileRules" 
        ref="profileFormRef"
        label-width="100px"
        class="profile-form"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名:">
              <span>{{ studentProfileData.displayName }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学号:">
              <span>{{ studentProfileData.studentIdStr || 'N/A' }}</span> 
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
          <el-button type="primary" @click="handleSubmit" :loading="loading">保存更改</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-skeleton v-else :rows="5" animated />

    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, watch, computed } from 'vue';
import { useUserStore } from '@/stores/user';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { updateUserProfileDetails } from '@/api/user'; // 使用新的API函数
import type { StudentRelatedInfo, UserInfo } from '@/types/common'; // Import StudentRelatedInfo and UserInfo

const userStore = useUserStore();
const profileFormRef = ref<FormInstance>();
const loading = ref(false);

// New ref for profile data derived from userStore.userInfo
const studentProfileData = ref<{
  displayName: string;      // For display
  actualName: string;       // Actual name from studentInfo, could be same as displayName
  email: string | null;
  phone: string | null;
  studentIdStr: string | null; //学号
  avatar?: string | null;
} | null>(null);

const profileForm = reactive({
  email: '',
  phone: '',
  // display_name: '' // Add if you intend to make display_name editable
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
  if (userStore.userInfo) {
    const userInfo = userStore.userInfo;
    const displayName = userInfo.display_name || userInfo.username; // Fallback to username
    const studentId = userInfo.studentInfo?.studentIdStr || null;
    const actualNameFromStudentInfo = userInfo.studentInfo?.name || displayName;

    studentProfileData.value = {
      displayName: displayName,
      actualName: actualNameFromStudentInfo,
      email: userInfo.email || null,
      phone: userInfo.phone || null, // Assuming phone is part of UserInfo now
      studentIdStr: studentId,
      avatar: userInfo.avatar || null
    };

    profileForm.email = studentProfileData.value.email || '';
    profileForm.phone = studentProfileData.value.phone || '';
    // If display_name is editable:
    // profileForm.display_name = studentProfileData.value.displayName;

    console.log('[ProfileSettings] Populated studentProfileData:', studentProfileData.value);
    console.log('[ProfileSettings] Populated profileForm:', profileForm);
    // After populating, reset the changed state explicitly if form is pristine
    // This is more relevant if we directly compare objects, but good practice.

  } else {
    console.warn("[ProfileSettings] User store's userInfo is not yet available for profile page.");
    studentProfileData.value = null; // Reset if no user info
  }
};

onMounted(async () => {
  if (!userStore.userInfo) {
    try {
      console.log('[ProfileSettings] UserInfo not in store on mount, attempting to fetch...');
      await userStore.getUserInfoAction(); 
    } catch (error) {
      ElMessage.error('获取用户信息失败，请稍后重试');
      console.error("[ProfileSettings] Error fetching user info on profile page mount:", error);
      return;
    }
  }
  populateForm();
});

// Computed property to check if the form has changed
const isFormChanged = computed(() => {
  if (!studentProfileData.value) {
    return false; // No original data to compare against
  }
  // Compare current form values with original values loaded into studentProfileData
  const emailChanged = profileForm.email !== (studentProfileData.value.email || '');
  const phoneChanged = profileForm.phone !== (studentProfileData.value.phone || '');
  // Add other fields here if they become editable
  // const displayNameChanged = profileForm.display_name !== (studentProfileData.value.displayName || '');
  return emailChanged || phoneChanged; // || displayNameChanged;
});

// Watch for changes in userStore.userInfo
watch(() => userStore.userInfo, (newUserInfo) => {
  console.log('[ProfileSettings] Watched userStore.userInfo changed:', newUserInfo);
  populateForm();
}, { deep: true }); // Use deep watch if userInfo is a complex object

const handleSubmit = async () => {
  if (!profileFormRef.value) return;
  await profileFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        const dataToSubmit: { email?: string; phone?: string; display_name?: string } = {};

        let changed = false;
        if (profileForm.email !== (studentProfileData.value?.email || '')) {
          dataToSubmit.email = profileForm.email;
          changed = true;
        }
        if (profileForm.phone !== (studentProfileData.value?.phone || '')) {
          dataToSubmit.phone = profileForm.phone;
          changed = true;
        }
        
        // 如果将来允许修改 display_name，则取消以下注释
        // const currentDisplayName = studentProfileData.value?.displayName || userStore.userInfo?.username || '';
        // if (profileForm.display_name && profileForm.display_name !== currentDisplayName) {
        //   dataToSubmit.display_name = profileForm.display_name;
        //   changed = true;
        // }

        if (changed) {
          // 调用新的API函数
          const response = await updateUserProfileDetails(dataToSubmit);

          if (response.code === 200) {
            ElMessage.success('个人信息更新成功！');
            // 后端成功后，response.data 应该包含更新后的用户信息 (包括 UserInfo 和 studentInfo)
            // userStore 的 getUserInfoAction 内部会更新 userInfo.value
            await userStore.getUserInfoAction(); 
          } else {
            ElMessage.error(response.message || '更新失败，请稍后再试');
          }
        } else {
          ElMessage.info('信息未发生变化，无需保存。');
        }
      } catch (error: any) {
        console.error('更新个人信息失败:', error);
        ElMessage.error(error.response?.data?.message || error.message || '更新过程中发生错误');
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
  if (studentProfileData.value) {
    profileForm.email = studentProfileData.value.email || '';
    profileForm.phone = studentProfileData.value.phone || '';
    // if display_name is editable:
    // profileForm.display_name = studentProfileData.value.displayName;
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