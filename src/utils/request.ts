import axios from 'axios'
import type { 
  AxiosInstance, 
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosRequestConfig
} from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

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
    // 添加token到请求头
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers['Authorization'] = `Bearer ${userStore.token}`
    }
    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    // 如果是文件下载，直接返回
    if (response.config.responseType === 'blob') {
      return response
    }
    
    // 处理响应数据
    const res = response.data
    
    // 如果是真实API响应，检查状态码
    if (res && res.code !== undefined) {
      // Check if the business code indicates success (e.g., 200 or 201)
      if (res.code === 200 || res.code === 201) { 
        // Business success, return the original Axios response
        // The API function's .then block will receive this
        return response 
      } else {
        // Business failure (but HTTP request succeeded)
        ElMessage.error(res.message || '请求失败')
        
        // Handle specific error codes like 401
        if (res.code === 401) {
          // 未授权，清除用户信息并跳转到登录页
          const userStore = useUserStore()
          userStore.resetState()
          window.location.href = '/login'
        }
        
        // Reject the promise with the business error details
        // The API function's .catch block will receive this
        return Promise.reject(res) 
      }
    } else {
      // Handle responses without a 'code' field or non-standard format
      console.warn('响应数据格式不标准或无 code 字段:', response);
      // Assuming these are still successful at the HTTP level
      return response; 
    }
  },
  (error) => {
    console.error('响应错误:', error)
    const errorMsg = error.response?.data?.message || error.message || '请求失败';
    ElMessage.error(errorMsg)
    return Promise.reject(error)
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
          // 模拟 AxiosResponse 结构
          const mockResponse = {
            data: { code: 200, message: '获取成功', data: mockData[path] || null },
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config as InternalAxiosRequestConfig, // 类型断言
          } as R // 使用 R 作为类型断言
          resolve(mockResponse)
        } else {
          const mockResponse = {
            data: { code: 404, message: '资源未找到', data: null },
            status: 404,
            statusText: 'Not Found',
            headers: {},
            config: config as InternalAxiosRequestConfig,
          } as R
          resolve(mockResponse) // Mock 也应该 resolve 而不是 reject 404，让拦截器或调用者处理
        }
      }, 300)
    }) as Promise<R> // 确保返回 Promise<R>
  }
  // 否则使用真实API
  return originalGet.call(this, url, config) as Promise<R> // 添加类型断言
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
        // 简单的模拟：假设总是成功，并返回包含 id 的数据
        const id = Date.now() // 模拟生成ID
        let responseData: any;
        if (path === 'exam/add' || path === 'employee/add' || path === 'dept/add' || path === 'class/add' || path === 'student/add') {
           responseData = { code: 200, message: '添加成功', data: { ...(data as object || {}), id } }
        } else {
           responseData = { code: 200, message: '操作成功', data: data } // 其他 POST 操作可能只返回消息
        }
         const mockResponse = {
            data: responseData,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config as InternalAxiosRequestConfig,
          } as R
        resolve(mockResponse)
      }, 300)
    }) as Promise<R>
  }
  // 否则使用真实API
  return originalPost.call(this, url, data, config) as Promise<R> // 添加类型断言
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
        // 简单的模拟：假设总是成功
         const mockResponse = {
            data: { code: 200, message: '更新成功', data: data }, // PUT 通常返回更新后的数据或null/void
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config as InternalAxiosRequestConfig,
          } as R
        resolve(mockResponse)
      }, 300)
    }) as Promise<R>
  }
  // 否则使用真实API
  return originalPut.call(this, url, data, config) as Promise<R> // 添加类型断言
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
        // 简单的模拟：假设总是成功
         const mockResponse = {
            data: { code: 200, message: '删除成功', data: null }, // DELETE 通常返回 null 或 void
            status: 200, // 或者 204 No Content
            statusText: 'OK',
            headers: {},
            config: config as InternalAxiosRequestConfig,
          } as R
        resolve(mockResponse)
      }, 300)
    }) as Promise<R>
  }
  // 否则使用真实API
  return originalDelete.call(this, url, config) as Promise<R> // 添加类型断言
}

export default service