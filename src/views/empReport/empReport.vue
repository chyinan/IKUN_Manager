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
import { ref, computed, onMounted, watch } from 'vue'
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

// 扩展员工类型定义，添加deptId字段
interface ExtendedEmployeeItem extends EmployeeItem {
  deptId?: number | string;
}

// 扩展部门类型定义，添加deptId字段
interface ExtendedDeptItem extends DeptItem {
  deptId?: number | string;
}

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
const employeeData = ref<ExtendedEmployeeItem[]>([])
const deptData = ref<ExtendedDeptItem[]>([])

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
    // 找出该部门的所有员工 - 修改匹配逻辑
    const deptEmployees = employeeData.value.filter(emp => {
      // 使用ID或名称匹配
      return (emp.deptId !== undefined && dept.deptId !== undefined && emp.deptId === dept.deptId) || 
             emp.deptName === dept.deptName
    })
    
    // 没有员工返回0
    if (deptEmployees.length === 0) {
      return {
        name: dept.deptName,
        value: 0
      }
    }

    // 计算总薪资 - 确保 salary 是数字类型
    const totalSalary = deptEmployees.reduce((sum, emp) => {
      // 确保薪资是数字
      const salary = typeof emp.salary === 'string' ? parseFloat(emp.salary) : emp.salary
      return sum + (isNaN(salary) ? 0 : salary)
    }, 0)
    
    // 计算平均值并保留两位小数
    const avgSalary = Number((totalSalary / deptEmployees.length).toFixed(2))
    
    return {
      name: dept.deptName,
      value: avgSalary
    }
  })

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
const convertEmployeeResponse = (item: EmployeeItemResponse): ExtendedEmployeeItem => {
  // 检查item的类型，确保安全访问属性
  const empData = item as any; // 使用any类型暂时绕过类型检查
  
  return {
    id: empData.id,
    empId: empData.emp_id,
    name: empData.name,
    gender: empData.gender,
    age: empData.age,
    // 使用any类型后可以安全访问可能不存在的属性
    deptId: empData.dept_id || empData.deptId || undefined,
    deptName: empData.dept_name || '',
    position: empData.position,
    // 确保薪资是数字类型，符合EmployeeItem的定义
    salary: typeof empData.salary === 'string' ? parseFloat(empData.salary || '0') : (empData.salary || 0),
    status: empData.status,
    phone: empData.phone || '',
    email: empData.email || '',
    joinDate: empData.join_date ? new Date(empData.join_date).toLocaleDateString('zh-CN') : '',
    createTime: empData.create_time ? new Date(empData.create_time).toLocaleString('zh-CN') : ''
  }
}

const convertDeptResponse = (item: DeptResponseData): ExtendedDeptItem => {
  // 检查item的类型，确保安全访问属性
  const deptData = item as any; // 使用any类型暂时绕过类型检查
  
  return {
    id: deptData.id,
    // 使用any类型后可以安全访问可能不存在的属性
    deptId: deptData.dept_id || deptData.deptId || deptData.id,
    deptName: deptData.dept_name || '',
    manager: deptData.manager || '',
    memberCount: deptData.member_count || 0,
    description: deptData.description || '',
    createTime: deptData.create_time ? new Date(deptData.create_time).toLocaleString('zh-CN') : ''
  }
}

// 修改获取数据函数，添加更多错误处理
const fetchData = async () => {
  try {
    const [empRes, deptRes] = await Promise.all([
      getEmployeeList(),
      getDeptList()
    ])

    if (empRes?.code === 200 && Array.isArray(empRes.data)) {
      employeeData.value = empRes.data
        .filter(item => item) // 过滤掉无效数据
        .map(item => convertEmployeeResponse(item))
    } else {
      console.error('员工数据格式错误:', empRes)
      ElMessage.warning('员工数据获取异常')
      employeeData.value = []
    }

    if (deptRes?.code === 200 && Array.isArray(deptRes.data)) {
      deptData.value = deptRes.data
        .filter(item => item) // 过滤掉无效数据
        .map(item => convertDeptResponse(item))
    } else {
      console.error('部门数据格式错误:', deptRes)
      ElMessage.warning('部门数据获取异常')
      deptData.value = []
    }

    // 如果数据为空，显示提示
    if (employeeData.value.length === 0) {
      ElMessage.warning('没有获取到员工数据')
    }
    if (deptData.value.length === 0) {
      ElMessage.warning('没有获取到部门数据')
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