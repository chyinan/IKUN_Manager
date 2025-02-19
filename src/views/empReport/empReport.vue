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
          </div>
        </template>
        <v-chart class="chart" :option="salaryOption" />
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { 
  PieChart, 
  BarChart 
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
import { getEmployeeList } from '@/api/employee'
import { getDeptList } from '@/api/dept'
import type { EmployeeData } from '@/api/employee'

use([
  CanvasRenderer,
  PieChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

// 基础数据
const summaryData = ref([
  {
    title: '员工总数',
    value: '0',
    icon: 'UserFilled',
    color: '#409EFF'
  },
  {
    title: '部门数量',
    value: '0',
    icon: 'Briefcase',
    color: '#67C23A'
  },
  {
    title: '平均薪资',
    value: '¥0',
    icon: 'Money',
    color: '#E6A23C'
  },
  {
    title: '在职率',
    value: '0%',
    icon: 'TrendCharts',
    color: '#F56C6C'
  }
])

// 部门分布数据
const deptDistOption = ref({
  title: { text: '部门人员分布' },
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
    data: []
  }]
})

// 部门平均薪资
const salaryOption = ref({
  title: { text: '部门平均薪资(元/月)' },
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' }
  },
  xAxis: {
    type: 'category',
    data: []
  },
  yAxis: { type: 'value' },
  series: [{
    data: [],
    type: 'bar',
    showBackground: true,
    backgroundStyle: {
      color: 'rgba(180, 180, 180, 0.2)'
    }
  }]
})

// 获取统计数据
const fetchStatistics = async () => {
  try {
    const [empRes, deptRes] = await Promise.all([
      getEmployeeList(),
      getDeptList()
    ])

    if (empRes.code === 200 && empRes.data) {
      const employees = empRes.data
      const depts = deptRes.data

      // 更新顶部统计卡片
      const totalEmployees = employees.length
      const totalDepts = depts.length
      const avgSalary = employees.reduce((sum, emp) => sum + Number(emp.salary), 0) / totalEmployees
      const activeEmployees = employees.filter(emp => emp.status === '在职').length
      const activeRate = ((activeEmployees / totalEmployees) * 100).toFixed(1)

      summaryData.value[0].value = totalEmployees.toString()
      summaryData.value[1].value = totalDepts.toString()
      summaryData.value[2].value = `¥${avgSalary.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`
      summaryData.value[3].value = `${activeRate}%`

      // 更新部门分布图
      const deptStats = depts.map(dept => ({
        name: dept.dept_name,
        value: employees.filter(emp => emp.department === dept.dept_name).length
      }))
      deptDistOption.value.series[0].data = deptStats

      // 更新部门薪资图
      const deptSalaries = depts.map(dept => {
        const deptEmps = employees.filter(emp => emp.department === dept.dept_name)
        const avgSalary = deptEmps.reduce((sum, emp) => sum + Number(emp.salary), 0) / deptEmps.length
        return {
          dept: dept.dept_name,
          salary: avgSalary
        }
      })

      salaryOption.value.xAxis.data = deptSalaries.map(d => d.dept)
      salaryOption.value.series[0].data = deptSalaries.map(d => d.salary)
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 初始化
onMounted(() => {
  fetchStatistics()
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
  justify-content: flex-start;  /* 修改为左对齐 */
  align-items: center;
}

.chart {
  height: 300px;
}

:deep(.el-card) {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}
</style>