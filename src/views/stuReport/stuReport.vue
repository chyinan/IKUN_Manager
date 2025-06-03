<template>
  <div class="report-container">
    <!-- 顶部操作区 -->
    <div class="operation-area">
      <div class="filter-item">
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
      <div class="filter-item">
        <span class="label">选择班级：</span>
        <el-select 
          v-model="selectedClass" 
          placeholder="选择班级"
          @change="handleMainClassChange" 
        >
          <el-option 
            v-for="item in classList" 
            :key="item" 
            :label="item" 
            :value="item" />
        </el-select>
      </div>
    </div>

    <!-- 数据概览卡片 -->
    <div class="overview-cards">
      <el-card 
        v-for="(item, index) in summaryData" 
        :key="index"
        class="stat-card"
        :class="{ highlight: index === 1 }"> <!-- 优秀率卡片（现在是索引1）特殊样式 -->
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
            <!-- 主班级选择框已移到顶部 -->
          </div>
        </template>
        <v-chart class="chart" :option="gradeDistOption" :theme="chartTheme" autoresize />
      </el-card>

      <!-- 右侧平均分 -->
      <el-card class="chart-card average-chart">
        <template #header>
          <div class="chart-header">
            <span class="chart-title">各科平均分</span>
          </div>
        </template>
        <v-chart class="chart" :option="avgScoreOption" :theme="chartTheme" autoresize />
      </el-card>
    </div>

    <!-- 底部学科能力分析 -->
    <el-card class="chart-card radar-chart">
      <template #header>
        <div class="chart-header">
          <span class="chart-title">班级学科能力分析</span>
          <div class="compare-controls" style="display: flex; gap: 10px; align-items: center;">
            <span style="font-size: 14px; color: #9ca3af;">对比班级:</span>
            <el-select
              v-model="selectedComparativeClassName"
              placeholder="选择对比班级"
              size="small"
              clearable
              @change="handleComparativeClassChange"
            >
              <el-option
                v-for="item in comparativeClassList"
                :key="item"
                :label="item"
                :value="item"
              />
            </el-select>
          </div>
        </div>
      </template>
      <v-chart class="chart" :option="radarOption" :theme="chartTheme" autoresize />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
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
import VChart, { THEME_KEY } from 'vue-echarts'
import { 
  User, 
  School, 
  Trophy, 
  DataLine 
} from '@element-plus/icons-vue'
import { getStudentList } from '@/api/student'
import { getClassList } from '@/api/class'
import { getStudentScoreByType, getClassScores } from '@/api/score'
import type { SubjectType as ImportedSubjectType } from '@/types/score'  // 重命名导入的类型
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
} from '@/types/common'
import type { 
  ClassItemResponse,
  ClassItem 
} from '@/types/common'
import type { ScoreStatistics } from '@/types/score'
import dayjs from 'dayjs'
import { provide } from 'vue'

// 定义科目类型
const subjects: ImportedSubjectType[] = ['语文', '数学', '英语', '物理', '化学', '生物']

// 使用非只读数组
const subjectList = [...subjects] as ImportedSubjectType[]

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
    title: '优秀率',
    value: '0%',
    icon: 'Trophy',
    color: '#E6A23C'
  }
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

type SubjectTotals = Record<ImportedSubjectType, SubjectTotal>

// 修改 subjectTotals 的定义
const subjectTotals = ref<Record<ImportedSubjectType, { sum: number; count: number }>>({
  语文: { sum: 0, count: 0 },
  数学: { sum: 0, count: 0 },
  英语: { sum: 0, count: 0 },
  物理: { sum: 0, count: 0 },
  化学: { sum: 0, count: 0 },
  生物: { sum: 0, count: 0 }
})

// 数据转换函数 - 确保参数类型匹配 common.ts
const convertStudentResponse = (item: StudentItemResponse): StudentItem => {
  return {
    id: item.id,
    studentId: item.student_id,
    name: item.name,
    gender: item.gender,
    classId: item.class_id,
    className: item.class_name,
    phone: item.phone || '',
    email: item.email || '',
    joinDate: item.join_date ? dayjs(item.join_date).format('YYYY-MM-DD') : '-',
    createTime: item.create_time ? dayjs(item.create_time).format('YYYY-MM-DD HH:mm:ss') : '-'
  }
}

interface ClassItem {
  id: number;
  className: string;
  teacher: string;
  studentCount: number;
  createTime: string;
  description: string;
}

const convertClassResponse = (item: any): ClassItem => {
  return {
    id: item.id,
    className: item.class_name,
    teacher: item.teacher || '-',
    studentCount: item.student_count || 0,
    createTime: item.create_time ? dayjs(item.create_time).format('YYYY-MM-DD HH:mm:ss') : '-',
    description: item.description || '-'
  };
};

// 获取统计数据
const fetchStatistics = async () => {
  loading.value = true
  try {
    // 并行获取学生和班级列表
    const [studentRes, classRes] = await Promise.all([
      getStudentList(), // 假设返回 Promise<ApiResponse<StudentItemResponse[]>>
      getClassList()    // 假设返回 Promise<ApiResponse<ClassItemResponse[]>>
    ])

    console.log('Student API Response:', studentRes)
    console.log('Class API Response:', classRes)

    // 处理学生数据
    if (studentRes && studentRes.code === 200 && Array.isArray(studentRes.data)) {
      // 确保使用 common.ts 的类型进行映射
      students.value = studentRes.data
        .filter(item => item && item.id && item.student_id && item.name && item.class_id)
        .map(convertStudentResponse); // 直接传递转换函数
      console.log('Processed Students:', students.value)
    } else {
      ElMessage.warning(studentRes?.message || '获取学生数据失败')
      students.value = []
    }

    // 处理班级数据
    if (classRes && classRes.code === 200 && Array.isArray(classRes.data)) {
      // 确保使用 common.ts 的类型进行映射
      classes.value = classRes.data.map((item: ClassItemResponse): ClassItem => ({
        id: item.id,
        className: item.class_name,
        teacher: item.teacher,
        studentCount: item.student_count,
        createTime: item.create_time ? dayjs(item.create_time).format('YYYY-MM-DD HH:mm:ss') : '-',
        description: item.description || '' // 处理 null/undefined
      }));
      console.log('Processed Classes:', classes.value)
    } else {
      ElMessage.warning(classRes?.message || '获取班级数据失败')
      classes.value = []
    }

    // 数据加载完成后计算报表数据
    // calculateReportData(); // 移除或注释掉不存在的函数调用

  } catch (error: any) {
    console.error('获取统计数据失败:', error)
    ElMessage.error(error.message || '获取统计数据失败')
    students.value = []
    classes.value = []
  } finally {
    loading.value = false
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
      classStudents.map(student => getStudentScoreByType(student.id, selectedExamType.value))
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
  backgroundColor: '#ffffff', // Default to light mode background
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
  backgroundColor: '#ffffff', // Default to light mode background
  tooltip: {
    trigger: 'axis', // 改为 axis 触发，期望能捕获到轴信息
    formatter: (params: any) => {
      // 当 trigger 为 'axis' 时, params 是一个数组，每个元素代表一个系列在该轴点上的数据
      if (!params || params.length === 0) {
        return ''; // 如果没有数据系列，则不显示tooltip
      }

      // 假设 params[0].name 是当前悬停的轴的名称（即学科名称）
      // 这是ECharts在某些图表类型中axis trigger的常见行为，但不保证对radar完全适用
      const hoveredSubjectName = params[0].name; 

      if (!hoveredSubjectName) {
        // 如果无法获取悬停的学科名称，则可能需要一个备用显示逻辑
        // 例如，显示所有系列的所有数据，或者提示信息
        let fallbackText = '';
        params.forEach((seriesParam: any, index: number) => {
          fallbackText += `${seriesParam.seriesName}<br/>`;
          const indicators = radarOption.value.radar.indicator;
          if (indicators && seriesParam.value && indicators.length === seriesParam.value.length) {
            indicators.forEach((indicator: any, i: number) => {
              fallbackText += `  ${indicator.name}: ${seriesParam.value[i]}<br/>`;
            });
          }
          if (index < params.length - 1) {
            fallbackText += '<hr style="margin: 5px 0;"/>';
          }
        });
        return fallbackText || '详细数据';
      }

      // 查找当前悬停学科在 indicators 中的索引
      const subjectIndex = radarOption.value.radar.indicator.findIndex(
        (indicator: any) => indicator.name === hoveredSubjectName
      );

      if (subjectIndex === -1) {
        // 如果 hoveredSubjectName 不是一个有效的学科名称，可能返回默认的tooltip或错误提示
        return `学科 ${hoveredSubjectName} 未找到`;
      }

      let tooltipText = `<strong>${hoveredSubjectName}</strong><br/>`;

      params.forEach((seriesParam: any) => {
        // seriesParam.seriesName 是班级名称
        // seriesParam.value 是该班级在所有学科上的分数数组
        if (seriesParam.value && typeof seriesParam.value[subjectIndex] !== 'undefined') {
          // seriesParam.marker 是图例标记的HTML字符串
          tooltipText += `${seriesParam.marker || '● '}${seriesParam.seriesName}: ${seriesParam.value[subjectIndex]}<br/>`;
        }
      });

      return tooltipText;
    }
  },
  legend: {
    data: [] as string[], // 图例数据，动态填充
    orient: 'vertical',
    right: 10,
    top: 'middle',
    // type: 'scroll' // 如果班级过多，可以考虑滚动图例
  },
  radar: {
    indicator: [ // 指示器（轴定义）会在fetchReportData中根据subjects动态设置
      // { name: '语文', max: 100 }, ...
    ]
  },
  series: [{
    type: 'radar',
    data: [] as Array<{ // 系列数据，动态填充
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
  backgroundColor: '#ffffff', // Default to light mode background
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
      classStudents.map(student => getStudentScoreByType(student.id, selectedExamType.value))
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
            const subjectKey = subject as ImportedSubjectType
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

// 新增：用于对比班级选择
const selectedComparativeClassName = ref<string>('');
const comparativeClassAvgScores = ref<Array<{ name: string; value: number }> | null>(null);

const comparativeClassList = computed<string[]>(() => {
  return classes.value
    .map(c => c.className)
    .filter(className => className !== selectedClass.value);
});

// 添加考试类型数据
const examTypes = [
  { label: '月考', value: '月考' },
  { label: '期中考试', value: '期中' },
  { label: '期末考试', value: '期末' }
]
const selectedExamType = ref('月考')

// 考试类型选择框的 @change handler (如果之前没有，现在加上，尽管watch也会处理)
// const handleExamTypeChange = () => {
//   // The watch on selectedExamType will trigger data fetching.
//   // This function is primarily for the @change event if specific immediate actions are needed.
//   console.log('[handleExamTypeChange] Exam type changed to:', selectedExamType.value);
// };

// 主班级选择框的 @change handler (如果之前没有，现在加上，尽管watch也会处理)
// const handleMainClassChange = () => {
//   // The watch on selectedClass will trigger data fetching.
//   console.log('[handleMainClassChange] Main class changed to:', selectedClass.value);
// };

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
      students.value.map(student => getStudentScoreByType(student.id, selectedExamType.value))
    )

    let excellentCount = 0
    let totalStudents = 0

    scoreRes.forEach(res => {
      if (res.code === 200 && res.data) {
        // 过滤掉考试类型和考试时间字段，只保留科目成绩
        const scores = Object.entries(res.data)
          .filter(([key]) => subjectList.includes(key as ImportedSubjectType))
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
    summaryData.value[1].value = `${excellentRate}%`

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

// 新增：处理对比班级变化
const handleComparativeClassChange = async (newComparativeClassName: string | null) => {
  console.log('[handleComparativeClassChange] New comparative class name:', newComparativeClassName);
  if (newComparativeClassName && selectedExamType.value) {
    const comparativeClassData = classes.value.find(c => c.className === newComparativeClassName);
    if (comparativeClassData) {
      try {
        loading.value = true;
        console.log(`[handleComparativeClassChange] Fetching scores for comparative class ID: ${comparativeClassData.id}, Exam: ${selectedExamType.value}`);
        const res = await getClassScores(comparativeClassData.id, selectedExamType.value);
        if (res.code === 200 && res.data && Array.isArray(res.data)) {
          const compClassScores: ClassScoreData[] = res.data;
          const subjectTotalsForCompClass: Record<string, { sum: number; count: number }> = {};
          subjects.forEach(sub => subjectTotalsForCompClass[sub] = { sum: 0, count: 0 });

          compClassScores.forEach(studentScore => {
            if (studentScore.subjects) {
              for (const subjectName in studentScore.subjects) {
                if (subjects.includes(subjectName as ImportedSubjectType)) {
                  subjectTotalsForCompClass[subjectName].sum += Number(studentScore.subjects[subjectName]);
                  subjectTotalsForCompClass[subjectName].count++;
                }
              }
            }
          });
          comparativeClassAvgScores.value = subjects.map(subjectName => ({
            name: subjectName,
            value: subjectTotalsForCompClass[subjectName].count > 0
                     ? parseFloat((subjectTotalsForCompClass[subjectName].sum / subjectTotalsForCompClass[subjectName].count).toFixed(1))
                     : 0
          }));
          console.log('[handleComparativeClassChange] Comparative class average scores:', JSON.parse(JSON.stringify(comparativeClassAvgScores.value)));
        } else {
          ElMessage.warning(res?.message || '获取对比班级成绩数据失败');
          comparativeClassAvgScores.value = null;
        }
      } catch (error: any) {
        console.error('[handleComparativeClassChange] Error fetching/processing comparative class scores:', error);
        ElMessage.error('获取对比班级成绩时出错');
        comparativeClassAvgScores.value = null;
      } finally {
        loading.value = false;
      }
    } else {
      comparativeClassAvgScores.value = null; // Reset if class data not found
    }
  } else {
    comparativeClassAvgScores.value = null; // Clear data if comparative class is deselected
    console.log('[handleComparativeClassChange] Comparative class deselected or exam type missing.');
  }
  // 无论成功与否，都尝试更新雷达图（它会处理 comparativeClassAvgScores.value 为 null 的情况）
  await updateRadarChartWithMainAndComparativeData();
};

// 修改后的更新雷达图数据的核心逻辑
async function updateRadarChartWithMainAndComparativeData() {
  console.log('[updateRadarChartWithMainAndComparativeData] Attempting to update radar chart.');
  const mainClsData = classes.value.find(c => c.className === selectedClass.value);
  
  const radarSeriesData: Array<{ name: string; value: number[] }> = [];
  const legendData: string[] = [];

  // 1. 处理主班级数据 (从 avgScoreOption.value.series[0].data 获取)
  if (mainClsData && avgScoreOption.value && avgScoreOption.value.series[0] && avgScoreOption.value.series[0].data.length > 0) {
    const mainClassScores = avgScoreOption.value.series[0].data.map(item => item.value);
    if (mainClassScores.length === subjects.length) { // 确保数据完整
      radarSeriesData.push({
        name: mainClsData.className,
        value: mainClassScores,
      });
      legendData.push(mainClsData.className);
      console.log(`[updateRadarChart] Main class data for radar: ${mainClsData.className}`, JSON.parse(JSON.stringify(mainClassScores)));
    } else {
       console.warn(`[updateRadarChart] Main class (${mainClsData.className}) average score data length mismatch with subjects. Scores:`, avgScoreOption.value.series[0].data);
    }
  } else {
    console.log('[updateRadarChart] No main class data or avgScoreOption data available for radar.');
  }

  // 2. 处理对比班级数据
  if (selectedComparativeClassName.value && comparativeClassAvgScores.value) {
    const comparativeClassName = selectedComparativeClassName.value;
    const compScores = comparativeClassAvgScores.value.map(item => item.value);
     if (compScores.length === subjects.length) { // 确保数据完整
        radarSeriesData.push({
          name: comparativeClassName,
          value: compScores,
        });
        if (!legendData.includes(comparativeClassName)) { // 避免图例重复
             legendData.push(comparativeClassName);
        }
        console.log(`[updateRadarChart] Comparative class data for radar: ${comparativeClassName}`, JSON.parse(JSON.stringify(compScores)));
     } else {
        console.warn(`[updateRadarChart] Comparative class (${comparativeClassName}) average score data length mismatch with subjects. Scores:`, comparativeClassAvgScores.value);
     }
  } else {
     console.log('[updateRadarChart] No comparative class data available for radar.');
  }
  
  if (radarOption.value && radarOption.value.radar && radarOption.value.series && radarOption.value.legend) {
    radarOption.value.radar.indicator = subjects.map(subject => ({ name: subject, max: 100 }));
    radarOption.value.series[0].data = radarSeriesData;
    radarOption.value.legend.data = legendData; // 更新图例
    console.log('[updateRadarChart] Radar chart updated. Series Data:', JSON.parse(JSON.stringify(radarSeriesData)), 'Legend Data:', JSON.parse(JSON.stringify(legendData)));
  } else {
    console.warn('[updateRadarChart] radarOption structure is not as expected, cannot update radar chart.');
  }
}

// 获取报表数据
const fetchReportData = async () => {
  if (!selectedClass.value || !selectedExamType.value) {
    console.log('[fetchReportData] Aborting: selectedClass or selectedExamType is missing');
    return;
  }
  
  const selectedClassData = classes.value.find(c => c.className === selectedClass.value);
  if (!selectedClassData) {
    ElMessage.warning('未找到选定班级的数据');
    console.log('[fetchReportData] Aborting: selectedClassData not found for', selectedClass.value);
    // 如果没有班级数据，也应该重置统计信息
    summaryData.value[0].value = '0';
    summaryData.value[1].value = '0%';
    gradeDistOption.value.series[0].data = [0,0,0,0,0];
    avgScoreOption.value.series[0].data = [];
    // TODO: Reset radar chart data
    return;
  }
  const classId = selectedClassData.id;
  console.log(`[fetchReportData] Fetching for Class ID: ${classId}, Exam Type: ${selectedExamType.value}`);
  console.log('[fetchReportData] Selected Class Data:', JSON.parse(JSON.stringify(selectedClassData)));

  // 更新总人数，基于班级的实际学生数
  console.log('[fetchReportData] Before updating summaryData[0].value (from selectedClassData.studentCount):', summaryData.value[0].value);
  summaryData.value[0].value = String(selectedClassData.studentCount || 0); // 使用班级实际人数
  console.log('[fetchReportData] After updating summaryData[0].value (from selectedClassData.studentCount):', summaryData.value[0].value);

  try {
    loading.value = true;
    const res = await getClassScores(classId, selectedExamType.value);
    console.log('[fetchReportData] API Response (res):', JSON.parse(JSON.stringify(res)));
    
    if (res.code === 200 && res.data && Array.isArray(res.data)) {
      const classScoresData: ClassScoreData[] = res.data; 
      console.log('[fetchReportData] Received class scores for processing (classScoresData):', JSON.parse(JSON.stringify(classScoresData)));
      console.log(`[fetchReportData] classScoresData.length (number of students with scores): ${classScoresData.length}`);

      // 总人数已经从 selectedClassData.studentCount 设置，此处不再修改 summaryData.value[0].value
      
      // 2. 计算并更新优秀率 (基于有成绩的学生)
      let excellentCount = 0;
      const totalStudentsWithScores = classScoresData.length;
      classScoresData.forEach(studentScore => {
        if (studentScore.subjects) {
          const studentScoresArray = Object.values(studentScore.subjects).map(Number);
          if (studentScoresArray.length > 0) {
            const totalScore = studentScoresArray.reduce((sum, score) => sum + score, 0);
            const maxScore = studentScoresArray.length * 100; 
            if (totalScore >= maxScore * 0.85) { 
              excellentCount++;
            }
          }
        }
      });
      const excellentRate = totalStudentsWithScores > 0 
        ? ((excellentCount / totalStudentsWithScores) * 100).toFixed(1) 
        : '0';
      console.log('[fetchReportData] Before updating summaryData[1].value (excellentRate):', summaryData.value[1].value);
      summaryData.value[1].value = `${excellentRate}%`;
      console.log('[fetchReportData] After updating summaryData[1].value (excellentRate):', summaryData.value[1].value);

      // 3. 更新成绩分布图 (基于学生个人平均分, 仅处理有成绩的学生)
      const gradeDistributionData: Record<string, number> = {
        '<60': 0, '60-70': 0, '70-80': 0, '80-90': 0, '90-100': 0
      };
      classScoresData.forEach(studentScore => {
        if (studentScore.subjects) {
          const studentScoresArray = Object.values(studentScore.subjects).map(Number);
          const numberOfSubjects = studentScoresArray.length;
          if (numberOfSubjects > 0) {
            const studentAverageScore = studentScoresArray.reduce((sum, score) => sum + score, 0) / numberOfSubjects;
            if (studentAverageScore < 60) gradeDistributionData['<60']++;
            else if (studentAverageScore < 70) gradeDistributionData['60-70']++;
            else if (studentAverageScore < 80) gradeDistributionData['70-80']++;
            else if (studentAverageScore < 90) gradeDistributionData['80-90']++;
            else gradeDistributionData['90-100']++;
          }
        }
      });
      gradeDistOption.value.series[0].data = Object.values(gradeDistributionData);
      console.log('[fetchReportData] Updated gradeDistributionData:', JSON.parse(JSON.stringify(gradeDistributionData)));

      // 4. 更新各科平均分图
      const subjectTotalsForAverage: Record<string, { sum: number; count: number }> = {};
      subjects.forEach(sub => subjectTotalsForAverage[sub] = { sum: 0, count: 0 });
      classScoresData.forEach(studentScore => {
        if (studentScore.subjects) {
          for (const subjectName in studentScore.subjects) {
            if (subjects.includes(subjectName as ImportedSubjectType)) {
              subjectTotalsForAverage[subjectName].sum += Number(studentScore.subjects[subjectName]);
              subjectTotalsForAverage[subjectName].count++;
            }
          }
        }
      });
      const avgScoresData = subjects.map(subjectName => ({
        name: subjectName,
        value: subjectTotalsForAverage[subjectName].count > 0 
                 ? parseFloat((subjectTotalsForAverage[subjectName].sum / subjectTotalsForAverage[subjectName].count).toFixed(1))
                 : 0
      }));      
      avgScoreOption.value.series[0].data = avgScoresData;
      avgScoreOption.value.yAxis.data = subjects; // Ensure yAxis categories match
      console.log('[fetchReportData] Updated avgScoresData (for main class):', JSON.parse(JSON.stringify(avgScoresData)));
      
      // 更新雷达图数据 - 现在调用新的统一函数
      await updateRadarChartWithMainAndComparativeData();

      ElMessage.success('班级成绩数据已加载并处理');
      console.log('[fetchReportData] Successfully processed data.');

    } else {
      console.warn('[fetchReportData] Condition for processing API score data NOT MET or data is not array:', 
                   `res.code: ${res.code}`, 
                   `res.data exists: ${!!res.data}`, 
                   `Array.isArray(res.data): ${Array.isArray(res.data)}`
                  );
      if(res.data && !Array.isArray(res.data)) {
        console.warn('[fetchReportData] res.data is not an array. Actual data:', JSON.parse(JSON.stringify(res.data)));
      }
      summaryData.value[1].value = '0%'; 
      gradeDistOption.value.series[0].data = [0,0,0,0,0];
      avgScoreOption.value.series[0].data = []; // 主班级平均分清空
      // comparativeClassAvgScores.value = null; // 如果主数据失败，对比数据是否保留或清空？暂时不清空对比数据
      await updateRadarChartWithMainAndComparativeData(); // 即使主数据失败，也尝试更新雷达图（可能只显示对比班级）
      ElMessage.warning(res?.message || '获取班级具体成绩数据失败或数据格式不正确');
      console.log('[fetchReportData] Resetting score-specific summaryData and chart data due to failed condition or bad score data.');
    }
  } catch (error: any) {
    console.error('[fetchReportData] Error caught while fetching/processing scores:', error);
    summaryData.value[1].value = '0%'; 
    gradeDistOption.value.series[0].data = [0,0,0,0,0];
    avgScoreOption.value.series[0].data = [];
    // comparativeClassAvgScores.value = null; // 同上
    await updateRadarChartWithMainAndComparativeData(); // 统一更新
    ElMessage.error(error.response?.data?.message || error.message || '获取成绩数据失败');
    console.log('[fetchReportData] Resetting score-specific summaryData and chart data due to CATCH block during score processing.');
  } finally {
    loading.value = false;
    console.log('[fetchReportData] Executed finally block. Loading set to false.');
  }
};

// ECharts 主题处理
const chartTheme = ref<string | null>(null);
let observer: MutationObserver | null = null;

const updateChartTheme = () => {
  const isDark = document.documentElement.classList.contains('dark');
  chartTheme.value = isDark ? 'dark' : null;

  const bgColor = isDark ? '#263445' : '#ffffff';

  if (gradeDistOption.value) {
    gradeDistOption.value.backgroundColor = bgColor;
  }
  if (avgScoreOption.value) {
    avgScoreOption.value.backgroundColor = bgColor;
  }
  if (radarOption.value) {
    radarOption.value.backgroundColor = bgColor;
  }

  // 如果ECharts的'dark'主题未能完全覆盖所有文本颜色，可以在这里补充：
  // const textColor = isDark ? '#d1d5db' : '#303133';
  // if (gradeDistOption.value?.title) gradeDistOption.value.title.textStyle = { color: textColor };
  // if (gradeDistOption.value?.xAxis?.[0]?.axisLabel) gradeDistOption.value.xAxis[0].axisLabel.color = textColor;
  // ... (对其他图表和元素的文本颜色进行类似处理)
  // 目前，我们主要依赖 :theme="'dark'" 来处理文本颜色，如果效果不理想再细化。

  console.log('[Chart Theme] Updated to:', chartTheme.value, 'with background:', bgColor);
};

// Initialize data
onMounted(async () => {
  // Initial theme check
  updateChartTheme();

  // Observe class changes on <html> element for dark mode toggling
  observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        updateChartTheme();
      }
    }
  });
  observer.observe(document.documentElement, { attributes: true });

  try {
    // Fetch initial class list for dropdowns
    const classRes = await getClassList();
    if (classRes?.code === 200 && Array.isArray(classRes.data)) {
      classes.value = classRes.data.map((item: ClassItemResponse): ClassItem => ({
        id: item.id,
        className: item.class_name,
        studentCount: item.student_count || 0,
        teacher: item.teacher || 'N/A',
        createTime: item.create_time ? dayjs(item.create_time).format('YYYY-MM-DD HH:mm:ss') : 'N/A',
        description: item.description || '',
      }));
      
      classList.value = classes.value.map(c => c.className); // For main class selector

      if (classes.value.length > 0) {
        selectedClass.value = classes.value[0].className; 
        // No need to call fetchReportData here, the watch on selectedClass will trigger it.
      }
    } else {
      ElMessage.warning(classRes?.message || '获取班级列表失败');
    }
    
    // Fetch other initial data like student lists if needed by other parts (currently fetchStatistics does this)
    // await fetchStatistics(); // This seems to fetch student lists, keep if necessary, or integrate into main flow.
    // For now, ensure class selection triggers data loading.

  } catch (error: any) {
    console.error('初始化页面数据失败:', error);
    ElMessage.error(error.response?.data?.message || error.message || '初始化页面数据失败');
  }
  // selectedExamType is already defaulted, so combined watch will trigger initial fetchReportData
});

onUnmounted(() => {
  // Clean up observer
  if (observer) {
    observer.disconnect();
  }
});

// 统一监听主班级、考试类型（对比班级有自己的 @change handler）
watch([selectedClass, selectedExamType], async ([newClass, newExamType], [oldClass, oldExamType]) => {
  console.log(`[Watch] selectedClass or selectedExamType changed. New: ${newClass}, ${newExamType}. Old: ${oldClass}, ${oldExamType}`);
  if (newClass && newExamType) { // Ensure both are selected
    // When main class or exam type changes, we need to fetch its data.
    // The radar chart will be updated as part of fetchReportData.
    // If the comparative class was selected, its data relative to the *new exam type* might need re-evaluation.
    // For simplicity now, changing main class/exam type will primarily reload main data.
    // The handleComparativeClassChange will independently manage comparative data.
    await fetchReportData();

    // Optional: If exam type changes, and a comparative class is selected, re-fetch comparative class scores for the new exam type.
    if (newExamType !== oldExamType && selectedComparativeClassName.value) {
        console.log('[Watch] Exam type changed, re-fetching comparative class data.');
        await handleComparativeClassChange(selectedComparativeClassName.value); // Pass current value to re-trigger
    }

  } else {
    // Reset charts if main class or exam type is not selected
    summaryData.value[0].value = '0';
    summaryData.value[1].value = '0%';
    gradeDistOption.value.series[0].data = [0,0,0,0,0];
    avgScoreOption.value.series[0].data = [];
    comparativeClassAvgScores.value = null; // Also clear comparative data
    await updateRadarChartWithMainAndComparativeData(); // Update radar to be empty
  }
}, { immediate: true }); // immediate: true to run on component mount if selectedClass & selectedExamType have initial values

</script>

<style scoped>
html.dark .report-container {
  /* .report-container background is already handled by dark-overrides.css */
  background: #1f2937; 
}

html.dark .operation-area,
html.dark .stat-card,
html.dark .chart-card {
  background-color: #263445; /* A common dark card background */
  border: 1px solid #374151; /* Darker border for cards */
  color: #d1d5db; /* Light gray text for cards */
}

html.dark .operation-area .label,
html.dark .stat-title,
html.dark .chart-title {
  color: #9ca3af; /* Medium-light gray for labels and titles */
}

html.dark .stat-value {
  color: #f3f4f6; /* Lighter gray for main values */
}

/* Ensure selects and other Element Plus components adapt (mostly handled by dark-overrides.css) */
html.dark .operation-area .el-select .el-input__wrapper {
  /* box-shadow is handled by dark-overrides.css, ensure text is readable */
  color: #d1d5db;
}
html.dark .operation-area .el-select .el-input__inner::placeholder {
  color: #6b7280; 
}

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
  display: flex; /* 改为flex布局，使其子元素横向排列 */
  flex-wrap: wrap; /* 允许换行，如果空间不足 */
  gap: 24px; /* 子元素之间的间距 */
  align-items: center; /* 垂直居中对齐 */
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px; /* 标签和选择框之间的间距 */
}

.operation-area .label {
  font-size: 14px;
  color: #303133; /* 深色标签文字 */
  font-weight: 500;
}

.operation-area .el-select {
  width: 200px; /* 给选择框一个固定宽度 */
  /* flex-grow: 1; */ /* 移除或调整，避免过度拉伸，除非需要 */
}

/* 数据概览卡片样式 */
.overview-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
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

/* 确保高亮样式应用到正确的卡片（优秀率现在是索引1） */
.stat-card.highlight {
  border-left: 5px solid #E6A23C;
}
</style>