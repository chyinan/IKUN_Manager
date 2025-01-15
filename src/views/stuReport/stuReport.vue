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
        <div class="card-compare">
          较上月 
          <span :class="item.trend > 0 ? 'up' : 'down'">
            {{ Math.abs(item.trend) }}%
            <el-icon>
              <component :is="item.trend > 0 ? 'ArrowUp' : 'ArrowDown'" />
            </el-icon>
          </span>
        </div>
      </el-card>
    </div>

    <!-- 图表区域 -->
    <div class="charts-container">
      <!-- 左侧图表 -->
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

      <!-- 右侧图表 -->
      <el-card class="chart-card">
        <template #header>
          <div class="chart-header">
            <span>各科成绩趋势</span>
            <el-select v-model="selectedSubject" placeholder="选择科目">
              <el-option v-for="item in subjectList" :key="item" :label="item" :value="item" />
            </el-select>
          </div>
        </template>
        <v-chart class="chart" :option="trendOption" />
      </el-card>
    </div>

    <!-- 下方图表 -->
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
import { ref, onMounted } from 'vue'
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
const summaryData = ref([
  {
    title: '总学生数',
    value: '1,234',
    trend: 5.2,
    icon: 'User',
    color: '#409EFF'
  },
  {
    title: '班级数量',
    value: '32',
    trend: 2.1,
    icon: 'School',
    color: '#67C23A'
  },
  {
    title: '优秀率',
    value: '85.6%',
    trend: 3.4,
    icon: 'Trophy',
    color: '#E6A23C'
  },
  {
    title: '平均分',
    value: '86.2',
    trend: -1.2,
    icon: 'DataLine',
    color: '#F56C6C'
  }
])

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

// 成绩趋势图配置
const trendOption = ref({
  title: {
    text: '成绩趋势'
  },
  tooltip: {
    trigger: 'axis'
  },
  xAxis: {
    type: 'category',
    data: ['1月', '2月', '3月', '4月', '5月', '6月']
  },
  yAxis: {
    type: 'value'
  },
  series: [{
    data: [82, 85, 84, 87, 86, 89],
    type: 'line',
    smooth: true
  }]
})

// 能力雷达图配置
const radarOption = ref({
  title: {
    text: '学科能力分析'
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
    data: [
      {
        value: [85, 90, 88, 82, 86, 84],
        name: '能力分布'
      }
    ]
  }]
})

const selectedClass = ref('')
const selectedSubject = ref('')
const classList = ['高三一班', '高三二班', '高三三班']
const subjectList = ['语文', '数学', '英语', '物理', '化学', '生物']
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

.card-compare {
  font-size: 14px;
  color: #909399;
}

.up {
  color: #67C23A;
}

.down {
  color: #F56C6C;
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
}

.bottom-charts .chart {
  height: 400px;
}
</style>