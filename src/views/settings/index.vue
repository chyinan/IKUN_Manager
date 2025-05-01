<template>
  <div class="settings-container">
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <span>系统设置 - 验证规则</span>
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
          <el-button @click="resetForm" :disabled="!isChanged">重置</el-button>
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

// 表单引用
const formRef = ref<FormInstance>()

// 加载状态
const loading = ref(false)

// 表单数据
const regexForm = reactive({
  studentIdRegex: '',
  employeeIdRegex: '',
  logRetentionDays: 0
})

// 初始数据，用于比较是否更改
const initialForm = reactive({
  studentIdRegex: '',
  employeeIdRegex: '',
  logRetentionDays: 0
})

// 计算表单是否已更改
const isChanged = computed(() => {
  return regexForm.studentIdRegex !== initialForm.studentIdRegex || 
         regexForm.employeeIdRegex !== initialForm.employeeIdRegex ||
         regexForm.logRetentionDays !== initialForm.logRetentionDays;
})

// 获取当前设置
const fetchSettings = async () => {
  loading.value = true;
  try {
    const response = await getRegexConfig();
    if (response.code === 200 && response.data) {
      regexForm.studentIdRegex = response.data.studentIdRegex || '';
      regexForm.employeeIdRegex = response.data.employeeIdRegex || '';
      regexForm.logRetentionDays = response.data.logRetentionDays || 0;
      // 保存初始值
      initialForm.studentIdRegex = regexForm.studentIdRegex;
      initialForm.employeeIdRegex = regexForm.employeeIdRegex;
      initialForm.logRetentionDays = regexForm.logRetentionDays;
    } else {
      ElMessage.error(response.message || '获取设置失败');
    }
  } catch (error: any) {
    console.error('获取设置失败:', error);
    ElMessage.error(error.message || '获取设置时发生错误');
  } finally {
    loading.value = false;
  }
}

// 保存设置
const handleSaveSettings = async () => {
  if (!formRef.value) return;

  // 可选：添加正则表达式格式校验
  try {
    new RegExp(regexForm.studentIdRegex);
    new RegExp(regexForm.employeeIdRegex);
  } catch (e) {
    ElMessage.error('输入的正则表达式格式无效，请检查。');
    return;
  }
  
  loading.value = true;
  try {
    const response = await updateRegexConfig({
      studentIdRegex: regexForm.studentIdRegex,
      employeeIdRegex: regexForm.employeeIdRegex,
      logRetentionDays: regexForm.logRetentionDays
    });
    if (response.code === 200) {
      ElMessage.success('设置保存成功');
      // 更新初始值
      initialForm.studentIdRegex = regexForm.studentIdRegex;
      initialForm.employeeIdRegex = regexForm.employeeIdRegex;
      initialForm.logRetentionDays = regexForm.logRetentionDays;
      // 重新加载配置到服务（理想情况下后端应该通知前端或有其他机制）
      // 或者提示用户可能需要刷新或重新启动服务使更改完全生效
      ElMessageBox.alert('部分验证规则可能需要重新加载页面或重启服务后才能完全生效。', '提示', { type: 'info' });
    } else {
      ElMessage.error(response.message || '保存设置失败');
    }
  } catch (error: any) {
    console.error('保存设置失败:', error);
    ElMessage.error(error.message || '保存设置时发生错误');
  } finally {
    loading.value = false;
  }
}

// 重置表单
const resetForm = () => {
  regexForm.studentIdRegex = initialForm.studentIdRegex;
  regexForm.employeeIdRegex = initialForm.employeeIdRegex;
  regexForm.logRetentionDays = initialForm.logRetentionDays;
}

// 组件挂载时获取设置
onMounted(() => {
  fetchSettings();
})

</script>

<style lang="scss" scoped>
.settings-container {
  padding: 30px;
  background-color: var(--el-bg-color-page); /* Use variable for light mode */
  min-height: calc(100vh - 84px); /* Ensure full height minus header/nav */
  transition: background-color 0.3s ease; /* Smooth transition */
}

.settings-title {
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 20px;
  color: var(--el-text-color-primary);
}

.settings-card {
  margin-bottom: 20px;
}

.card-header {
  font-size: 16px;
  font-weight: bold;
}

.setting-item {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.setting-label {
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.setting-description {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 5px;
}

.regex-input {
  width: 250px; /* Adjust as needed */
}

.action-buttons {
  margin-top: 20px;
  text-align: right;
}

/* Dark Mode Adjustments */
.dark .settings-container {
  /* background-color handled globally */
}

.dark .settings-title {
  color: #E0E0E0;
}

.dark .setting-label {
  color: #C0C0C0;
}

.dark .setting-description {
  color: #A0A0A0;
}

/* Ensure card header, input, switch styles are handled by Element Plus dark theme */

</style> 