import axios from 'axios'
import type { 
  AxiosInstance, 
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosRequestConfig
} from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

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
  'score/exam-types': ['期中考试', '期末考试', '月考'],
  'score/subjects': ['语文', '数学', '英语', '物理', '化学', '生物'],
  
  // 日志相关
  'log': Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    type: ['system', 'database', 'vue'][i % 3],
    operation: ['登录', '查询', '新增', '修改', '删除'][i % 5],
    content: `${['用户', '学生', '员工', '班级', '部门'][i % 5]}${i % 10 + 1}的${['登录', '查询', '新增', '修改', '删除'][i % 5]}操作`,
    operator: `管理员${i % 5 + 1}`,
    createTime: new Date(Date.now() - i * 3600000).toISOString().replace('T', ' ').substring(0, 19)
  })),
  'log/list': Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    type: ['system', 'database', 'vue'][i % 3],
    operation: ['登录', '查询', '新增', '修改', '删除'][i % 5],
    content: `${['用户', '学生', '员工', '班级', '部门'][i % 5]}${i % 10 + 1}的${['登录', '查询', '新增', '修改', '删除'][i % 5]}操作`,
    operator: `管理员${i % 5 + 1}`,
    createTime: new Date(Date.now() - i * 3600000).toISOString().replace('T', ' ').substring(0, 19)
  })),
  
  // 用户相关
  'user': {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    roles: ['admin'],
    permissions: ['*:*:*']
  },
  'user/info': {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    roles: ['admin'],
    permissions: ['*:*:*']
  }
}

// 是否启用模拟数据
const enableMock = true

// 创建axios实例
const service: AxiosInstance = axios.create({
  baseURL: 'http://localhost:3000/api', // 直接指定完整的后端API地址
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 在发送请求之前做些什么
    const userStore = useUserStore()
    const token = userStore.token
    
    // 如果有token，添加到请求头
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    // 对请求错误做些什么
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data
    
    if (response.config.responseType === 'blob') {
      return res
    }
    
    // 如果返回的是原始数据，直接返回
    if (res.code === undefined) {
      return res
    }
    
    // 如果返回的是标准响应格式，判断状态码
    if (res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      
      if (res.code === 401) {
        const userStore = useUserStore()
        userStore.logout()
      }
      
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    
    return res.data // 直接返回data部分
  },
  (error) => {
    console.error('响应错误:', error)
    
    let message = '网络错误，请稍后重试'
    
    if (error.response) {
      switch (error.response.status) {
        case 400:
          message = '请求错误'
          break
        case 401:
          message = '未授权，请重新登录'
          const userStore = useUserStore()
          userStore.logout()
          break
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = '请求的资源不存在'
          break
        case 500:
          message = '服务器内部错误'
          break
        default:
          message = `请求失败: ${error.response.status}`
      }
    } else if (error.request) {
      message = '服务器无响应，请稍后重试'
    }
    
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

// 模拟数据处理函数
const handleMockData = (url: string, params?: any) => {
  console.log('使用模拟数据:', url)
  
  // 移除开头的斜杠
  const apiPath = url.startsWith('/') ? url.substring(1) : url
  
  // 查找对应的模拟数据
  const mockResponse = mockData[apiPath]
  
  if (mockResponse) {
    // 如果是函数，则调用函数获取数据
    if (typeof mockResponse === 'function') {
      const result = mockResponse(params)
      console.log('模拟数据响应(函数):', apiPath, result)
      // 包装成API响应格式
      return Promise.resolve({
        code: 200,
        data: result,
        message: 'success'
      })
    }
    // 否则直接返回数据，包装成API响应格式
    console.log('模拟数据响应(静态):', apiPath, mockResponse)
    return Promise.resolve({
      code: 200,
      data: mockResponse,
      message: 'success'
    })
  }
  
  // 没有找到对应的模拟数据
  console.warn('未找到模拟数据:', apiPath)
  
  // 尝试使用通用模式匹配
  const generalPath = apiPath.split('/')[0]
  if (mockData[generalPath]) {
    console.log('使用通用模拟数据:', generalPath)
    const generalData = mockData[generalPath]
    if (typeof generalData === 'function') {
      const result = generalData(params)
      console.log('通用模拟数据响应(函数):', generalPath, result)
      return Promise.resolve({
        code: 200,
        data: result,
        message: 'success'
      })
    }
    console.log('通用模拟数据响应(静态):', generalPath, generalData)
    return Promise.resolve({
      code: 200,
      data: generalData,
      message: 'success'
    })
  }
  
  return Promise.resolve({
    code: 404,
    data: null,
    message: '未找到模拟数据'
  })
}

// 定义请求方法
const request = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    // 如果启用了模拟数据，则返回模拟数据
    if (enableMock) {
      return handleMockData(url, config?.params) as Promise<T>
    }
    return service.get(url, config)
  },
  post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    // 如果启用了模拟数据，则返回模拟数据
    if (enableMock) {
      return handleMockData(url, data) as Promise<T>
    }
    return service.post(url, data, config)
  },
  put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    // 如果启用了模拟数据，则返回模拟数据
    if (enableMock) {
      return handleMockData(url, data) as Promise<T>
    }
    return service.put(url, data, config)
  },
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    // 如果启用了模拟数据，则返回模拟数据
    if (enableMock) {
      return handleMockData(url, config?.params) as Promise<T>
    }
    return service.delete(url, config)
  }
}

export default request