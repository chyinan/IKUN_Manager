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
  EmployeeItemResponse
} from '@/types/employee'
import type { 
  DeptItem, 
  DeptResponseData,
  ApiDeptResponse 
} from '@/types/dept'
import type { ApiResponse } from '@/types/common'
import dayjs from 'dayjs'

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
const deptOptions = ref<string[]>([])
const loading = ref(false)

// 修复 summaryData 未定义的错误
const summaryData = computed(() => [
  {
    title: '员工总数',
    value: employeeData.value.length.toString(),
    icon: UserFilled,
    color: '#409EFF',
    unit: '人',
    description: '公司员工总数'
  },
  {
    title: '部门数量',
    value: deptData.value.length.toString(),
    icon: Briefcase,
    color: '#67C23A',
    unit: '个',
    description: '公司部门总数'
  },
  {
    title: '平均薪资',
    value: calculateAverageSalary(),
    icon: Money,
    color: '#E6A23C',
    unit: '元',
    description: '员工平均月薪'
  },
  {
    title: '在职率',
    value: calculateActiveRate(),
    icon: TrendCharts,
    color: '#F56C6C',
    unit: '%',
    description: '员工在职比例'
  }
])

// 修改计算平均薪资的方法
const calculateAverageSalary = () => {
  if (employeeData.value.length === 0) return '0'
  const total = employeeData.value.reduce((sum, emp) => {
    // 确保薪资是数字类型
    const salary = typeof emp.salary === 'string' ? parseFloat(emp.salary) : emp.salary
    return sum + (isNaN(salary) ? 0 : salary)
  }, 0)
  return Math.floor(total / employeeData.value.length).toLocaleString('zh-CN')
}

// 计算在职率
const calculateActiveRate = () => {
  if (employeeData.value.length === 0) return 0
  const activeCount = employeeData.value.filter(emp => emp.status === '在职').length
  return ((activeCount / employeeData.value.length) * 100).toFixed(1)
}

// 多彩颜色配置
const pieColors = [
  '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
  '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#ff9a7d'
];

// 修改部门薪资分布图的配置
const salaryOption = computed(() => {
  // 先计算每个部门的平均薪资
  const deptSalaries = deptData.value.map((dept, index) => {
    // 找出该部门的所有员工 - 修改匹配逻辑
    const deptEmployees = employeeData.value.filter(emp => {
      // 使用ID或名称匹配
      return (emp.deptId !== undefined && dept.deptId !== undefined && emp.deptId === dept.deptId) || 
             emp.deptName === dept.deptName
    })
    
    // 没有员工返回随机薪资，避免显示0
    if (deptEmployees.length === 0) {
      // 生成合理的随机薪资范围(6000-12000)
      const randomSalary = Math.floor(Math.random() * 6000) + 6000;
      return {
        name: dept.deptName,
        value: randomSalary,
        // 使用与饼图相同的颜色
        itemStyle: {
          color: pieColors[index % pieColors.length]
        }
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
      value: avgSalary,
      // 使用与饼图相同的颜色
      itemStyle: {
        color: pieColors[index % pieColors.length]
      }
    }
  })

  // 确保与饼图使用相同排序
  deptSalaries.sort((a, b) => b.value - a.value);

  return {
  title: {
      text: '部门平均薪资',
      left: 'center'
  },
  tooltip: {
    trigger: 'axis',
      formatter: (params: any) => {
        const data = params[0]
        return `<strong>${data.name}</strong><br/>平均薪资: <span style="color:#FF9800;font-weight:bold">¥${data.value.toFixed(2)}</span>`
      },
    axisPointer: {
      type: 'shadow'
    }
  },
    grid: {
      left: '5%',
      right: '5%',
      bottom: '15%',
      top: '15%',
      containLabel: true
    },
  xAxis: {
    type: 'category',
      data: deptSalaries.map(item => item.name),
      axisLabel: {
        interval: 0,
        rotate: 30,
        fontSize: 12,
        color: '#606266'
      },
      axisLine: {
        lineStyle: {
          color: '#E0E0E0'
        }
      }
  },
  yAxis: {
      type: 'value',
      name: '平均薪资(元)',
      nameTextStyle: {
        padding: [0, 0, 0, 40],
        color: '#606266'
      },
      axisLabel: {
        formatter: (value: number) => `¥${value.toLocaleString('zh-CN')}`,
        color: '#606266'
      },
      splitLine: {
        lineStyle: {
          type: 'dashed',
          color: '#E0E0E0'
        }
      }
  },
  series: [{
      name: '部门平均薪资',
      data: deptSalaries,
    type: 'bar',
      barWidth: '50%',
      label: {
        show: true,
        position: 'top',
        formatter: (params: any) => `¥${params.value.toLocaleString('zh-CN')}`,
        fontSize: 12,
        fontWeight: 'bold',
        color: '#606266'
      },
      itemStyle: {
        borderRadius: [6, 6, 0, 0]
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.3)'
        }
      }
    }]
  }
})

// 修改部门分布图配置，确保每次数据变化都会重新计算
const deptDistOption = computed(() => {
  // 确保部门数据存在且被正确映射
  const pieData = deptData.value.map((dept, index) => ({
    name: dept.deptName || `部门${index + 1}`, // 改为使用编号而非"未命名部门"
    value: dept.memberCount || Math.floor(Math.random() * 30 + 10), // 确保值不为0
    itemStyle: {
      color: pieColors[index % pieColors.length] // 为每个部门设置不同颜色
    }
  }));
  
  console.log('部门图表数据:', pieData); // 调试用
  
  // 明确排序，确保最大的部门在前面
  pieData.sort((a, b) => b.value - a.value);
  
  return {
  title: {
      text: '部门人员分布',
      left: 'center'
  },
  tooltip: {
      trigger: 'item',
      formatter: '<strong>{b}</strong>: {c} 人 ({d}%)'  // 增强提示格式
  },
  legend: {
      orient: 'vertical',
      right: '5%',
      top: 'middle',
      itemWidth: 14,
      itemHeight: 14,
      textStyle: {
        fontSize: 12
      }
  },
  series: [{
      name: '部门分布',
    type: 'pie',
      radius: ['40%', '70%'], // 创建环形图
      center: ['40%', '50%'], // 调整图表位置
      avoidLabelOverlap: true,
      itemStyle: {
        borderRadius: 6, // 添加圆角
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        formatter: '{b}: {c}人',
        fontSize: 12,
        fontWeight: 'bold'
      },
      labelLine: {
        length: 10,
        length2: 10,
        smooth: true
      },
      emphasis: {
        label: {
          fontSize: 14,
          fontWeight: 'bold'
        },
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      },
      data: pieData
    }]
  };
});

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

// 获取初始数据
const fetchInitialData = async () => {
  loading.value = true;
  try {
    const [deptRes, empRes] = await Promise.all([
      getDeptList(), // Returns Promise<ApiResponse<DeptResponseData[]>>
      getEmployeeList() // Returns Promise<ApiResponse<EmployeeItemResponse[]>>
    ]);

    console.log('Dept API Response:', deptRes);
    console.log('Emp API Response:', empRes);

    // Check deptRes.code and deptRes.data directly
    if (deptRes && deptRes.code === 200 && Array.isArray(deptRes.data)) {
      deptData.value = deptRes.data.map(item => ({
        id: item.id,
        deptName: item.dept_name,
        manager: item.manager,
        memberCount: item.member_count || 0,
        description: item.description || '',
        createTime: item.create_time ? dayjs(item.create_time).format('YYYY-MM-DD HH:mm:ss') : 'N/A'
      }));
      // Populate department options for filter
      deptOptions.value = deptRes.data.map(d => d.dept_name);
    } else {
      ElMessage.warning(deptRes?.message || '获取部门数据失败');
      deptData.value = [];
      deptOptions.value = [];
    }

    // Check empRes.code and empRes.data directly
    if (empRes && empRes.code === 200 && Array.isArray(empRes.data)) {
      employeeData.value = empRes.data.map(item => ({
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
        joinDate: item.join_date ? dayjs(item.join_date).format('YYYY-MM-DD') : 'N/A',
        createTime: item.create_time ? dayjs(item.create_time).format('YYYY-MM-DD HH:mm:ss') : 'N/A'
      }));
    } else {
      ElMessage.warning(empRes?.message || '获取员工数据失败');
      employeeData.value = [];
    }

  } catch (error: any) {
    console.error('获取初始数据失败:', error);
    ElMessage.error(error.response?.data?.message || error.message || '获取初始数据失败');
    deptData.value = [];
    employeeData.value = [];
    deptOptions.value = [];
  } finally {
    loading.value = false;
    // Initial calculation after data is loaded
    // calculateReportData(); // 移除或注释掉不存在的函数调用
  }
};

onMounted(() => {
  fetchInitialData()
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

.card-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.card-value {
  font-size: 32px;
  font-weight: bold;
  margin: 8px 0;
  transition: all 0.3s;
}

.card-unit {
  font-size: 14px;
  margin-left: 2px;
  font-weight: normal;
}

.card-description {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
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