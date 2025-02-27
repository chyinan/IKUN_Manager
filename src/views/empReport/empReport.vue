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
import { ref, computed, onMounted } from 'vue'
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
import VChart from 'vue-echarts'
import { UserFilled, Briefcase, Money, TrendCharts } from '@element-plus/icons-vue'
import { getEmployeeList } from '@/api/employee'
import { getDeptList } from '@/api/dept'
import type { 
  EmployeeItem,
  EmployeeItemResponse,
  ApiEmployeeResponse 
} from '@/types/employee'
import type { 
  DeptItem, 
  DeptResponseData,
  ApiDeptResponse 
} from '@/types/dept'
import type { ApiResponse } from '@/types/common'

use([
  CanvasRenderer,
  PieChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

// 数据状态
const employeeData = ref<EmployeeItem[]>([])
const deptData = ref<DeptItem[]>([])

// 修复 summaryData 未定义的错误
const summaryData = computed(() => [
  {
    title: '员工总数',
    value: employeeData.value.length.toString(),
    icon: UserFilled,
    color: '#409EFF'
  },
  {
    title: '部门数量',
    value: deptData.value.length.toString(),
    icon: Briefcase,
    color: '#67C23A'
  },
  {
    title: '平均薪资',
    value: `¥${calculateAverageSalary()}`,
    icon: Money,
    color: '#E6A23C'
  },
  {
    title: '在职率',
    value: `${calculateActiveRate()}%`,
    icon: TrendCharts,
    color: '#F56C6C'
  }
])

// 计算平均薪资
const calculateAverageSalary = () => {
  if (employeeData.value.length === 0) return 0
  const total = employeeData.value.reduce((sum, emp) => sum + emp.salary, 0)
  return (total / employeeData.value.length).toFixed(2)
}

// 计算在职率
const calculateActiveRate = () => {
  if (employeeData.value.length === 0) return 0
  const activeCount = employeeData.value.filter(emp => emp.status === '在职').length
  return ((activeCount / employeeData.value.length) * 100).toFixed(1)
}

// 薪资分布图配置
const salaryOption = computed(() => ({
  title: {
    text: '部门薪资分布'
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  xAxis: {
    type: 'category',
    data: deptData.value.map(dept => dept.deptName)
  },
  yAxis: {
    type: 'value',
    name: '平均薪资(元)'
  },
  series: [{
    data: deptData.value.map(dept => {
      const deptEmployees = employeeData.value.filter(emp => emp.deptName === dept.deptName)
      const avgSalary = deptEmployees.length > 0
        ? deptEmployees.reduce((sum, emp) => sum + emp.salary, 0) / deptEmployees.length
        : 0
      return Number(avgSalary.toFixed(2))
    }),
    type: 'bar',
    showBackground: true,
    backgroundStyle: {
      color: 'rgba(180, 180, 180, 0.2)'
    }
  }]
}))

// 添加部门分布图配置
const deptDistOption = computed(() => ({
  title: {
    text: '部门人员分布'
  },
  tooltip: {
    trigger: 'item'
  },
  series: [{
    type: 'pie',
    radius: '70%',
    data: deptData.value.map(dept => ({
      name: dept.deptName,
      value: dept.memberCount
    }))
  }]
}))

// 添加数据转换函数
const convertEmployeeResponse = (item: EmployeeItemResponse): EmployeeItem => ({
  id: item.id,
  empId: item.emp_id,
  name: item.name,
  gender: item.gender,
  age: item.age,
  deptName: item.dept_name,
  position: item.position,
  salary: item.salary,
  status: item.status,
  phone: item.phone || '',
  email: item.email || '',
  joinDate: new Date(item.join_date).toLocaleDateString('zh-CN'),
  createTime: new Date(item.create_time).toLocaleString('zh-CN')
})

const convertDeptResponse = (item: DeptResponseData): DeptItem => ({
  id: item.id,
  deptName: item.dept_name,
  manager: item.manager,
  memberCount: item.member_count,
  description: item.description,
  createTime: new Date(item.create_time).toLocaleString('zh-CN')
})

// 获取数据
const fetchData = async () => {
  try {
    const [empRes, deptRes] = await Promise.all([
      getEmployeeList(),
      getDeptList()
    ])

    if (empRes.code === 200 && Array.isArray(empRes.data)) {
      employeeData.value = empRes.data.map(convertEmployeeResponse)
    }

    if (deptRes.code === 200 && Array.isArray(deptRes.data)) {
      deptData.value = deptRes.data.map(convertDeptResponse)
    }
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error('获取数据失败')
  }
}

onMounted(() => {
  fetchData()
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