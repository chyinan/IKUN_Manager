<template>
  <div class="report-container">
    <!-- 顶部操作区 -->
    <div class="operation-area">
      <div class="exam-select">
        <span class="label">考试类型：</span>
        <el-select 
          v-model="selectedExamType" 
          placeholder="选择考试类型" 
          @change="handleExamTypeChange">
          <el-option
            v-for="item in examTypes"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>
    </div>

    <!-- 数据概览卡片 -->
    <div class="overview-cards">
      <el-card 
        v-for="(item, index) in summaryData" 
        :key="index"
        class="stat-card"
        :class="{ highlight: index === 2 }"> <!-- 优秀率卡片特殊样式 -->
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon :size="32" :color="item.color">
              <component :is="item.icon" />
            </el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-title">{{ item.title }}</div>
            <div class="stat-value">{{ item.value }}</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 主要图表区域 -->
    <div class="main-charts">
      <!-- 左侧成绩分布 -->
      <el-card class="chart-card distribution-chart">
        <template #header>
          <div class="chart-header">
            <span class="chart-title">班级成绩分布</span>
            <el-select 
              v-model="selectedClass" 
              placeholder="选择班级"
              size="small">
              <el-option 
                v-for="item in classList" 
                :key="item" 
                :label="item" 
                :value="item" />
            </el-select>
          </div>
        </template>
        <v-chart class="chart" :option="gradeDistOption" />
      </el-card>

      <!-- 右侧平均分 -->
      <el-card class="chart-card average-chart">
        <template #header>
          <div class="chart-header">
            <span class="chart-title">各科平均分</span>
          </div>
        </template>
        <v-chart class="chart" :option="avgScoreOption" />
      </el-card>
    </div>

    <!-- 底部学科能力分析 -->
    <el-card class="chart-card radar-chart">
      <template #header>
        <div class="chart-header">
          <span class="chart-title">班级学科能力分析</span>
        </div>
      </template>
      <v-chart class="chart" :option="radarOption" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { 
  LineChart, 
  BarChart, 
  RadarChart, 
  PieChart 
} from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { 
  User, 
  School, 
  Trophy, 
  DataLine 
} from '@element-plus/icons-vue'
import { getStudentList } from '@/api/student'
import { getClassList } from '@/api/class'
import { getStudentScore, getClassScores } from '@/api/score'
import type { SubjectType, ScoreData, ScoreStatistics } from '@/types/score'
// import type { ClassItem } from '@/types/class' (removed duplicate import)
// import type { StudentItem } from '@/types/student' (removed duplicate import)
import type { 
  StatCard,
  GradeDistribution,
  SubjectAverage,
  ClassScoreData,
  SubjectStats,
  ClassStats
} from '@/types/statistics'
import type { ApiResponse } from '@/types/common'
import type { ScoreReportData, ScoreAnalysis, ChartData } from '@/types/scoreReport'
import type { 
  StudentItemResponse,
  StudentItem 
} from '@/types/student'
import type { 
  ClassItemResponse,
  ClassItem 
} from '@/types/class'

// 添加在 script setup 内部最前面
const subjects: SubjectType[] = ['语文', '数学', '英语', '物理', '化学', '生物'] as const

// 注册组件
use([
  CanvasRenderer,
  LineChart,
  BarChart,
  RadarChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent
])

// 顶部统计数据
const loading = ref(false)
const summaryData = ref<StatCard[]>([
  {
    title: '总学生数',
    value: '0',
    icon: 'User',
    color: '#409EFF'
  },
  {
    title: '班级数量',
    value: '0',
    icon: 'School',
    color: '#67C23A'
  },
  {
    title: '优秀率',
    value: '0%',
    icon: 'Trophy',
    color: '#E6A23C'
  }
  // 移除平均分统计卡片
])

// 更新基础数据状态
const students = ref<StudentItem[]>([])
const classes = ref<ClassItem[]>([])
const subjectStatistics = ref<ScoreStatistics>({
  语文: { sum: 0, count: 0 },
  数学: { sum: 0, count: 0 },
  英语: { sum: 0, count: 0 },
  物理: { sum: 0, count: 0 },
  化学: { sum: 0, count: 0 },
  生物: { sum: 0, count: 0 }
})

// 添加类型定义
interface SubjectTotal {
  sum: number
  count: number
}

type SubjectTotals = Record<SubjectType, SubjectTotal>

// 修改 subjectTotals 的定义
const subjectTotals = ref<Record<SubjectType, { sum: number; count: number }>>({
  语文: { sum: 0, count: 0 },
  数学: { sum: 0, count: 0 },
  英语: { sum: 0, count: 0 },
  物理: { sum: 0, count: 0 },
  化学: { sum: 0, count: 0 },
  生物: { sum: 0, count: 0 }
})

// 数据转换函数
const convertStudentResponse = (item: StudentItemResponse): StudentItem => ({
  id: item.id,
  studentId: item.student_id,
  name: item.name,
  gender: item.gender,
  className: item.class_name,
  phone: item.phone,
  email: item.email,
  joinDate: item.join_date,
  createTime: item.create_time
})

const convertClassResponse = (item: ClassItemResponse): ClassItem => ({
  id: item.id,
  className: item.class_name,
  studentCount: item.student_count,
  teacher: item.teacher,
  createTime: item.create_time,
  description: item.description
})

// 获取统计数据
const fetchStatistics = async () => {
  try {
    const [studentRes, classRes] = await Promise.all([
      getStudentList(),
      getClassList()
    ])

    // 为 students 和 classes 添加类型断言
    if (studentRes.code === 200 && classRes.code === 200) {
      students.value = studentRes.data?.map(convertStudentResponse) || []
      classes.value = classRes.data?.map(convertClassResponse) || []
      classList.value = classes.value.map(c => c.className)

      // 更新基础统计数据
      summaryData.value[0].value = students.value.length.toString()
      summaryData.value[1].value = classes.value.length.toString()
      
      // 初始计算优秀率
      await calculateExcellentRate()
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 更新成绩分布数据
const updateGradeDistribution = async () => {
  if (!selectedClass.value) return

  try {
    // 获取选中班级的所有学生
    const classStudents = students.value.filter(
      student => student.className === selectedClass.value
    )

    // 添加考试类型参数
    const scoreRes = await Promise.all(
      classStudents.map(student => getStudentScore(student.id, selectedExamType.value))
    )

    // 统计成绩分布
    const distribution = {
      '<60': 0,
      '60-70': 0,
      '70-80': 0,
      '80-90': 0,
      '90-100': 0
    }

    scoreRes.forEach(res => {
      if (res.code === 200 && res.data) {
        Object.values(res.data).forEach(score => {
          if (Number(score) < 60) distribution['<60']++
          else if (Number(score) < 70) distribution['60-70']++
          else if (Number(score) < 80) distribution['70-80']++
          else if (Number(score) < 90) distribution['80-90']++
          else distribution['90-100']++
        })
      }
    })

    // 更新图表数据
    gradeDistOption.value.series[0].data = Object.values(distribution)
  } catch (error) {
    console.error('更新成绩分布失败:', error)
  }
}

// 成绩分布图配置
const gradeDistOption = ref({
  title: {
    text: '成绩分布'
  },
  tooltip: {
    trigger: 'axis'
  },
  xAxis: {
    type: 'category',
    data: ['<60', '60-70', '70-80', '80-90', '90-100']
  },
  yAxis: {
    type: 'value'
  },
  series: [{
    data: [5, 15, 30, 35, 15],
    type: 'bar',
    showBackground: true,
    backgroundStyle: {
      color: 'rgba(180, 180, 180, 0.2)'
    }
  }]
})

// 修改雷达图配置
const radarOption = ref({
  title: {
    text: '各班级学科能力分析'
  },
  tooltip: {
    trigger: 'item'
  },
  legend: {
    orient: 'vertical',
    right: 10,
    top: 'middle'
  },
  radar: {
    indicator: [
      { name: '语文', max: 100 },
      { name: '数学', max: 100 },
      { name: '英语', max: 100 },
      { name: '物理', max: 100 },
      { name: '化学', max: 100 },
      { name: '生物', max: 100 }
    ]
  },
  series: [{
    type: 'radar',
    data: [] as Array<{
      name: string
      value: number[]
    }>
  }]
})

// 添加更新雷达图数据的方法
const updateRadarChart = async () => {
  try {
    const allClassesData = computed<ClassScoreData[]>(() => 
      classes.value.map(classItem => ({
        name: classItem.className,
        value: subjects.map(subject => {
          const stats = subjectTotals.value[subject]
          return stats.count > 0 ? Number((stats.sum / stats.count).toFixed(1)) : 0
        })
      }))
    )

    radarOption.value.series[0].data = allClassesData.value
  } catch (error) {
    console.error('更新雷达图失败:', error)
  }
}

// 修改平均分图表配置
const avgScoreOption = ref({
  title: {
    text: '班级各科平均分'
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'value',
    max: 100,
    axisLabel: {
      formatter: '{value} 分'
    }
  },
  yAxis: {
    type: 'category',
    data: ['语文', '数学', '英语', '物理', '化学', '生物']
  },
  series: [{
    name: '平均分',
    type: 'bar',
    data: [] as Array<{
      value: number
      name: string
    }>
  }]
})

// 修改数据更新逻辑
const updateAvgScores = async () => {
  if (!selectedClass.value) return

  try {
    // 获取选中班级的所有学生
    const classStudents = students.value.filter(
      student => student.className === selectedClass.value
    )

    // 添加考试类型参数
    const scoreRes = await Promise.all(
      classStudents.map(student => getStudentScore(student.id, selectedExamType.value))
    )

    // 计算各科平均分
    const subjectTotals = {
      语文: { sum: 0, count: 0 },
      数学: { sum: 0, count: 0 },
      英语: { sum: 0, count: 0 },
      物理: { sum: 0, count: 0 },
      化学: { sum: 0, count: 0 },
      生物: { sum: 0, count: 0 }
    }

    // 修改更新逻辑
    scoreRes.forEach(res => {
      if (res.code === 200 && res.data) {
        Object.entries(res.data).forEach(([subject, score]) => {
          if (subject in subjectTotals) {
            const subjectKey = subject as SubjectType
            subjectTotals[subjectKey].sum += Number(score)
            subjectTotals[subjectKey].count++
          }
        })
      }
    })

    // 计算平均分
    const avgScores = Object.entries(subjectTotals).map(([subject, data]) => ({
      subject,
      avg: data.count > 0 ? Number((data.sum / data.count).toFixed(1)) : 0
    }))

    // 更新图表数据
    avgScoreOption.value.series[0].data = avgScores.map(item => ({
      value: item.avg,
      name: item.subject
    }))

  } catch (error) {
    console.error('更新班级平均分失败:', error)
  }
}

const selectedClass = ref('')
const classList = ref<string[]>([])
const subjectList = ['语文', '数学', '英语', '物理', '化学', '生物']

// 添加考试类型数据
const examTypes = [
  { label: '月考', value: '月考' },
  { label: '期中考试', value: '期中' },
  { label: '期末考试', value: '期末' }
]
const selectedExamType = ref('月考')

// 添加考试类型变化处理
const handleExamTypeChange = async () => {
  await Promise.all([
    calculateExcellentRate(),  // 添加优秀率重新计算
    updateGradeDistribution(),
    updateAvgScores(),
    updateRadarChart()
  ])
}

// 监听班级选择变化
watch(selectedClass, () => {
  updateGradeDistribution()
  updateAvgScores()
})

// 修改计算优秀率的方法
const calculateExcellentRate = async () => {
  try {
    // 获取所有学生的成绩
    const scoreRes = await Promise.all(
      students.value.map(student => getStudentScore(student.id, selectedExamType.value))
    )

    let excellentCount = 0
    let totalStudents = 0

    scoreRes.forEach(res => {
      if (res.code === 200 && res.data) {
        // 过滤掉考试类型和考试时间字段，只保留科目成绩
        const scores = Object.entries(res.data)
          .filter(([key]) => subjectList.includes(key))
          .map(([_, score]) => Number(score))

        if (scores.length > 0) {  // 只有有成绩的学生才计入总数
          totalStudents++
          // 计算该学生的总分
          const totalScore = scores.reduce((sum, score) => sum + score, 0)
          // 计算满分（该学生实际考试科目数 * 100）
          const maxScore = scores.length * 100
          // 判断是否达到优秀标准（90%）
          if (totalScore >= maxScore * 0.9) {
            excellentCount++
          }
        }
      }
    })

    console.log('优秀率计算:', {
      totalStudents,
      excellentCount,
      rate: totalStudents > 0 ? (excellentCount / totalStudents) * 100 : 0
    })

    // 更新优秀率
    const excellentRate = totalStudents > 0 
      ? ((excellentCount / totalStudents) * 100).toFixed(1)
      : '0'
    summaryData.value[2].value = `${excellentRate}%`

  } catch (error) {
    console.error('计算优秀率失败:', error)
  }
}

// 修改初始化函数，添加雷达图更新
onMounted(async () => {
  await fetchStatistics()
  // 如果有班级数据，默认选择第一个班级
  if (classList.value.length > 0) {
    selectedClass.value = classList.value[0]
    await Promise.all([
      updateGradeDistribution(),
      updateAvgScores(),
      updateRadarChart()  // 添加雷达图更新
    ])
  }
})

// 基础数据状态
const reportData = ref<ScoreReportData>({
  classStats: {},
  subjectAnalysis: []
})

// 柱状图配置
const barChartOption = computed(() => ({
  title: { text: '各科平均分对比' },
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    data: subjects
  },
  yAxis: {
    type: 'value',
    max: 100,
    axisLabel: { formatter: '{value}分' }
  },
  series: [{
    name: '平均分',
    type: 'bar',
    data: subjects.map(subject => 
      reportData.value.classStats[selectedClass.value]?.averageScores[subject] || 0
    )
  }]
}))

// 雷达图配置
const radarChartOption = computed(() => ({
  title: { text: '班级成绩分布' },
  radar: {
    indicator: subjects.map(subject => ({
      name: subject,
      max: 100
    }))
  },
  series: [{
    type: 'radar',
    data: classes.value.map(classItem => ({
      name: classItem.className,
      value: subjects.map(subject => {
        const stats = subjectTotals.value[subject]
        return stats.count > 0 ? Number((stats.sum / stats.count).toFixed(1)) : 0
      })
    }))
  }]
}))

// 获取报表数据
const fetchReportData = async () => {
  if (!selectedClass.value || !selectedExamType.value) return
  
  try {
    loading.value = true
    const res = await getClassScores({
      className: selectedClass.value,
      examType: selectedExamType.value
    })
    
    if (res.code === 200 && res.data) {
      // 处理成绩数据，计算统计信息
      // ...
    }
  } catch (error) {
    console.error('获取成绩数据失败:', error)
    ElMessage.error('获取成绩数据失败')
  } finally {
    loading.value = false
  }
}

// 初始化数据
onMounted(async () => {
  try {
    const classRes = await getClassList()
    if (classRes.code === 200 && classRes.data) {
      classes.value = classRes.data.map(item => ({
        id: item.id,
        className: item.class_name,
        studentCount: item.student_count,
        teacher: item.teacher,
        createTime: item.create_time,
        description: item.description
      }))
      
      if (classes.value.length > 0) {
        selectedClass.value = classes.value[0].className
        await fetchReportData()
      }
    }
  } catch (error) {
    console.error('初始化数据失败:', error)
    ElMessage.error('初始化数据失败')
  }
})

// 监听选择变化
watch([selectedClass, selectedExamType], () => {
  fetchReportData()
})
</script>

<style scoped>
.report-container {
  padding: 24px;
  background: #f5f7fa;
  min-height: calc(100vh - 84px);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 顶部操作区样式 */
.operation-area {
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.exam-select {
  display: flex;
  align-items: center;
  gap: 12px;
}

.label {
  font-size: 14px;
  color: #606266;
}

/* 数据概览卡片样式 */
.overview-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.stat-card {
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-info {
  flex: 1;
}

.stat-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

/* 主要图表区域样式 */
.main-charts {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.chart-card {
  background: white;
  border-radius: 8px;
  transition: all 0.3s;
}

.chart-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 8px;
}

.chart-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

/* 图表容器样式 */
.chart {
  height: 320px;
}

.radar-chart .chart {
  height: 400px;
}

/* Element Plus 样式覆盖 */
:deep(.el-card) {
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

:deep(.el-card__header) {
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-select) {
  width: 180px;
}
</style>