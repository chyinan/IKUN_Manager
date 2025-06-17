import axios from 'axios'
import type {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosRequestConfig
} from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

// 创建axios实例
const service: AxiosInstance = axios.create({
  // 默认使用模拟数据，如果需要连接真实后端，请取消下面一行的注释并注释掉baseURL: ''
  baseURL: 'http://localhost:8081', // 已移除 /api
  //baseURL: '',
  timeout: 5000
})

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Show loading indicator (optional)
    // NProgress.start()

    console.log(`[Request Interceptor] Intercepting request to: ${config.url}`); // Log the URL

    // Get token from localStorage AT THE TIME OF THE REQUEST
    const token = localStorage.getItem('token') // Use the same key as in the user store
    console.log(`[Request Interceptor] Token read from localStorage: ${token ? 'Found (' + token.substring(0, 10) + '...)' : 'Not Found'}`); // Log if token was found

    // Ensure headers object exists
    config.headers = config.headers || {};

    // Add Authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[Request Interceptor] Authorization header ADDED.');
    } else {
        console.warn('[Request Interceptor] No token found in localStorage, Authorization header NOT ADDED.'); // Changed to warn
    }

    // Add other headers if needed
    // config.headers['Content-Type'] = 'application/json';

    return config
  },
  (error) => {
    console.error('[Request Interceptor] Error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    // Hide loading indicator (optional)
    // NProgress.done()

    const res = response.data // res should be our { code, message, data } structure

    // 特殊处理登录接口 /auth/login 和 /user/info，因为它们直接返回数据，而不是统一响应格式
    const requestUrl = response.config.url || '';
    if (requestUrl.includes('/auth/login')) {
      if (res && res.accessToken && res.tokenType) {
        console.log('[Response Interceptor] Login successful, returning raw token data:', res);
        return res; // Directly return the response data for the login API
      } else {
        console.error('[Response Interceptor] Login response format invalid:', res);
        ElMessage({ message: '登录响应格式无效', type: 'error', duration: 5 * 1000 });
        return Promise.reject(new Error('登录响应格式无效'));
      }
    }
    // Special handling for /user/info - REMOVED: Backend now returns standard ApiResponse for user info.
    // if (requestUrl.includes('/user/info')) {
    //   if (res && res.id && res.username) {
    //      console.log('[Response Interceptor] User info response detected, wrapping it in standard format.');
    //      // Manually wrap the response in the expected format for the store
    //      return {
    //        code: 200,
    //        message: '成功',
    //        data: res
    //      };
    //   }
    // }

    // Check if it's a blob response (e.g., file download) FIRST
    if (res instanceof Blob) {
      console.log('[Response Interceptor] Blob response detected, returning it directly.');
      return res;
    }

    // NEW: Generic wrapper for non-standard successful responses from Java backend - REMOVED: Backend now returns standard ApiResponse.
    // if (response.status === 200 && res.code === undefined) {
    //   console.log('[Response Interceptor] Non-standard success response detected, wrapping it.', res);
    //   return {
    //     code: 200,
    //     message: '成功',
    //     data: res
    //   };
    // }

    // Standard API response validation
    if (res.code !== 200) {
          // Business error case (e.g., code 400, 401, 403, 500 from backend API logic)
          console.warn(`[Response Interceptor] Business error code ${res.code}. Rejecting promise.`);
          let errorMessage = res.message || '未知后端业务错误';
          // Handle specific codes like 401 for logout prompt (keep existing logic)
          if (res.code === 401) {
             ElMessageBox.confirm(
               '您的登录已过期或无效，请重新登录。',
               '认证失败',
               {
                 confirmButtonText: '重新登录',
                 cancelButtonText: '取消',
                 type: 'warning',
               }
             ).then(() => {
               localStorage.removeItem('token');
               window.location.href = '/login';
             })
             // Return a rejected promise with the specific error for 401
             return Promise.reject(Object.assign(new Error(errorMessage), { code: res.code }));
          }
          // For other business errors, show message and reject
          ElMessage({ message: errorMessage, type: 'error', duration: 5 * 1000 });
          // Reject with an error object containing the code for potential handling
          return Promise.reject(Object.assign(new Error(errorMessage), { code: res.code }));
    }

    // IMPORTANT: If none of the above conditions are met, return the original response data.
    return res; // Keep this as the ultimate fallback for standard API responses
  },
  (error) => {
    // Hide loading indicator (optional)
    // NProgress.done()

    // 先行判断学生提交 404 场景，避免多余日志与弹窗
    if (error?.response?.status === 404 && (error.response.data?.message || '').includes('未找到该作业的提交记录')) {
        return Promise.reject(error);
    }

    console.error('[Response Interceptor] Network or other error:', error)
    let errorMessage = '网络错误或服务器无响应';
    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        // 针对学生未提交作业的特殊业务 404，不需要重复提示
        const bizMessage = error.response.data?.message || ''
        if (error.response.status === 404 && bizMessage.includes('未找到该作业的提交记录')) {
            // 让业务组件自行处理，不弹 Toast
            return Promise.reject(error)
        }

        console.error(' [Response Interceptor] Error Response Data:', error.response.data);
        console.error(' [Response Interceptor] Error Response Status:', error.response.status);
        console.error(' [Response Interceptor] Error Response Headers:', error.response.headers);

        // **处理 Token 过期或无效**
        // The interceptor's job is to report the error, not handle application logic.
        // The caller (e.g., router guard's getInfo call) will catch this and decide to logout.
        if (error.response.status === 401 || error.response.status === 403) {
            console.warn('[Response Interceptor] HTTP 401/403 detected. Rejecting promise for caller to handle.');
            // Do NOT handle logout here. Just pass the error along.
        }

        // 显示通用错误消息 (如果不是 Token 问题)
        errorMessage = error.response.data?.message || `请求失败，状态码：${error.response.status}`;
        ElMessage.error(errorMessage);

    } else if (error.request) {
        // The request was made but no response was received
        console.error(' [Response Interceptor] No response received:', error.request);
        errorMessage = '无法连接到服务器，请检查网络连接';
        ElMessage.error(errorMessage);
    } else {
        // Something happened in setting up the request that triggered an Error
        console.error(' [Response Interceptor] Request setup error:', error.message);
        errorMessage = error.message || '请求发送失败';
        ElMessage.error(errorMessage);
    }

    // Reject with the original Axios error object for more context
    return Promise.reject(error);
  }
)

// 创建模拟数据对象 (如果不需要模拟数据，可以移除整个 mockData 对象)
const mockData: Record<string, any> = {
  // 班级相关
  'class/list': Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    className: `${['计算机科学', '软件工程', '数据科学', '人工智能', '网络安全'][i]}${i + 1}班`,
    teacher: `${['张', '李', '王', '赵', '钱'][i]}老师`,
    studentCount: Math.floor(Math.random() * 30) + 20,
    createTime: '2023-01-01'
  })),
  'class/options': Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    className: `${['计算机科学', '软件工程', '数据科学', '人工智能', '网络安全'][i]}${i + 1}班`
  })),

  // 学生相关
  'student/list': Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    studentId: `S2023${String(i + 1).padStart(3, '0')}`,
    name: `学生${i + 1}`,
    gender: i % 2 === 0 ? '男' : '女',
    classId: (i % 2) + 1,
    className: `班级${(i % 2) + 1}`,
    phone: `1380000${String(i).padStart(4, '0')}`,
    email: `student${i + 1}@example.com`,
    joinDate: '2023-09-01',
    createTime: '2023-09-01 10:00:00'
  })),
  'student/add': (data: any) => ({ ...data, id: Date.now() }),
  'student/update': (data: any) => ({ ...data }),
  'student/delete': () => true,
  'student/batch': () => true,
  'student/generateId': () => `S${Date.now()}`,
  'student/import': () => ({ success: true, message: '导入成功' }),
  'student/export': () => new Blob(['mock excel data'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),

  // 部门相关 (如果后端提供，这里可能不需要模拟)
  'dept/list': [
    { id: 1, deptName: '技术部', manager: '张三', description: '负责公司技术研发工作', createTime: '2023-01-01' },
    { id: 2, deptName: '市场部', manager: '李四', description: '负责市场营销和推广', createTime: '2023-01-01' }
  ],

  // 考试相关
  'exam/list': Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    examName: `模拟考试${i + 1}`,
    examType: i % 2 === 0 ? '月考' : '期中',
    examDate: `2024-0${Math.floor(i / 2) + 1}-15 09:00:00`,
    duration: 120,
    subjects: '语文,数学,英语',
    status: i % 3, // 0:未开始, 1:进行中, 2:已结束
    remark: `这是模拟考试${i + 1}的备注`,
    createTime: '2024-01-01 10:00:00'
  })),
  'exam/add': (data: any) => ({ ...data, id: Date.now() }),
  'exam/update': (data: any) => ({ ...data }),
  'exam/delete': () => true,
  'exam/batch': () => true,
  'exam/classes': [1, 2], // 模拟考试关联的班级ID

  // 科目相关
  'subject/list': [
    { id: 1, subjectName: '语文', subjectCode: 'CHINESE', createTime: '2023-01-01' },
    { id: 2, subjectName: '数学', subjectCode: 'MATH', createTime: '2023-01-01' },
    { id: 3, subjectName: '英语', subjectCode: 'ENGLISH', createTime: '2023-01-01' },
    { id: 4, subjectName: '物理', subjectCode: 'PHYSICS', createTime: '2023-01-01' },
    { id: 5, subjectName: '化学', subjectCode: 'CHEMISTRY', createTime: '2023-01-01' },
    { id: 6, subjectName: '生物', subjectCode: 'BIOLOGY', createTime: '2023-01-01' }
  ],
  'subject/add': (data: any) => ({ ...data, id: Date.now() }),
  'subject/update': (data: any) => ({ ...data }),
  'subject/delete': () => true,

  // 日志相关 (如果后端提供，这里可能不需要模拟)
  'log/list': {
    list: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      type: ['system', 'database', 'auth', 'error'][i % 4],
      operation: ['登录成功', '查询数据', '更新记录', '删除失败'][i % 4],
      content: `这是一条模拟日志内容 ${i + 1}`,
      operator: i % 2 === 0 ? 'admin' : 'User:123',
      createTime: `2024-06-14 10:${String(i).padStart(2, '0')}:00`
    })),
    total: 100,
    pageNum: 1,
    pageSize: 20
  },
  'log/batchDelete': () => true,
  'log/clear': () => true,
  'log/export': () => new Blob(['mock log export data'], { type: 'text/csv' }),
  'log/add': () => true,

  // 员工统计数据
  'employee/stats': {
    totalEmployees: 100,
    activeEmployees: 80,
    departmentsCount: 5,
    employeesByGender: { male: 50, female: 50 },
    employeesByPosition: { '开发工程师': 30, '产品经理': 20, '销售经理': 25, '市场专员': 25 }
  }
};


// 默认导出 axios 实例
export default service;