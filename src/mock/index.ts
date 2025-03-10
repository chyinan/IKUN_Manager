// 模拟数据
import type { StudentItem, ClassItem, DeptItem, EmployeeItem } from '@/types/common'

// 生成随机ID
const generateId = () => Math.floor(Math.random() * 10000) + 1

// 生成随机日期
const generateDate = (start = new Date(2020, 0, 1), end = new Date()) => {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  return date.toISOString().split('T')[0]
}

// 模拟班级数据
const classMockData: ClassItem[] = [
  { id: 1, className: '计算机科学1班', teacher: '张三', studentCount: 35, createTime: '2023-01-01' },
  { id: 2, className: '软件工程2班', teacher: '李四', studentCount: 42, createTime: '2023-01-02' },
  { id: 3, className: '数据科学3班', teacher: '王五', studentCount: 38, createTime: '2023-01-03' },
  { id: 4, className: '人工智能4班', teacher: '赵六', studentCount: 30, createTime: '2023-01-04' },
  { id: 5, className: '网络安全5班', teacher: '钱七', studentCount: 33, createTime: '2023-01-05' }
]

// 模拟学生数据
const studentMockData: StudentItem[] = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  studentId: `2024${String(i + 1).padStart(4, '0')}`,
  name: `学生${i + 1}`,
  class_name: classMockData[i % classMockData.length].className,
  phone: `1381234${String(i + 1).padStart(4, '0')}`,
  email: `student${i + 1}@example.com`,
  joinDate: generateDate()
}))

// 模拟部门数据
const deptMockData: DeptItem[] = [
  { id: 1, deptName: '研发部', manager: '张三', memberCount: 15, description: '负责产品研发', createTime: '2023-01-01' },
  { id: 2, deptName: '市场部', manager: '李四', memberCount: 10, description: '负责市场营销', createTime: '2023-01-02' },
  { id: 3, deptName: '销售部', manager: '王五', memberCount: 20, description: '负责产品销售', createTime: '2023-01-03' },
  { id: 4, deptName: '人事部', manager: '赵六', memberCount: 5, description: '负责人事管理', createTime: '2023-01-04' },
  { id: 5, deptName: '财务部', manager: '钱七', memberCount: 8, description: '负责财务管理', createTime: '2023-01-05' }
]

// 模拟员工数据
const employeeMockData: EmployeeItem[] = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  name: `员工${i + 1}`,
  deptName: deptMockData[i % deptMockData.length].deptName,
  position: ['工程师', '经理', '主管', '专员', '助理'][i % 5],
  salary: Math.floor(Math.random() * 10000) + 5000,
  status: i % 10 === 0 ? '离职' : '在职',
  phone: `1381234${String(i + 1).padStart(4, '0')}`,
  email: `employee${i + 1}@example.com`,
  joinDate: generateDate()
}))

// 模拟成绩数据
const scoreMockData = studentMockData.map(student => ({
  id: student.id,
  studentId: student.studentId,
  name: student.name,
  className: student.class_name,
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
}))

// 模拟日志数据
const logMockData = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  type: ['system', 'database', 'vue'][i % 3],
  operation: ['登录', '查询', '新增', '修改', '删除'][i % 5],
  content: `操作内容${i + 1}`,
  operator: `用户${i % 10 + 1}`,
  createTime: new Date(Date.now() - i * 3600000).toISOString().replace('T', ' ').substring(0, 19)
}))

// 模拟数据映射
const mockData: Record<string, any> = {
  // 班级相关
  'class/list': classMockData,
  'class/options': classMockData.map(item => ({ id: item.id, className: item.className })),
  
  // 学生相关
  'student/list': studentMockData,
  'student/max-id': '2024050',
  'student/options': studentMockData.map(item => ({ id: item.id, name: item.name, studentId: item.studentId })),
  
  // 部门相关
  'dept/list': deptMockData,
  
  // 员工相关
  'employee/list': employeeMockData,
  'employee/stats': {
    total: employeeMockData.length,
    activeCount: employeeMockData.filter(e => e.status === '在职').length,
    deptDistribution: deptMockData.map(dept => ({
      name: dept.deptName,
      value: dept.memberCount
    })),
    salaryDistribution: [
      { range: '5k以下', count: 5 },
      { range: '5k-10k', count: 20 },
      { range: '10k-15k', count: 15 },
      { range: '15k-20k', count: 8 },
      { range: '20k以上', count: 2 }
    ]
  },
  
  // 成绩相关
  'score/list': scoreMockData,
  'score/student': (params: any) => {
    const studentId = params.studentId || params
    return scoreMockData.find(s => s.id === Number(studentId)) || null
  },
  'score/exam-types': ['期中考试', '期末考试', '月考'],
  'score/subjects': ['语文', '数学', '英语', '物理', '化学', '生物'],
  
  // 日志相关
  'log/list': logMockData
}

export default mockData 