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
  baseURL: 'http://localhost:3000/api',
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
    
    // Check if it's a blob response (e.g., file download) FIRST
    if (response.request?.responseType === 'blob') {
      // For blob responses, return the raw AxiosResponse data directly
      // because the caller (e.g., export function) needs the Blob object.
      console.log('[Response Interceptor] Blob response detected. Returning response.data.');
      return response.data; // Return the Blob directly
    }

    // For regular JSON responses, check the business code inside res
    // Check if 'res' itself is valid and has a 'code' property
    if (res && typeof res === 'object' && res.hasOwnProperty('code')) {
        if (res.code === 200 || res.code === 201) {
          // Success case: Return the business data directly
          console.log(`[Response Interceptor] Success code ${res.code}. Returning res (response.data):`, res);
          return res; // <-- CORRECTED: Return the business response data
        } else {
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
    } else {
        // Handle cases where response.data is not in the expected { code, message, ... } format
        console.error('[Response Interceptor] Invalid response data structure:', res);
        ElMessage({ message: '收到了无效的服务器响应格式', type: 'error', duration: 5 * 1000 });
        return Promise.reject(new Error('无效的服务器响应格式'));
    }
  },
  (error) => {
    // Hide loading indicator (optional)
    // NProgress.done()
    
    console.error('[Response Interceptor] Network or other error:', error)
    let errorMessage = '网络错误或服务器无响应';
    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error(' [Response Interceptor] Error Response Data:', error.response.data);
        console.error(' [Response Interceptor] Error Response Status:', error.response.status);
        console.error(' [Response Interceptor] Error Response Headers:', error.response.headers);

        // **处理 Token 过期或无效**
        if (error.response.status === 401 || error.response.status === 403) {
          const userStore = useUserStore(); // 获取 user store 实例
          // 检查后端返回的消息是否明确指示 Token 问题
          const message = error.response.data?.message || '';
          if (message.includes('过期') || message.includes('无效') || message.includes('未认证') || error.response.status === 401) {
            console.warn('[Response Interceptor] Token expired or invalid (HTTP 401/403). Redirecting to login...');
            // 避免重复弹窗
            if (!window.location.pathname.includes('/login')) {
              ElMessage.error(message || '登录状态已失效，请重新登录');
              userStore.resetState(); // 清除本地状态和 token
              window.location.href = '/login'; // 强制跳转并刷新页面
            }
            // 返回一个永远不会 resolve 的 Promise 来中断后续的 .catch
            return new Promise(() => {}); 
          }
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

// 创建模拟数据对象
const mockData: Record<string, any> = {
  // 班级相关
  'class': Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    className: `${['计算机科学', '软件工程', '数据科学', '人工智能', '网络安全'][i]}${i + 1}班`,
    teacher: `${['张', '李', '王', '赵', '钱'][i]}老师`,
    studentCount: Math.floor(Math.random() * 30) + 20,
    createTime: '2023-01-01'
  })),
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
  'student': Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    studentId: `2024${String(i + 1).padStart(4, '0')}`,
    name: `学生${i + 1}`,
    class_name: `${['计算机科学', '软件工程', '数据科学', '人工智能', '网络安全'][i % 5]}${(i % 5) + 1}班`,
    phone: `1381234${String(i + 1).padStart(4, '0')}`,
    email: `student${i + 1}@example.com`,
    joinDate: '2023-09-01'
  })),
  'student/list': Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    studentId: `2024${String(i + 1).padStart(4, '0')}`,
    name: `学生${i + 1}`,
    class_name: `${['计算机科学', '软件工程', '数据科学', '人工智能', '网络安全'][i % 5]}${(i % 5) + 1}班`,
    phone: `1381234${String(i + 1).padStart(4, '0')}`,
    email: `student${i + 1}@example.com`,
    joinDate: '2023-09-01'
  })),
  'student/max-id': '2024050',
  'student/options': Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    name: `学生${i + 1}`,
    studentId: `2024${String(i + 1).padStart(4, '0')}`
  })),
  'student/detail': (id: number) => ({
    id,
    studentId: `2024${String(id).padStart(4, '0')}`,
    name: `学生${id}`,
    class_name: `${['计算机科学', '软件工程', '数据科学', '人工智能', '网络安全'][id % 5]}${(id % 5) + 1}班`,
    phone: `1381234${String(id).padStart(4, '0')}`,
    email: `student${id}@example.com`,
    joinDate: '2023-09-01'
  }),
  
  // 部门相关
  'dept': Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    deptName: `${['研发', '市场', '销售', '人事', '财务'][i]}部`,
    manager: `${['张', '李', '王', '赵', '钱'][i]}经理`,
    memberCount: Math.floor(Math.random() * 20) + 5,
    description: `负责${['产品研发', '市场营销', '产品销售', '人事管理', '财务管理'][i]}`,
    createTime: '2023-01-01'
  })),
  'dept/list': Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    deptName: `${['研发', '市场', '销售', '人事', '财务'][i]}部`,
    manager: `${['张', '李', '王', '赵', '钱'][i]}经理`,
    memberCount: Math.floor(Math.random() * 20) + 5,
    description: `负责${['产品研发', '市场营销', '产品销售', '人事管理', '财务管理'][i]}`,
    createTime: '2023-01-01'
  })),
  
  // 员工相关
  'employee': Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    name: `员工${i + 1}`,
    deptName: `${['研发', '市场', '销售', '人事', '财务'][i % 5]}部`,
    position: ['工程师', '经理', '主管', '专员', '助理'][i % 5],
    salary: Math.floor(Math.random() * 10000) + 5000,
    status: i % 10 === 0 ? '离职' : '在职',
    phone: `1381234${String(i + 1).padStart(4, '0')}`,
    email: `employee${i + 1}@example.com`,
    joinDate: '2023-01-01'
  })),
  'employee/list': Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    name: `员工${i + 1}`,
    deptName: `${['研发', '市场', '销售', '人事', '财务'][i % 5]}部`,
    position: ['工程师', '经理', '主管', '专员', '助理'][i % 5],
    salary: Math.floor(Math.random() * 10000) + 5000,
    status: i % 10 === 0 ? '离职' : '在职',
    phone: `1381234${String(i + 1).padStart(4, '0')}`,
    email: `employee${i + 1}@example.com`,
    joinDate: '2023-01-01'
  })),
  'employee/stats': {
    total: 50,
    activeCount: 45,
    deptDistribution: Array.from({ length: 5 }, (_, i) => ({
      name: `${['研发', '市场', '销售', '人事', '财务'][i]}部`,
      value: Math.floor(Math.random() * 20) + 5
    })),
    salaryDistribution: [
      { range: '5k以下', count: 5 },
      { range: '5k-10k', count: 20 },
      { range: '10k-15k', count: 15 },
      { range: '15k-20k', count: 8 },
      { range: '20k以上', count: 2 }
    ]
  },
  'employee/detail': (id: number) => ({
    id,
    name: `员工${id}`,
    deptName: `${['研发', '市场', '销售', '人事', '财务'][id % 5]}部`,
    position: ['工程师', '经理', '主管', '专员', '助理'][id % 5],
    salary: Math.floor(Math.random() * 10000) + 5000,
    status: id % 10 === 0 ? '离职' : '在职',
    phone: `1381234${String(id).padStart(4, '0')}`,
    email: `employee${id}@example.com`,
    joinDate: '2023-01-01'
  }),
  
  // 考试相关
  'exam': Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    examName: `${['期中考试', '期末考试', '月考'][i % 3]}-${Math.floor(i / 3) + 1}`,
    examDate: new Date(2023, i % 12, Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
    examType: ['期中考试', '期末考试', '月考'][i % 3],
    subjects: ['语文', '数学', '英语', '物理', '化学', '生物'].slice(0, Math.floor(Math.random() * 6) + 1),
    status: ['未开始', '进行中', '已结束'][i % 3],
    createTime: '2023-01-01'
  })),
  'exam/list': Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    examName: `${['期中考试', '期末考试', '月考'][i % 3]}-${Math.floor(i / 3) + 1}`,
    examDate: new Date(2023, i % 12, Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
    examType: ['期中考试', '期末考试', '月考'][i % 3],
    subjects: ['语文', '数学', '英语', '物理', '化学', '生物'].slice(0, Math.floor(Math.random() * 6) + 1),
    status: ['未开始', '进行中', '已结束'][i % 3],
    createTime: '2023-01-01'
  })),
  'exam/stats': {
    total: 10,
    completedCount: 3,
    inProgressCount: 3,
    upcomingCount: 4,
    typeDistribution: [
      { type: '期中考试', count: 3 },
      { type: '期末考试', count: 3 },
      { type: '月考', count: 4 }
    ]
  },
  'exam/detail': (id: number) => ({
    id,
    examName: `${['期中考试', '期末考试', '月考'][id % 3]}-${Math.floor(id / 3) + 1}`,
    examDate: new Date(2023, id % 12, Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
    examType: ['期中考试', '期末考试', '月考'][id % 3],
    subjects: ['语文', '数学', '英语', '物理', '化学', '生物'].slice(0, Math.floor(Math.random() * 6) + 1),
    status: ['未开始', '进行中', '已结束'][id % 3],
    createTime: '2023-01-01'
  }),
  
  // 成绩相关
  'score': Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    studentId: `2024${String(i + 1).padStart(4, '0')}`,
    name: `学生${i + 1}`,
    className: `${['计算机科学', '软件工程', '数据科学', '人工智能', '网络安全'][i % 5]}${(i % 5) + 1}班`,
    scores: {
      '语文': Math.floor(Math.random() * 30) + 70,
      '数学': Math.floor(Math.random() * 30) + 70,
      '英语': Math.floor(Math.random() * 30) + 70,
      '物理': Math.floor(Math.random() * 30) + 70,
      '化学': Math.floor(Math.random() * 30) + 70,
      '生物': Math.floor(Math.random() * 30) + 70
    },
    examTime: '2023-06-30',
    examType: '期末考试'
  })),
  'score/list': Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    studentId: `2024${String(i + 1).padStart(4, '0')}`,
    name: `学生${i + 1}`,
    className: `${['计算机科学', '软件工程', '数据科学', '人工智能', '网络安全'][i % 5]}${(i % 5) + 1}班`,
    scores: {
      '语文': Math.floor(Math.random() * 30) + 70,
      '数学': Math.floor(Math.random() * 30) + 70,
      '英语': Math.floor(Math.random() * 30) + 70,
      '物理': Math.floor(Math.random() * 30) + 70,
      '化学': Math.floor(Math.random() * 30) + 70,
      '生物': Math.floor(Math.random() * 30) + 70
    },
    examTime: '2023-06-30',
    examType: '期末考试'
  })),
  'score/student': (params: any) => {
    const studentId = params.studentId || params
    return {
      id: Number(studentId),
      studentId: `2024${String(studentId).padStart(4, '0')}`,
      name: `学生${studentId}`,
      className: `${['计算机科学', '软件工程', '数据科学', '人工智能', '网络安全'][Number(studentId) % 5]}${(Number(studentId) % 5) + 1}班`,
      scores: {
        '语文': Math.floor(Math.random() * 30) + 70,
        '数学': Math.floor(Math.random() * 30) + 70,
        '英语': Math.floor(Math.random() * 30) + 70,
        '物理': Math.floor(Math.random() * 30) + 70,
        '化学': Math.floor(Math.random() * 30) + 70,
        '生物': Math.floor(Math.random() * 30) + 70
      },
      examTime: '2023-06-30',
      examType: '期末考试'
    }
  },
  'score/class': (params: any) => {
    const classId = params.classId || params
    const className = `${['计算机科学', '软件工程', '数据科学', '人工智能', '网络安全'][Number(classId) % 5]}${(Number(classId) % 5) + 1}班`
    
    return {
      className,
      examType: params.examType || '期末考试',
      examTime: '2023-06-30',
      students: Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        studentId: `2024${String(i + 1).padStart(4, '0')}`,
        name: `学生${i + 1}`,
        scores: {
          '语文': Math.floor(Math.random() * 30) + 70,
          '数学': Math.floor(Math.random() * 30) + 70,
          '英语': Math.floor(Math.random() * 30) + 70,
          '物理': Math.floor(Math.random() * 30) + 70,
          '化学': Math.floor(Math.random() * 30) + 70,
          '生物': Math.floor(Math.random() * 30) + 70
        }
      })),
      averageScores: {
        '语文': 85,
        '数学': 82,
        '英语': 88,
        '物理': 79,
        '化学': 81,
        '生物': 84
      }
    }
  },
  
  // 日志相关
  'log': Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    type: ['system', 'database', 'vue'][i % 3],
    operation: ['登录', '查询', '新增', '修改', '删除'][i % 5],
    content: `${['用户', '管理员', '系统'][i % 3]}${['登录系统', '查询数据', '新增记录', '修改记录', '删除记录'][i % 5]}`,
    operator: `${['admin', 'user', 'system'][i % 3]}`,
    createTime: new Date(2023, i % 12, Math.floor(Math.random() * 28) + 1).toISOString()
  })),
  'log/list': Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    type: ['system', 'database', 'vue'][i % 3],
    operation: ['登录', '查询', '新增', '修改', '删除'][i % 5],
    content: `${['用户', '管理员', '系统'][i % 3]}${['登录系统', '查询数据', '新增记录', '修改记录', '删除记录'][i % 5]}`,
    operator: `${['admin', 'user', 'system'][i % 3]}`,
    createTime: new Date(2023, i % 12, Math.floor(Math.random() * 28) + 1).toISOString()
  }))
}

// 重写 get 方法以支持模拟数据
const originalGet = service.get
service.get = function <T = any, R = AxiosResponse<T>, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R> {
  const useMock = !service.defaults.baseURL // 根据 baseURL 是否为空判断是否使用 mock
  if (useMock) {
    const path = url.split('?')[0].replace(/^\//, '') // 移除查询参数和开头的斜杠
    console.log(`[Mock] GET ${url} -> ${path}`)
    return new Promise((resolve) => {
      setTimeout(() => {
        if (mockData[path]) {
          const mockResponse = {
            data: { code: 200, message: '获取成功', data: mockData[path] || null },
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config as InternalAxiosRequestConfig,
          } as unknown as R
          resolve(mockResponse)
        } else {
          const mockResponse = {
            data: { code: 404, message: '资源未找到', data: null },
            status: 404,
            statusText: 'Not Found',
            headers: {},
            config: config as InternalAxiosRequestConfig,
          } as unknown as R
          resolve(mockResponse)
        }
      }, 300)
    }) as Promise<R>
  }
  // 否则使用真实API
  return originalGet.call(this, url, config) as Promise<R>
}

interface MockResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: any;
}

// 重写 post 方法以支持模拟数据
const originalPost = service.post
service.post = function <T = any, R = AxiosResponse<T>, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R> {
  const useMock = !service.defaults.baseURL
  if (useMock) {
    const path = url.replace(/^\//, '')
    console.log(`[Mock] POST ${url} -> ${path}`, data)
    return new Promise((resolve) => {
      setTimeout(() => {
        const id = Date.now()
        let responseDataPayload: any;
        if (path === 'exam/add' || path === 'employee/add' || path === 'dept/add' || path === 'class/add' || path === 'student/add') {
          const dataObj = data ? (data as unknown as object) : {};
          responseDataPayload = { ...dataObj, id };
        } else {
          responseDataPayload = data;
        }
        const mockResponseData = {
          code: 200,
          message: '操作成功',
          data: responseDataPayload
        };
        const mockResponse: AxiosResponse<any, any> = {
          data: mockResponseData,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config as InternalAxiosRequestConfig<D>,
          request: undefined
        };
        resolve(mockResponse as unknown as R);
      }, 300)
    })
  }
  return originalPost.call(this, url, data, config) as Promise<R>
}

// 重写 put 方法以支持模拟数据
const originalPut = service.put
service.put = function <T = any, R = AxiosResponse<T>, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R> {
  const useMock = !service.defaults.baseURL
  if (useMock) {
    const path = url.replace(/^\//, '')
    console.log(`[Mock] PUT ${url} -> ${path}`, data)
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockResponseData = {
          code: 200,
          message: '更新成功',
          data: data
        };
        const mockResponse: AxiosResponse<any, any> = {
          data: mockResponseData,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config as InternalAxiosRequestConfig<D>,
          request: undefined
        };
        resolve(mockResponse as unknown as R);
      }, 300)
    })
  }
  return originalPut.call(this, url, data, config) as Promise<R>
}

// 重写 delete 方法以支持模拟数据
const originalDelete = service.delete
service.delete = function <T = any, R = AxiosResponse<T>, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R> {
  const useMock = !service.defaults.baseURL
  if (useMock) {
    const path = url.replace(/^\//, '')
    console.log(`[Mock] DELETE ${url} -> ${path}`)
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockResponseData = {
          code: 200,
          message: '删除成功',
          data: null
        };
        const mockResponse: AxiosResponse<any, any> = {
          data: mockResponseData,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config as InternalAxiosRequestConfig<D>,
          request: undefined
        };
        resolve(mockResponse as unknown as R);
      }, 300)
    })
  }
  return originalDelete.call(this, url, config) as Promise<R>
}

// Define the type for our enhanced request function/object
interface RequestFunction {
  // Call signature for using request(config)
  <T = any>(config: AxiosRequestConfig): Promise<T>;
  // Method signatures for using request.get(), request.post(), etc.
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T = any, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<T>;
  put<T = any, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<T>;
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
  // Add other methods like head, options, patch if needed by your project
}

// Create the base request function
const baseRequest = <T = any>(config: AxiosRequestConfig): Promise<T> => {
  // We expect the interceptors on 'service' to correctly resolve
  // with the business data (T) or reject with an appropriate error.
  // The type assertion here tells TypeScript to trust our interceptor logic.
  // The interceptors handle the unwrapping of response.data or returning blobs.
  return service(config) as Promise<T>; 
};

// Create the final request object that satisfies the interface
// Cast the base function to the RequestFunction type
const request: RequestFunction = baseRequest as RequestFunction;

// Attach the convenience methods to the request object
// These methods call the underlying service methods and apply the type assertion

request.get = <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
  service.get(url, config) as Promise<T>;

request.post = <T = any, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<T> =>
  service.post(url, data, config) as Promise<T>;

request.put = <T = any, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<T> =>
  service.put(url, data, config) as Promise<T>;

request.delete = <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
  service.delete(url, config) as Promise<T>;

// Export the enhanced function object
export default request;