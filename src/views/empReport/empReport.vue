<template>
  <div class="report-container">
    <!-- 顶部数据卡片 -->
    <div class="data-cards">
      <el-card v-for="(item, index) in summaryData" :key="index" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon :size="24" :color="item.color">
              <component :is="item.icon" />
            </el-icon>
            <span>{{ item.title }}</span>
          </div>
        </template>
        <div class="card-content">
          <div class="card-value" :style="{color: item.color}">
            {{ item.value }}<span class="card-unit">{{ item.unit }}</span>
          </div>
          <div class="card-description">{{ item.description }}</div>
        </div>
      </el-card>
    </div>

    <!-- 图表区域 -->
    <div class="charts-container">
      <!-- 部门分布图 -->
      <el-card class="chart-card">
        <template #header>
          <div class="chart-header">
            <span>部门人员分布</span>
          </div>
        </template>
        <v-chart ref="deptChartRef" class="chart" :option="deptDistOption" autoresize />
      </el-card>

      <!-- 性别分布图 (新增) -->
      <el-card class="chart-card">
        <template #header>
          <div class="chart-header">
            <span>员工性别分布</span>
          </div>
        </template>
        <v-chart ref="genderChartRef" class="chart" :option="genderDistOption" autoresize />
      </el-card>

      <!-- 部门平均薪资图 -->
      <el-card class="chart-card">
        <template #header>
          <div class="chart-header">
            <span>部门平均薪资</span>
          </div>
        </template>
        <v-chart ref="salaryChartRef" class="chart" :option="salaryOption" autoresize />
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated, onDeactivated, nextTick, provide, inject } from 'vue'
import { ElMessage } from 'element-plus'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart, { THEME_KEY } from 'vue-echarts'
import { UserFilled, Briefcase, Money, TrendCharts } from '@element-plus/icons-vue'
import { getEmployeeStats } from '@/api/employee' // 只需导入一个API
import type { Ref } from 'vue'

use([
  CanvasRenderer,
  PieChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const isDark = inject<Ref<boolean>>('isDark', ref(false))
provide(THEME_KEY, computed(() => isDark.value ? 'dark' : 'light'))

const loading = ref(false)
const statsData = ref<any>(null) // 单一数据源

// 图表实例的 Ref
const deptChartRef = ref<InstanceType<typeof VChart> | null>(null)
const salaryChartRef = ref<InstanceType<typeof VChart> | null>(null)
const genderChartRef = ref<InstanceType<typeof VChart> | null>(null) // 新增

const summaryData = computed(() => [
  {
    title: '员工总数',
    value: statsData.value?.total?.toString() || '0',
    icon: UserFilled,
    color: '#409EFF',
    unit: '人',
    description: '公司员工总数'
  },
  {
    title: '部门数量',
    value: statsData.value?.deptCount?.toString() || '0',
    icon: Briefcase,
    color: '#67C23A',
    unit: '个',
    description: '公司部门总数'
  },
  {
    title: '平均薪资',
    value: statsData.value ? Math.floor(statsData.value.averageSalary).toLocaleString('zh-CN') : '0',
    icon: Money,
    color: '#E6A23C',
    unit: '元',
    description: '员工平均月薪'
  },
  {
    title: '在职率',
    value: statsData.value?.total > 0 ? ((statsData.value.activeCount / statsData.value.total) * 100).toFixed(1) : '0',
    icon: TrendCharts,
    color: '#F56C6C',
    unit: '%',
    description: '在职员工占总数比例'
  }
])

const lightPieColors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'];
const darkPieColors = ['#85a5ff', '#a0d911', '#ffd666', '#ff7875', '#adc6ff', '#5cdbd3', '#ff9c6e', '#d3adf7', '#ffadd2'];
const pieColors = computed(() => isDark.value ? darkPieColors : lightPieColors);

const deptDistOption = computed(() => {
  const chartData = statsData.value?.deptDistribution?.map((item: any, index: number) => ({
    name: item.name,
    value: item.value,
    itemStyle: { color: pieColors.value[index % pieColors.value.length] }
  })) || []
  chartData.sort((a: any, b: any) => b.value - a.value)
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', formatter: '<strong>{b}</strong>: {c} 人 ({d}%)' },
    legend: { orient: 'horizontal', bottom: '5%', itemWidth: 14, itemHeight: 14, textStyle: { fontSize: 12, fontFamily: "'Noto Sans SC', sans-serif" }},
    series: [{
      name: '部门分布',
      type: 'pie',
      radius: ['40%', '60%'],
      center: ['50%', '45%'], // 调整饼图中心，为下方图例留出空间
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderWidth: 2 },
      label: { show: true, formatter: '{b}: {c}人', fontSize: 12, fontWeight: 'bold', fontFamily: "'Noto Sans SC', sans-serif" },
      labelLine: { length: 10, length2: 10, smooth: true },
      emphasis: { label: { fontSize: 14, fontWeight: 'bold' } },
      data: chartData
    }]
  }
})

const genderDistOption = computed(() => {
  const chartData = statsData.value?.genderDistribution?.map((item: any) => ({
    name: item.name || '未指定',
    value: item.value,
  })) || []
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', formatter: '<strong>{b}</strong>: {c} 人 ({d}%)' },
    legend: { orient: 'horizontal', bottom: '5%', textStyle: { fontFamily: "'Noto Sans SC', sans-serif" }},
    series: [{
      name: '性别分布',
      type: 'pie',
      radius: '60%',
      center: ['50%', '45%'],
      color: pieColors.value, // 使用颜色系列
      itemStyle: { borderRadius: 6, borderWidth: 2 },
      label: { show: true, formatter: '{b}: {c}人 ({d}%)', position: 'outside', fontSize: 14, fontWeight: 'bold' },
      emphasis: { label: { fontSize: 16, fontWeight: 'bold' } },
      data: chartData
    }]
  }
})

const salaryOption = computed(() => {
  const chartData = [...(statsData.value?.salaryDistribution || [])].sort((a: any, b: any) => b.value - a.value)
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const value = params[0]?.value;
        // 安全性检查：确保value是有效数字
        if (value === null || value === undefined || isNaN(value)) {
          return `<strong>${params[0].name}</strong><br/>平均薪资: N/A`;
        }
        // 修改为显示整数
        return `<strong>${params[0].name}</strong><br/>平均薪资: <span style="color:#FF9800;font-weight:bold">¥${Math.floor(value).toLocaleString('zh-CN')}</span>`;
      },
      axisPointer: { type: 'shadow' }
    },
    grid: { left: '5%', right: '5%', bottom: '15%', top: '15%', containLabel: true },
    xAxis: { type: 'category', data: chartData.map((item: any) => item.name), axisLabel: { interval: 0, rotate: 30, fontSize: 12, fontFamily: "'Noto Sans SC', sans-serif" }},
    yAxis: { type: 'value', name: '平均薪资(元)', nameTextStyle: { padding: [0, 0, 0, 40], fontFamily: "'Noto Sans SC', sans-serif" }, axisLabel: { formatter: (value: number) => `¥${value.toLocaleString('zh-CN')}` }, splitLine: { lineStyle: { type: 'dashed' }}},
    series: [{
      name: '部门平均薪资',
      data: chartData.map((item:any, index: number) => ({
          name: item.name, // 添加name属性
          value: item.value,
          itemStyle: { color: pieColors.value[index % pieColors.value.length] }
      })),
      type: 'bar',
      barWidth: '50%',
      label: { show: true, position: 'top', formatter: (params: any) => `¥${Math.floor(params.value).toLocaleString('zh-CN')}`, fontSize: 12, fontWeight: 'bold' },
      itemStyle: { borderRadius: [6, 6, 0, 0] },
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.3)' } }
    }]
  }
})

function debounce(func: Function, wait: number) {
  let timeout: number | null = null
  return function executedFunction(...args: any[]) {
    const later = () => {
      timeout = null
      func(...args)
    }
    if (timeout !== null) clearTimeout(timeout)
    timeout = window.setTimeout(later, wait)
  }
}

const handleResize = () => {
  deptChartRef.value?.resize()
  salaryChartRef.value?.resize()
  genderChartRef.value?.resize() // 调整新图表
}

const debouncedResizeHandler = debounce(handleResize, 150)

const fetchInitialData = async () => {
  loading.value = true
  try {
    const res = await getEmployeeStats()
    if (res.code === 200 && res.data) {
      statsData.value = res.data
    } else {
      ElMessage.warning(res.message || '获取员工统计数据失败')
      statsData.value = null
    }
  } catch (error: any) {
    console.error('获取员工统计数据失败:', error)
    ElMessage.error(error.message || '获取统计数据失败')
    statsData.value = null
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchInitialData()
})

onActivated(() => {
  nextTick(() => { 
    handleResize()
  })
  window.addEventListener('resize', debouncedResizeHandler)
})

onDeactivated(() => {
  window.removeEventListener('resize', debouncedResizeHandler)
})
</script>

<style lang="scss" scoped>
.report-container {
  padding: 20px;
  background-color: var(--el-bg-color-page);
  min-height: calc(100vh - 84px);
  transition: background-color 0.3s;
}
.dark .report-container {
  background-color: #1f2937;
}

.data-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.data-cards .el-card,
.charts-container .el-card {
  border: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-card-bg-color, var(--el-bg-color-overlay));
  transition: background-color 0.3s, border-color 0.3s;
}

.dark .data-cards .el-card,
.dark .charts-container .el-card {
  background-color: #263445;
  border-color: var(--el-border-color-darker);
}

.card-header {
  display: flex;
  align-items: center;
  font-weight: bold;
  color: var(--el-text-color-primary);
  padding-bottom: 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.dark .card-header {
   color: #E0E0E0;
   border-bottom-color: var(--el-border-color-darker);
}

.card-header .el-icon {
  margin-right: 8px;
}

.card-content {
  padding-top: 15px;
}

.card-value {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
}

.dark .card-value {
  color: #ffffff;
}

.card-unit {
  font-size: 14px;
  margin-left: 5px;
  color: var(--el-text-color-secondary);
}

.card-description {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.dark .card-description {
  color: #A0A0A0;
}

.charts-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.chart {
  height: 400px;
  width: 100%;
}
</style>