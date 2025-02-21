<template>
  <div class="report-container">
    <!-- 顶部数据卡片 -->
    <div class="data-cards">
      <el-card v-for="(item, index) in summaryData" :key="index">
        <template #header>
          <div class="card-header">
            <el-icon :size="24" :color="item.color">
              <component :is="item.icon" />
            </el-icon>
            <span>{{ item.title }}</span>
          </div>
        </template>
        <div class="card-value">{{ item.value }}</div>
      </el-card>
    </div>

    <!-- 图表区域 -->
    <div class="charts-container">
      <!-- 左侧成绩分布图 -->
      <el-card class="chart-card">
        <template #header>
          <div class="chart-header">
            <span>班级成绩分布</span>
            <el-select v-model="selectedClass" placeholder="选择班级">
              <el-option v-for="item in classList" :key="item" :label="item" :value="item" />
            </el-select>
          </div>
        </template>
        <v-chart class="chart" :option="gradeDistOption" />
      </el-card>

      <!-- 右侧各科平均分图 -->
      <el-card class="chart-card">
        <template #header>
          <div class="chart-header">
            <span>班级各科平均分</span>
          </div>
        </template>
        <v-chart class="chart" :option="avgScoreOption" />
      </el-card>
    </div>

    <!-- 底部雷达图 -->
    <div class="bottom-charts">
      <el-card class="chart-card">
        <template #header>
          <span>学科能力分析</span>
        </template>
        <v-chart class="chart" :option="radarOption" />
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
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
import { getStudentScore } from '@/api/score'

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
const summaryData = ref([
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
  },
  {
    title: '平均分',
    value: '0',
    icon: 'DataLine',
    color: '#F56C6C'
  }
])

// 添加班级和学生数据的响应式引用
const students = ref([])
const classes = ref([])

// 获取统计数据
const fetchStatistics = async () => {
  try {
    const [studentRes, classRes] = await Promise.all([
      getStudentList(),
      getClassList()
    ])

    if (studentRes.code === 200 && classRes.code === 200) {
      students.value = studentRes.data
      classes.value = classRes.data
      classList.value = classRes.data.map(item => item.class_name)

      // 获取学生成绩数据
      const scoreRes = await Promise.all(
        students.value.map(student => getStudentScore(student.id))
      )

      // 计算成绩统计数据
      let totalScore = 0
      let excellentCount = 0
      let totalScoreCount = 0

      scoreRes.forEach(res => {
        if (res.code === 200 && res.data) {
          const scores = Object.values(res.data)
          scores.forEach(score => {
            totalScore += score
            if (score >= 90) excellentCount++
            totalScoreCount++
          })
        }
      })

      // 更新统计卡片
      summaryData.value[0].value = students.value.length.toString()
      summaryData.value[1].value = classes.value.length.toString()
      summaryData.value[2].value = totalScoreCount > 0 
        ? `${((excellentCount / totalScoreCount) * 100).toFixed(1)}%` 
        : '0%'
      summaryData.value[3].value = totalScoreCount > 0 
        ? (totalScore / totalScoreCount).toFixed(1) 
        : '0'

      // 更新成绩分布图
      updateGradeDistribution()
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
      student => student.class_name === selectedClass.value
    )

    // 获取这些学生的成绩
    const scoreRes = await Promise.all(
      classStudents.map(student => getStudentScore(student.id))
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
          if (score < 60) distribution['<60']++
          else if (score < 70) distribution['60-70']++
          else if (score < 80) distribution['70-80']++
          else if (score < 90) distribution['80-90']++
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

// 能力雷达图配置
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
    data: []
  }]
})

// 添加更新雷达图数据的方法
const updateRadarChart = async () => {
  try {
    // 获取所有班级的成绩数据
    const allClassesData = await Promise.all(
      classes.value.map(async (classItem) => {
        // 获取该班级所有学生
        const classStudents = students.value.filter(
          student => student.class_name === classItem.class_name
        )

        // 获取所有学生的成绩
        const scoreRes = await Promise.all(
          classStudents.map(student => getStudentScore(student.id))
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

        scoreRes.forEach(res => {
          if (res.code === 200 && res.data) {
            Object.entries(res.data).forEach(([subject, score]) => {
              if (subjectTotals[subject]) {
                subjectTotals[subject].sum += score
                subjectTotals[subject].count++
              }
            })
          }
        })

        // 计算平均分
        const avgScores = subjectList.map(subject => {
          const data = subjectTotals[subject]
          return data.count > 0 ? Number((data.sum / data.count).toFixed(1)) : 0
        })

        return {
          name: classItem.class_name,
          value: avgScores
        }
      })
    )

    // 更新雷达图数据
    radarOption.value.series[0].data = allClassesData

  } catch (error) {
    console.error('更新雷达图失败:', error)
  }
}

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
    data: [],
    label: {
      show: true,
      position: 'right',
      formatter: '{c} 分'
    }
  }]
})

// 更新班级各科平均分数据
const updateAvgScores = async () => {
  if (!selectedClass.value) return

  try {
    // 获取选中班级的所有学生
    const classStudents = students.value.filter(
      student => student.class_name === selectedClass.value
    )

    // 获取这些学生的成绩
    const scoreRes = await Promise.all(
      classStudents.map(student => getStudentScore(student.id))
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

    scoreRes.forEach(res => {
      if (res.code === 200 && res.data) {
        Object.entries(res.data).forEach(([subject, score]) => {
          if (subjectTotals[subject]) {
            subjectTotals[subject].sum += score
            subjectTotals[subject].count++
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
    avgScoreOption.value.series[0].data = avgScores.map(item => item.avg)

  } catch (error) {
    console.error('更新班级平均分失败:', error)
  }
}

const selectedClass = ref('')
const classList = ref<string[]>([])
const subjectList = ['语文', '数学', '英语', '物理', '化学', '生物']

// 监听班级选择变化
watch(selectedClass, () => {
  updateGradeDistribution()
  updateAvgScores()
})

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
</script>

<style scoped>
.report-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 84px);
}

.data-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  color: #606266;
}

.card-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin: 10px 0;
}

.charts-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.chart-card {
  background: white;
  border-radius: 8px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart {
  height: 300px;
}

:deep(.el-card) {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.bottom-charts {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.bottom-charts .chart-card {
  width: 50%;
}

.bottom-charts .chart {
  height: 400px;
}
</style>