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
            <div 
              v-for="(item, index) in shortcuts" 
              :key="index" 
              class="shortcut-item"
              @click="navigateTo(item.path)"
            >
              <el-icon :size="30" :color="item.color">
                <component :is="item.icon" />
              </el-icon>
              <span>{{ item.title }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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

const router = useRouter()
const loading = ref(true)

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
    const response = await getEmployeeStats()
    if (response && response.code === 200 && response.data) {
      // 更新员工总数
      statCards.value[0].value = response.data.totalCount.toString() || '0'
    }
  } catch (error) {
    console.error('获取员工统计数据失败:', error)
  }
}

// 获取部门数量
const fetchDeptCount = async () => {
  try {
    const response = await getDeptList()
    if (response && response.code === 200 && Array.isArray(response.data)) {
      // 更新部门数量
      statCards.value[1].value = response.data.length.toString() || '0'
    }
  } catch (error) {
    console.error('获取部门数量失败:', error)
  }
}

// 获取班级数量
const fetchClassCount = async () => {
  try {
    const response = await getClassList()
    if (response && response.code === 200 && Array.isArray(response.data)) {
      // 更新班级数量
      statCards.value[2].value = response.data.length.toString() || '0'
    }
  } catch (error) {
    console.error('获取班级数量失败:', error)
  }
}

// 获取考试场次
const fetchExamCount = async () => {
  try {
    const response = await getExamStats()
    if (response && response.code === 200 && response.data) {
      // 更新考试场次
      statCards.value[3].value = response.data.totalCount?.toString() || '0'
    }
  } catch (error) {
    console.error('获取考试场次失败:', error)
  }
}

// 初始化数据
const initDashboardData = async () => {
  loading.value = true
  try {
    // 并行获取所有统计数据
    await Promise.all([
      fetchEmployeeStats(),
      fetchDeptCount(),
      fetchClassCount(),
      fetchExamCount()
    ])
  } catch (error) {
    console.error('初始化仪表盘数据失败:', error)
    ElMessage.warning('获取统计数据失败，显示默认值')
  } finally {
    loading.value = false
  }
}

// 页面加载时获取数据
onMounted(() => {
  initDashboardData()
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.welcome-card {
  margin-bottom: 20px;
}

.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.welcome-text h2 {
  font-size: 24px;
  margin-bottom: 10px;
  color: #303133;
}

.welcome-text p {
  font-size: 16px;
  color: #606266;
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
}

.card-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.card-header {
  font-size: 18px;
  font-weight: bold;
}

.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
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
</style> 