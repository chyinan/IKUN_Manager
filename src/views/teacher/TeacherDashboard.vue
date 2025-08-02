<template>
  <div class="teacher-dashboard-container">
    <!-- 欢迎卡片 -->
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="welcome-card">
          <div class="welcome-content">
            <div class="welcome-text">
              <h2>欢迎 {{ displayName }}！</h2>
              <p>今天是 {{ currentDate }} ，祝您教学顺利！</p>
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
            <div v-for="(item, index) in shortcuts" :key="index" class="shortcut-item" @click="navigateTo(item.path)">
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
import { ref, computed, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getStudentList } from '@/api/student'
import { getClassList } from '@/api/class'
import { getExamStats } from '@/api/exam'
import { getAllAssignments } from '@/api/assignment'
import type { ExamStats, ApiResponse } from '@/types/common'
import { User, School, Document, Calendar, PieChart } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const displayName = computed(() => userStore.userInfo?.displayName || userStore.username)

// 白天/暗黑模式父组件注入（用于后续可能的样式调整）
const isDark = inject<boolean>('isDark', false)

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
  { title: '学生人数', value: '0', icon: 'User', color: '#409EFF' },
  { title: '班级数量', value: '0', icon: 'School', color: '#67C23A' },
  { title: '作业数量', value: '0', icon: 'Document', color: '#E6A23C' },
  { title: '考试场次', value: '0', icon: 'Calendar', color: '#F56C6C' }
])

// 快捷入口
const shortcuts = ref([
  { title: '学生管理', icon: 'User', color: '#409EFF', path: '/teacher-portal/students' },
  { title: '班级管理', icon: 'School', color: '#67C23A', path: '/teacher-portal/classes' },
  { title: '成绩管理', icon: 'Document', color: '#E6A23C', path: '/teacher-portal/scores' },
  { title: '考试管理', icon: 'Calendar', color: '#F56C6C', path: '/teacher-portal/exams' },
  { title: '作业管理', icon: 'Document', color: '#909399', path: '/teacher-portal/assignments' },
  { title: '学生信息统计', icon: 'PieChart', color: '#67C23A', path: '/teacher-portal/student-report' }
])

// 导航
const navigateTo = (path: string) => {
  router.push(path)
}

// 获取统计数据
const fetchStudentCount = async () => {
  try {
    const res = await getStudentList()
    if (res?.code === 200 && Array.isArray(res.data)) {
      statCards.value[0].value = res.data.length.toString()
    }
  } catch (err) {
    console.error('获取学生数量失败', err)
  }
}

const fetchClassCount = async () => {
  try {
    const res = await getClassList()
    if (res?.code === 200 && Array.isArray(res.data)) {
      statCards.value[1].value = res.data.length.toString()
    }
  } catch (err) {
    console.error('获取班级数量失败', err)
  }
}

const fetchAssignmentCount = async () => {
  try {
    const res = await getAllAssignments()
    if (res?.code === 200 && Array.isArray(res.data)) {
      statCards.value[2].value = res.data.length.toString()
    }
  } catch (err) {
    console.error('获取作业数量失败', err)
  }
}

const fetchExamCount = async () => {
  try {
    const res = await getExamStats()
    const response = res as any;
    if (response && response.code === 200 && response.data && response.data.total !== undefined) {
              statCards.value[3].value = (response.data.total ?? 0).toString()
    }
  } catch (err) {
    console.error('获取考试数量失败', err)
  }
}

onMounted(() => {
  fetchStudentCount()
  fetchClassCount()
  fetchAssignmentCount()
  fetchExamCount()
})
</script>

<style scoped>
.teacher-dashboard-container {
  padding: 20px;
  min-height: calc(100vh - 84px);
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
  color: #303133;
}
.shortcut-row .el-card {
  background: white;
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
</style> 