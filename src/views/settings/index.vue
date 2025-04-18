<template>
  <div class="settings-container">
    <el-card class="settings-card" :class="{ 'dark-component-bg': isDark }">
      <template #header>
        <div class="card-header">
          <span>系统设置 - 验证规则</span>
        </div>
      </template>
      
      <el-form ref="formRef" :model="regexForm" label-position="top">
        <el-form-item label="学号验证正则表达式" prop="studentIdRegex">
          <el-input 
            v-model="regexForm.studentIdRegex" 
            placeholder="例如: ^S\d{8}$ (S开头+8位数字)"
            clearable
           />
           <div class="regex-tip">用于验证学生管理中输入的学号格式。</div>
        </el-form-item>
        
        <el-form-item label="员工号验证正则表达式" prop="employeeIdRegex">
          <el-input 
            v-model="regexForm.employeeIdRegex" 
            placeholder="例如: ^E\d{5}$ (E开头+5位数字)"
            clearable
           />
           <div class="regex-tip">用于验证员工管理中输入的工号格式。</div>
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
import { useDark } from '@vueuse/core'
import { getRegexConfig, updateRegexConfig } from '@/api/config'
import type { FormInstance } from 'element-plus'

// 暗黑模式
const isDark = useDark()

// 表单引用
const formRef = ref<FormInstance>()

// 加载状态
const loading = ref(false)

// 表单数据
const regexForm = reactive({
  studentIdRegex: '',
  employeeIdRegex: ''
})

// 初始数据，用于比较是否更改
const initialForm = reactive({
  studentIdRegex: '',
  employeeIdRegex: ''
})

// 计算表单是否已更改
const isChanged = computed(() => {
  return regexForm.studentIdRegex !== initialForm.studentIdRegex || 
         regexForm.employeeIdRegex !== initialForm.employeeIdRegex;
})

// 获取当前设置
const fetchSettings = async () => {
  loading.value = true;
  try {
    const response = await getRegexConfig();
    if (response.code === 200 && response.data) {
      regexForm.studentIdRegex = response.data.studentIdRegex || '';
      regexForm.employeeIdRegex = response.data.employeeIdRegex || '';
      // 保存初始值
      initialForm.studentIdRegex = regexForm.studentIdRegex;
      initialForm.employeeIdRegex = regexForm.employeeIdRegex;
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
      employeeIdRegex: regexForm.employeeIdRegex
    });
    if (response.code === 200) {
      ElMessage.success('设置保存成功');
      // 更新初始值
      initialForm.studentIdRegex = regexForm.studentIdRegex;
      initialForm.employeeIdRegex = regexForm.employeeIdRegex;
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
}

// 组件挂载时获取设置
onMounted(() => {
  fetchSettings();
})

</script>

<style scoped>
.settings-container {
  padding: 20px;
  min-height: calc(100vh - 84px);
  transition: background-color 0.3s;
}

.settings-card {
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

.regex-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

/* --- Dark Mode Styles --- */
.dark-component-bg {
  background-color: #1f2937 !important;
  border-color: var(--el-border-color-lighter) !important;
  box-shadow: var(--el-box-shadow-light) !important;
}

:deep(.app-wrapper.dark) .settings-container {
   background-color: var(--el-bg-color-page);
}

.settings-card.dark-component-bg .card-header span {
  color: #e0e0e0;
}

.settings-card.dark-component-bg :deep(.el-form-item__label) {
   color: #a0a0a0 !important;
}

.settings-card.dark-component-bg :deep(.el-input__wrapper) {
  background-color: var(--el-fill-color-blank) !important;
  box-shadow: var(--el-input-box-shadow, 0 0 0 1px rgba(75, 85, 99, 0.5)) !important; /* 使用修正后的边框 */
  border: none !important;
}

.settings-card.dark-component-bg :deep(.el-input__inner) {
   color: var(--el-text-color-primary) !important;
}

.settings-card.dark-component-bg .regex-tip {
  color: #737373;
}

</style> 