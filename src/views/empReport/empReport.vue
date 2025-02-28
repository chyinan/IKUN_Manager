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

// 修改计算平均薪资的方法
const calculateAverageSalary = () => {
  if (employeeData.value.length === 0) return '0.00'
  const total = employeeData.value.reduce((sum, emp) => {
    // 确保薪资是数字类型
    const salary = typeof emp.salary === 'string' ? parseFloat(emp.salary) : emp.salary
    return sum + (isNaN(salary) ? 0 : salary)
  }, 0)
  return (total / employeeData.value.length).toFixed(2)
}

// 计算在职率
const calculateActiveRate = () => {
  if (employeeData.value.length === 0) return 0
  const activeCount = employeeData.value.filter(emp => emp.status === '在职').length
  return ((activeCount / employeeData.value.length) * 100).toFixed(1)
}

// 修改部门薪资分布图的配置
const salaryOption = computed(() => {
  // 先计算每个部门的平均薪资
  const deptSalaries = deptData.value.map(dept => {
    // 找出该部门的所有员工 - 这里需要修改匹配逻辑
    const deptEmployees = employeeData.value.filter(emp => 
      // 添加调试日志查看匹配情况
      {
        console.log(`比较: emp.deptName="${emp.deptName}" vs dept.deptName="${dept.deptName}"`)
        return emp.deptName === dept.deptName
      }
    )
    
    console.log(`${dept.deptName} 部门的员工:`, deptEmployees)

    // 没有员工返回0
    if (deptEmployees.length === 0) {
      console.log(`${dept.deptName} 没有找到员工`)
      return {
        name: dept.deptName,
        value: 0
      }
    }

    // 计算总薪资 - 确保 salary 是数字类型
    const totalSalary = deptEmployees.reduce((sum, emp) => {
      // 添加调试日志查看薪资值
      console.log(`${emp.name} 的薪资:`, emp.salary, typeof emp.salary)
      const salary = Number(emp.salary)
      return sum + (isNaN(salary) ? 0 : salary)
    }, 0)

    console.log(`${dept.deptName} 总薪资:`, totalSalary)

    // 计算平均值并保留两位小数
    const avgSalary = Number((totalSalary / deptEmployees.length).toFixed(2))
    console.log(`${dept.deptName} 平均薪资:`, avgSalary)
    
    return {
      name: dept.deptName,
      value: avgSalary
    }
  })

  // 调试日志
  console.log('部门薪资数据:', deptSalaries)

  return {
    title: {
      text: '部门平均薪资'
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const data = params[0]
        return `${data.name}: ¥${data.value.toFixed(2)}`
      }
    },
    xAxis: {
      type: 'category',
      data: deptSalaries.map(item => item.name),
      axisLabel: {
        interval: 0,
        rotate: 30
      }
    },
    yAxis: {
      type: 'value',
      name: '平均薪资(元)',
      axisLabel: {
        formatter: (value: number) => `¥${value.toFixed(0)}`
      }
    },
    series: [{
      data: deptSalaries.map(item => item.value),
      type: 'bar',
      label: {
        show: true,
        position: 'top',
        formatter: (params: any) => `¥${params.value.toFixed(2)}`
      },
      showBackground: true,
      backgroundStyle: {
        color: 'rgba(180, 180, 180, 0.2)'
      }
    }]
  }
})

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

// 修改数据转换函数
const convertEmployeeResponse = (item: EmployeeItemResponse): EmployeeItem => {
  console.log('转换前的员工数据:', item) // 添加调试日志
  return {
    id: item.id,
    empId: item.emp_id,
    name: item.name,
    gender: item.gender,
    age: item.age,
    deptName: item.dept_name || '', // 移除 trim()，先检查数据
    position: item.position,
    salary: Number(item.salary || 0),
    status: item.status,
    phone: item.phone || '',
    email: item.email || '',
    joinDate: item.join_date ? new Date(item.join_date).toLocaleDateString('zh-CN') : '',
    createTime: item.create_time ? new Date(item.create_time).toLocaleString('zh-CN') : ''
  }
}

const convertDeptResponse = (item: DeptResponseData): DeptItem => ({
  id: item.id,
  deptName: item.dept_name?.trim() || '', // 添加可选链和默认值
  manager: item.manager || '',
  memberCount: item.member_count || 0,
  description: item.description || '',
  createTime: item.create_time ? new Date(item.create_time).toLocaleString('zh-CN') : ''
})

// 修改获取数据函数，添加更多错误处理
const fetchData = async () => {
  try {
    const [empRes, deptRes] = await Promise.all([
      getEmployeeList(),
      getDeptList()
    ])

    // 打印原始数据
    console.log('原始员工数据:', empRes.data)
    console.log('原始部门数据:', deptRes.data)

    if (empRes?.code === 200 && Array.isArray(empRes.data)) {
      employeeData.value = empRes.data
        .filter(item => item && item.dept_name) // 过滤掉没有部门的员工
        .map(item => {
          const converted = convertEmployeeResponse(item)
          console.log(`员工 ${converted.name} 的部门:`, converted.deptName) // 添加调试日志
          return converted
        })
      console.log('转换后的员工数据:', employeeData.value)
    }

    if (deptRes?.code === 200 && Array.isArray(deptRes.data)) {
      deptData.value = deptRes.data
        .filter(item => item && item.dept_name) // 过滤掉无效部门
        .map(item => {
          const converted = convertDeptResponse(item)
          console.log(`部门 ${converted.deptName} 的信息:`, converted) // 添加调试日志
          return converted
        })
      console.log('转换后的部门数据:', deptData.value)
    }

  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error('获取数据失败')
    // 设置默认空数组
    employeeData.value = []
    deptData.value = []
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