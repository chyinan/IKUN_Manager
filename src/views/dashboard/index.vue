<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <!-- 欢迎卡片 -->
      <el-col :span="24">
        <el-card class="welcome-card">
          <div class="welcome-content">
            <div class="welcome-text">
              <h2>欢迎使用高校人事管理系统</h2>
              <p>今天是 {{ currentDate }}，祝您工作愉快！</p>
            </div>
            <div class="welcome-image">
              <img src="@/assets/dashboard.svg" alt="Dashboard" />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 数据卡片 -->
    <el-row :gutter="20" class="data-row">
      <el-col :xs="24" :sm="12" :md="6" v-for="(item, index) in statCards" :key="index">
        <el-card class="data-card" :body-style="{ padding: '20px' }">
          <div class="card-content">
            <el-icon :size="40" :color="item.color">
              <component :is="item.icon" />
            </el-icon>
            <div class="card-info">
              <div class="card-title">{{ item.title }}</div>
              <div class="card-value">{{ item.value }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快捷入口 -->
    <el-row :gutter="20" class="shortcut-row">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>快捷入口</span>
            </div>
          </template>
          <div class="shortcut-grid">
            <template v-for="(item, index) in shortcuts" :key="index">
              <div 
                v-if="!(['/class', '/student', '/dept', '/exam'].includes(item.path) && userInfo?.role === 'admin') && (item.path !== '/log' || (item.path === '/log' && userInfo?.role === 'admin'))" 
                class="shortcut-item"
                @click="navigateTo(item.path)"
              >
                <el-icon :size="30" :color="item.color">
                  <component :is="item.icon" />
                </el-icon>
                <span>{{ item.title }}</span>
              </div>
            </template>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  User, 
  OfficeBuilding, 
  School, 
  DocumentChecked, 
  Calendar, 
  PieChart, 
  List, 
  Setting 
} from '@element-plus/icons-vue'
import { getEmployeeStats } from '@/api/employee'
import { getDeptList } from '@/api/dept'
import { getClassList } from '@/api/class'
import { getExamStats } from '@/api/exam'
import type { ApiResponse, ExamStats } from '@/types/common'
import { useUserStore } from '@/stores/user'

// Define interface for Chart.js dataset (adjust if using different chart library)
interface ChartDataset {
  label: string;
  backgroundColor: string[];
  data: number[];
  // Add other properties if needed, e.g., borderColor, fill
}

const router = useRouter()
const loading = ref(true)
const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)

// Inject isDark from parent instead
const isDark = inject<boolean>('isDark', false)

// Corrected: Define examTypeDistribution ref with explicit dataset type
const examTypeDistribution = ref<{ labels: string[], datasets: ChartDataset[] }>({ 
  labels: [], 
  datasets: [] 
});

// 当前日期
const currentDate = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
})

// 统计卡片数据
const statCards = ref([
  {
    title: '员工总数',
    value: '0',
    icon: 'User',
    color: '#409EFF'
  },
  {
    title: '部门数量',
    value: '0',
    icon: 'OfficeBuilding',
    color: '#67C23A'
  },
  {
    title: '班级数量',
    value: '0',
    icon: 'School',
    color: '#E6A23C'
  },
  {
    title: '考试场次',
    value: '0',
    icon: 'Calendar',
    color: '#F56C6C'
  }
])

// 快捷入口
const shortcuts = ref([
  {
    title: '员工管理',
    icon: 'User',
    color: '#409EFF',
    path: '/employee'
  },
  {
    title: '部门管理',
    icon: 'OfficeBuilding',
    color: '#67C23A',
    path: '/dept'
  },
  {
    title: '班级管理',
    icon: 'School',
    color: '#E6A23C',
    path: '/class'
  },
  {
    title: '学生管理',
    icon: 'User',
    color: '#F56C6C',
    path: '/student'
  },
  {
    title: '成绩管理',
    icon: 'DocumentChecked',
    color: '#909399',
    path: '/score'
  },
  {
    title: '考试管理',
    icon: 'Calendar',
    color: '#409EFF',
    path: '/exam'
  },
  {
    title: '员工统计',
    icon: 'PieChart',
    color: '#67C23A',
    path: '/emp-report'
  },
  {
    title: '系统日志',
    icon: 'List',
    color: '#E6A23C',
    path: '/log'
  }
])

// 导航到指定路径
const navigateTo = (path: string) => {
  router.push(path)
}

// 获取员工统计数据
const fetchEmployeeStats = async () => {
  try {
    loading.value = true
    const response = await getEmployeeStats()
    if (response?.code === 200) {
      // 如果返回的是数组，使用数组长度
      if (Array.isArray(response.data)) {
        statCards.value[0].value = response.data.length.toString()
      } 
      // 如果返回的是对象，尝试获取 total 字段
      else if (response.data && typeof response.data === 'object') {
        statCards.value[0].value = response.data.total?.toString() || '0'
      }
      // 如果都不是，使用默认值
      else {
        statCards.value[0].value = '0'
      }
    } else {
      ElMessage.warning(response?.message || '获取员工统计数据失败')
    }
  } catch (error: any) {
    console.error('获取员工统计数据失败:', error)
    statCards.value[0].value = '0'
  } finally {
    loading.value = false
  }
}

// 获取部门数量
const fetchDeptCount = async () => {
  try {
    loading.value = true
    const response = await getDeptList()
    if (response?.code === 200 && Array.isArray(response.data)) {
      statCards.value[1].value = response.data.length.toString()
    } else {
      ElMessage.warning(response?.message || '获取部门数量失败')
    }
  } catch (error: any) {
    console.error('获取部门数量失败:', error)
    statCards.value[1].value = '0'
  } finally {
    loading.value = false
  }
}

// 获取班级数量
const fetchClassCount = async () => {
  try {
    const response = await getClassList()
    if (response?.code === 200 && Array.isArray(response.data)) {
      statCards.value[2].value = response.data.length.toString()
    }
  } catch (error) {
    console.error('获取班级数量异常:', error)
    statCards.value[2].value = '0'
  }
}

// 获取考试统计数据
const fetchExamStats = async () => {
  try {
    const response = await getExamStats()
    console.log('Exam Stats Response:', response)
    const responseData = response as any;
    if (responseData && responseData.code === 200 && responseData.data && responseData.data.total !== undefined) {
      // Corrected: Assert type for statsData
              const statsData: ExamStats = responseData.data;
        statCards.value[3].value = statsData.total?.toString() || '0'

      // Update chart data if typeDistribution exists
      if (Array.isArray(statsData.typeDistribution)) {
          // Explicitly type the new dataset object
          const newDataset: ChartDataset = {
            label: '考试类型分布',
            backgroundColor: ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399'],
            data: statsData.typeDistribution.map((item: { count: number }) => item.count)
          };
          examTypeDistribution.value = {
            labels: statsData.typeDistribution.map((item: { type: string }) => item.type),
            datasets: [newDataset] // Assign the typed dataset
          };
          console.log('Updated examTypeDistribution:', examTypeDistribution.value);
      } else {
          console.warn('typeDistribution is missing or not an array in exam stats response');
      }
    } else {
      console.error('获取考试统计失败:', responseData?.message || '未知错误')
    }
  } catch (error: any) {
    console.error('获取考试统计时出错:', error)
    ElMessage.error(error.message || '加载考试统计数据失败')
  }
}

// 初始化数据
const initData = async () => {
  loading.value = true
  try {
    await Promise.all([
      fetchEmployeeStats(),
      fetchDeptCount(),
      fetchClassCount(),
      fetchExamStats()
    ])
  } catch (error) {
    console.error('初始化数据异常:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 生命周期钩子
onMounted(() => {
  fetchEmployeeStats()
  fetchDeptCount()
  fetchClassCount()
  fetchExamStats()
})
</script>

<style scoped>
/* Remove .dark-component-bg and use .dark context from parent */

/* ... styles for welcome-card, data-card, shortcut-row, shortcut-item ... */

/* Keep other non-dark related styles */
.dashboard-container { 
  padding: 20px;
  min-height: calc(100vh - 84px);
  transition: background-color 0.3s;
}
.welcome-card {
  margin-bottom: 20px;
  background: white;
  transition: background-color 0.3s, border-color 0.3s, box-shadow 0.3s;
}
.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.welcome-text h2 {
  font-size: 26px;
  margin-bottom: 10px;
  color: #303133;
  font-family:
  -apple-system,BlinkMacSystemFont,
  'PingFang SC', 'Hiragino Sans GB',
  'Helvetica Neue', Helvetica,
  'Microsoft YaHei', Arial, sans-serif;
  transition: color 0.3s;
}
.welcome-text p {
  font-size: 16px;
  color: #606266;
  transition: color 0.3s;
}
.welcome-image img {
  max-width: 200px;
  height: auto;
}
.data-row {
  margin-bottom: 20px;
}
.data-card {
  height: 100%;
  transition: all 0.3s;
  background: white;
}
.data-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}
.card-content {
  display: flex;
  align-items: center;
  gap: 15px;
}
.card-info {
  flex: 1;
}
.card-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 5px;
  transition: color 0.3s;
}
.card-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  transition: color 0.3s;
}
.card-header {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  transition: color 0.3s;
}
.shortcut-row .el-card {
  background: white;
  transition: background-color 0.3s, border-color 0.3s, box-shadow 0.3s;
}
.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
}
.shortcut-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  color: #606266;
}
.shortcut-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  background-color: #ecf5ff;
}
.shortcut-item span {
  margin-top: 10px;
  font-size: 14px;
}

@media (max-width: 768px) {
  .welcome-content {
    flex-direction: column;
    text-align: center;
  }
  
  .welcome-image {
    margin-top: 20px;
  }
  
  .shortcut-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Example: Welcome Card */
.dark .welcome-card {
  background-color: #1f2937 !important; 
  border-color: var(--el-border-color-lighter) !important;
  box-shadow: var(--el-box-shadow-light) !important;
}
.dark .welcome-card .welcome-text h2 {
  color: #e0e0e0;
}
.dark .welcome-card .welcome-text p {
  color: #a0a0a0;
}
.dark .welcome-card .welcome-image img {
  filter: brightness(0.8) contrast(1.2);
}

/* Example: Data Card */
.dark .data-card {
  background-color: #1f2937 !important; 
  border-color: var(--el-border-color-lighter) !important;
  box-shadow: var(--el-box-shadow-light) !important;
}
.dark .data-card .card-title {
  color: #a0a0a0;
}
.dark .data-card .card-value {
  color: #e0e0e0;
}
/* Adjust icon color if needed */
.dark .data-card .el-icon {
   color: #cccccc !important; /* Ensure icons are visible */
}

/* Example: Shortcut Row Card */
.dark .shortcut-row .el-card {
  background-color: #1f2937 !important;
  border-color: var(--el-border-color-lighter) !important;
  box-shadow: var(--el-box-shadow-light) !important;
}
.dark .shortcut-row .el-card .card-header {
  color: #e0e0e0;
}

/* Example: Shortcut Item */
.dark .shortcut-item {
  background-color: #263445;
  color: #a0a0a0;
}
.dark .shortcut-item:hover {
  background-color: #374151;
  box-shadow: 0 5px 15px rgba(255, 255, 255, 0.05);
  color: #ffffff;
}
/* Adjust icon color if needed */
.dark .shortcut-item .el-icon {
   color: #cccccc !important; /* Ensure icons are visible */
}

/* Dark Mode Overrides for Dashboard (inner elements) */
html.dark {
  /* Removed: .dashboard-container rule */

  .welcome-card,
  .data-card,
  .shortcut-row .el-card {
    background-color: #263445; /* Use a consistent dark card background */
    border-color: var(--el-border-color-lighter) !important; /* Adjust border if needed */
    box-shadow: var(--el-box-shadow-light) !important; /* Use dark shadow */
  }

  .data-card:hover,
  .shortcut-item:hover {
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3); /* Darker hover shadow */
    background-color: #2c3e50; /* Slightly lighter on hover? */
  }

  .welcome-text h2,
  .card-value,
  .card-header,
  .shortcut-text {
    color: #E0E0E0; /* Lighter text for primary elements */
  }

  .welcome-text p,
  .card-title {
    color: #A0A0A0; /* Secondary text color */
  }

  .shortcut-icon {
    color: var(--el-color-primary-light-3); /* Lighter primary for icon */
  }
}

/* Add transitions for main cards */
.welcome-card,
.data-card,
.shortcut-row .el-card { /* Target el-card specifically within shortcut-row */
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
}

/* Welcome Card Styles */
.welcome-card {
  margin-bottom: 20px;
  background: white;
  transition: background-color 0.3s, border-color 0.3s, box-shadow 0.3s;
}
.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.welcome-text h2 {
  font-size: 26px;
  margin-bottom: 10px;
  color: #303133;
  font-family:
  -apple-system,BlinkMacSystemFont,
  'PingFang SC', 'Hiragino Sans GB',
  'Helvetica Neue', Helvetica,
  'Microsoft YaHei', Arial, sans-serif;
  transition: color 0.3s;
}
.welcome-text p {
  font-size: 16px;
  color: #606266;
  transition: color 0.3s;
}
.welcome-image img {
  max-width: 200px;
  height: auto;
}
</style> 