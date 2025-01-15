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
      <!-- 左侧部门分布图 -->
      <el-card class="chart-card">
        <template #header>
          <div class="chart-header">
            <span>部门人员分布</span>
          </div>
        </template>
        <v-chart class="chart" :option="deptDistOption" />
      </el-card>

      <!-- 右侧薪资分布图 -->
      <el-card class="chart-card">
        <template #header>
          <div class="chart-header">
            <span>部门平均薪资</span>
            <el-select v-model="selectedYear" placeholder="选择年份">
              <el-option v-for="year in years" :key="year" :label="year" :value="year" />
            </el-select>
          </div>
        </template>
        <v-chart class="chart" :option="salaryOption" />
      </el-card>
    </div>

    <!-- 下方图表 -->
    <div class="bottom-charts">
      <el-card class="chart-card">
        <template #header>
          <div class="chart-header">
            <span>人员增长趋势</span>
          </div>
        </template>
        <v-chart class="chart" :option="growthOption" />
      </el-card>

      <el-card class="chart-card">
        <template #header>
          <div class="chart-header">
            <span>年龄结构分析</span>
          </div>
        </template>
        <v-chart class="chart" :option="ageOption" />
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { 
  PieChart, 
  BarChart, 
  LineChart 
} from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import {
  UserFilled,
  Briefcase,
  Money,
  TrendCharts
} from '@element-plus/icons-vue'

use([
  CanvasRenderer,
  PieChart,
  BarChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

// 顶部统计数据
const summaryData = ref([
  {
    title: '员工总数',
    value: '526',
    trend: 3.2,
    icon: 'UserFilled',
    color: '#409EFF'
  },
  {
    title: '部门数量',
    value: '8',
    trend: 0,
    icon: 'Briefcase',
    color: '#67C23A'
  },
  {
    title: '平均薪资',
    value: '¥12,450',
    trend: 5.8,
    icon: 'Money',
    color: '#E6A23C'
  },
  {
    title: '人效比',
    value: '89.5%',
    trend: 2.1,
    icon: 'TrendCharts',
    color: '#F56C6C'
  }
])

// 部门分布图配置
const deptDistOption = ref({
  title: {
    text: '部门人员分布'
  },
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: {c} ({d}%)'
  },
  legend: {
    orient: 'vertical',
    right: 10,
    top: 'center'
  },
  series: [{
    name: '部门分布',
    type: 'pie',
    radius: ['50%', '70%'],
    avoidLabelOverlap: false,
    data: [
      { value: 120, name: '技术部' },
      { value: 80, name: '销售部' },
      { value: 60, name: '市场部' },
      { value: 45, name: '财务部' },
      { value: 35, name: '人事部' }
    ]
  }]
})

// 薪资分布图配置
const salaryOption = ref({
  title: {
    text: '部门平均薪资(元/月)'
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  xAxis: {
    type: 'category',
    data: ['技术部', '销售部', '市场部', '财务部', '人事部']
  },
  yAxis: {
    type: 'value'
  },
  series: [{
    data: [15000, 12000, 11000, 10500, 9800],
    type: 'bar',
    showBackground: true,
    backgroundStyle: {
      color: 'rgba(180, 180, 180, 0.2)'
    }
  }]
})

// 人员增长趋势图配置
const growthOption = ref({
  title: {
    text: '人员增长趋势'
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
    data: [480, 492, 500, 510, 518, 526],
    type: 'line',
    smooth: true,
    areaStyle: {}
  }]
})

// 年龄结构图配置
const ageOption = ref({
  title: {
    text: '年龄结构分布'
  },
  tooltip: {
    trigger: 'item'
  },
  legend: {
    top: 'bottom'
  },
  series: [{
    name: '年龄分布',
    type: 'pie',
    radius: ['40%', '70%'],
    center: ['50%', '50%'],
    data: [
      { value: 25, name: '20-25岁' },
      { value: 38, name: '26-30岁' },
      { value: 22, name: '31-35岁' },
      { value: 10, name: '36-40岁' },
      { value: 5, name: '40岁以上' }
    ]
  }]
})

const selectedYear = ref('2024')
const years = ['2024', '2023', '2022']
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

.bottom-charts {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
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
</style>