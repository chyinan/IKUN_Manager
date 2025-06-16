<template>
  <div class="settings-container">
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <span>系统设置 - 验证规则与日志</span>
        </div>
      </template>
      
      <el-form ref="formRef" :model="regexForm" label-position="top">
        <el-form-item label="学号验证正则表达式" prop="studentIdRegex">
          <el-input 
            v-model="regexForm.studentIdRegex" 
            placeholder="例如: ^S\\d{8}$ (S开头+8位数字)"
            clearable
           />
           <div class="regex-tip">用于验证学生管理中输入的学号格式。</div>
        </el-form-item>
        
        <el-form-item label="员工号验证正则表达式" prop="employeeIdRegex">
          <el-input 
            v-model="regexForm.employeeIdRegex" 
            placeholder="例如: ^E\\d{5}$ (E开头+5位数字)"
            clearable
           />
           <div class="regex-tip">用于验证员工管理中输入的工号格式。</div>
        </el-form-item>

        <el-form-item label="日志保留天数" prop="logRetentionDays">
          <el-input-number
            v-model="regexForm.logRetentionDays"
            :min="0"
            :max="365"
            controls-position="right"
            placeholder="输入保留天数"
            style="width: 220px;"
          />
          <div class="regex-tip">系统将自动删除超过此天数的旧日志 (0 或空表示不自动删除)。</div>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            @click="handleSaveSettings" 
            :loading="loading"
            :disabled="!isChanged"
          >
            保存设置
          </el-button>
          <el-button @click="resetFormButton" :disabled="!isChanged">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getRegexConfig, updateRegexConfig } from '@/api/config'
import type { FormInstance } from 'element-plus'

const formRef = ref<FormInstance>()
const loading = ref(false)

const regexForm = reactive({
  studentIdRegex: '',
  employeeIdRegex: '',
  logRetentionDays: 0
})

const initialForm = reactive({
  studentIdRegex: '',
  employeeIdRegex: '',
  logRetentionDays: 0
})

const isChanged = computed(() => {
  return regexForm.studentIdRegex !== initialForm.studentIdRegex || 
         regexForm.employeeIdRegex !== initialForm.employeeIdRegex ||
         regexForm.logRetentionDays !== initialForm.logRetentionDays;
})

const fetchSettings = async () => {
  loading.value = true;
  try {
    const response = await getRegexConfig();
    if (response.code === 200 && response.data) {
      regexForm.studentIdRegex = response.data.studentIdRegex || '';
      regexForm.employeeIdRegex = response.data.employeeIdRegex || '';
      regexForm.logRetentionDays = Number(response.data.logRetentionDays || 0);
      
      initialForm.studentIdRegex = regexForm.studentIdRegex;
      initialForm.employeeIdRegex = regexForm.employeeIdRegex;
      initialForm.logRetentionDays = regexForm.logRetentionDays;
    } else {
      ElMessage.error(response.message || '获取设置失败');
    }
  } catch (error: any) {
    console.error('获取设置失败:', error);
    ElMessage.error(error?.response?.data?.message || error?.message || '获取设置时发生错误');
  } finally {
    loading.value = false;
  }
}

const handleSaveSettings = async () => {
  if (!formRef.value) return;

  try {
    if(regexForm.studentIdRegex) new RegExp(regexForm.studentIdRegex);
    if(regexForm.employeeIdRegex) new RegExp(regexForm.employeeIdRegex);
  } catch (e) {
    ElMessage.error('输入的正则表达式格式无效，请检查。');
    return;
  }
  
  loading.value = true;
  try {
    const response = await updateRegexConfig({
      studentIdRegex: regexForm.studentIdRegex,
      employeeIdRegex: regexForm.employeeIdRegex,
      logRetentionDays: Number(regexForm.logRetentionDays)
    });
    if (response.code === 200) {
      ElMessage.success('设置保存成功');
      initialForm.studentIdRegex = regexForm.studentIdRegex;
      initialForm.employeeIdRegex = regexForm.employeeIdRegex;
      initialForm.logRetentionDays = regexForm.logRetentionDays;
      ElMessageBox.alert('部分验证规则和日志设置可能需要重新加载页面或应用程序特定部分才能完全生效。', '提示', { type: 'info' });
    } else {
      ElMessage.error(response.message || '保存设置失败');
    }
  } catch (error: any) {
    console.error('保存设置失败:', error);
    ElMessage.error(error?.response?.data?.message || error?.message || '保存设置时发生错误');
  } finally {
    loading.value = false;
  }
}

const resetFormButton = () => {
  regexForm.studentIdRegex = initialForm.studentIdRegex;
  regexForm.employeeIdRegex = initialForm.employeeIdRegex;
  regexForm.logRetentionDays = initialForm.logRetentionDays;
  formRef.value?.clearValidate(); // Clear validation messages if any
}

onMounted(() => {
  fetchSettings();
})

</script>

<style lang="scss" scoped>
.settings-container {
  padding: 20px; // Consistent padding
}

.settings-card {
  margin-bottom: 20px;
}

.card-header {
  font-size: 16px;
  font-weight: bold;
}

.regex-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

// Removed redundant styles, assuming Element Plus handles dark mode for form elements
// and global styles handle page background and text colors.
</style> 