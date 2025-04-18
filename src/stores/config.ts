import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getRegexConfig } from '@/api/config'

export const useConfigStore = defineStore('config', () => {
  // State
  const studentIdRegex = ref<string>(''); // 默认值
  const employeeIdRegex = ref<string>(''); // 默认值
  const isLoaded = ref<boolean>(false);
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  // Getters (可以直接使用 .value 访问 ref)

  // Actions
  async function fetchAndSetConfig() {
    if (isLoading.value || isLoaded.value) return; // 防止重复加载

    console.log('[ConfigStore] Fetching regex config...');
    isLoading.value = true;
    error.value = null;
    try {
      const response = await getRegexConfig();
      if (response.code === 200 && response.data) {
        studentIdRegex.value = response.data.studentIdRegex || '^S\\d{8}$'; // Fallback
        employeeIdRegex.value = response.data.employeeIdRegex || '^E\\d{5}$'; // Fallback
        isLoaded.value = true;
        console.log('[ConfigStore] Regex config loaded:', { student: studentIdRegex.value, employee: employeeIdRegex.value });
      } else {
        console.error('[ConfigStore] Failed to fetch config:', response.message);
        error.value = response.message || '获取配置失败';
        // Use default fallbacks if fetch fails
        studentIdRegex.value = '^S\\d{8}$'; 
        employeeIdRegex.value = '^E\\d{5}$';
      }
    } catch (err: any) {
      console.error('[ConfigStore] Error fetching config:', err);
      error.value = err.message || '加载配置时发生网络错误';
      // Use default fallbacks on error
      studentIdRegex.value = '^S\\d{8}$'; 
      employeeIdRegex.value = '^E\\d{5}$';
    } finally {
      isLoading.value = false;
    }
  }

  return {
    studentIdRegex,
    employeeIdRegex,
    isLoaded,
    isLoading,
    error,
    fetchAndSetConfig
  }
}) 