<template>
  <div class="report-container">
    <!-- 顶部操作区 -->
    <el-card class="operation-card">
      <div class="operation-grid">
        <div class="grid-item">
          <el-icon><DataAnalysis /></el-icon>
          <span class="grid-item-label">选择班级</span>
          <el-select v-model="selectedClass" placeholder="请选择班级" style="width: 100%;" clearable>
            <el-option
              v-for="item in classList"
              :key="item.id"
              :label="item.className"
              :value="item.id">
            </el-option>
          </el-select>
        </div>
        <div class="grid-item">
          <el-icon><Tickets /></el-icon>
          <span class="grid-item-label">选择考试</span>
          <el-select v-model="selectedExam" placeholder="请选择考试" style="width: 100%;" value-key="id" clearable>
            <el-option
              v-for="item in examList"
              :key="item.id"
              :label="item.examName"
              :value="item">
            </el-option>
          </el-select>
        </div>
      </div>
    </el-card>

    <!-- 条件渲染容器 -->
    <div v-if="hasSelection && mainClassStats" v-loading="loading" class="report-content">
      <!-- 数据概览卡片 -->
      <div class="overview-cards">
        <el-card
          v-for="(item, index) in summaryData"
          :key="index"
          class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" :style="{ backgroundColor: item.color + '20' }">
              <el-icon :size="28" :color="item.color">
                <component :is="item.icon" />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">{{ item.title }}</div>
              <div class="stat-value" :style="{ color: item.color }">{{ item.value }}</div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 图表和排名 -->
      <div class="charts-grid">
        <el-card class="chart-card">
          <template #header>班级成绩分布 (总分)</template>
          <v-chart class="chart" :option="distributionPieOption" autoresize />
        </el-card>
        <el-card class="chart-card">
          <template #header>各科平均分对比</template>
          <v-chart class="chart" :option="avgScoreBarOption" autoresize />
        </el-card>
        <el-card class="chart-card">
          <template #header>学科能力分析 (班级平均)</template>
          <v-chart 
            v-if="mainClassStats && Object.keys(mainClassStats.averageScores).length > 0" 
            class="chart" :option="subjectRadarOption" autoresize 
          />
          <el-empty v-else description="暂无学科成绩数据" />
        </el-card>
        <el-card class="chart-card top-students-card">
          <template #header>总分Top 5</template>
          <el-table :data="mainClassStats.topStudents" style="width: 100%" height="250" class="top-students-table">
            <el-table-column type="index" label="排名" width="60" align="center">
              <template #default="scope">
                <span class="rank-badge" :class="getRankClass(scope.$index)">{{ scope.$index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="姓名" />
            <el-table-column prop="totalScore" label="总分" align="right">
              <template #default="scope">
                {{ scope.row.totalScore.toFixed(2) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
    </div>
    <!-- 初始提示 -->
    <el-empty v-else description="请选择班级和考试以查看报表" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, markRaw, provide, inject, type Ref } from 'vue';
import { ElMessage, ElCard, ElSelect, ElOption, ElEmpty, ElTable, ElTableColumn, ElIcon } from 'element-plus';
import { getScoreList, getScoresByExamAndClass, type ScoreDetailDTO } from '@/api/score';
import { getClassList } from '@/api/class';
import { getExamList } from '@/api/exam';
import type { ClassItem as Class } from '@/types/common';
import type { Exam } from '@/types/common';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { PieChart, BarChart, RadarChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent, RadarComponent } from 'echarts/components';
import VChart, { THEME_KEY } from 'vue-echarts';
import type { EChartsOption } from 'echarts';
import { Compass, Tickets, Trophy, DataAnalysis } from '@element-plus/icons-vue';

use([
  CanvasRenderer,
  PieChart,
  BarChart,
  RadarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  RadarComponent
]);

// 注入暗黑模式状态
const isDark = inject<Ref<boolean>>('isDark', ref(false));
// 为 vue-echarts 提供主题
provide(THEME_KEY, computed(() => (isDark.value ? 'dark' : 'light')));


const loading = ref(false);
const hasSelection = ref(false);

const classList = ref<Class[]>([]);
const examList = ref<Exam[]>([]);
const selectedClass = ref<number | ''>('');
const selectedExam = ref<Exam | undefined>(undefined);

const mainClassStats = ref<ClassStats | null>(null);

const summaryData = computed(() => [
  { icon: markRaw(Trophy), title: '班级最高总分', value: mainClassStats.value ? mainClassStats.value.highestTotalScore.toFixed(2) : 'N/A', color: '#ffc53d' },
  { icon: markRaw(Tickets), title: '班级平均总分', value: mainClassStats.value ? mainClassStats.value.averageTotalScore.toFixed(2) : 'N/A', color: '#36cfc9' },
  { icon: markRaw(Compass), title: `优秀率 (总分>=${mainClassStats.value ? mainClassStats.value.excellenceThreshold.toFixed(0) : 'N/A'})`, value: mainClassStats.value ? `${mainClassStats.value.excellenceRate.toFixed(2)}%` : 'N/A', color: '#ff7875' },
]);

// 定义亮色和暗色模式下的颜色
const lightColors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'];
const darkColors = ['#85a5ff', '#a0d911', '#ffd666', '#ff7875', '#adc6ff', '#5cdbd3', '#ff9c6e', '#d3adf7', '#ffadd2'];
const chartColors = computed(() => isDark.value ? darkColors : lightColors);

const distributionPieOption = computed<EChartsOption>(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c}人 ({d}%)'
  },
  legend: {
    orient: 'vertical',
    left: 'left',
    top: 'center',
    textStyle: {
      color: isDark.value ? '#ccc' : '#333'
    }
  },
  series: [
    {
      name: '成绩分布',
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['65%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: {
        borderRadius: 10,
        borderColor: isDark.value ? '#1f2937' : '#fff', // Match dark bg
        borderWidth: 2
      },
      label: {
        show: true,
        position: 'outside',
        formatter: '{b}\n{d}%',
        fontWeight: 'bold'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 18,
          fontWeight: 'bold'
        }
      },
      data: mainClassStats.value?.scoreDistribution.map((item, index) => ({
        ...item,
        itemStyle: { color: chartColors.value[index % chartColors.value.length] }
      })) || []
    }
  ]
}));

const avgScoreBarOption = computed<EChartsOption>(() => {
    const sortedData = mainClassStats.value
        ? Object.entries(mainClassStats.value.averageScores)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => a.value - b.value)
        : [];

    return {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'value',
            boundaryGap: [0, 0.01],
            axisLine: { show: true },
            splitLine: { show: true, lineStyle: { type: 'dashed' } }
        },
        yAxis: {
            type: 'category',
            data: sortedData.map(item => item.name),
            axisTick: { show: false },
        },
        series: [{
            name: '平均分',
            type: 'bar',
            data: sortedData.map((item, index) => ({
                value: item.value,
                itemStyle: {
                    color: chartColors.value[index % chartColors.value.length],
                    borderRadius: [0, 5, 5, 0]
                }
            })),
            label: {
                show: true,
                position: 'right',
                formatter: '{c}分',
                fontWeight: 'bold'
            }
        }]
    };
});


const subjectRadarOption = computed<EChartsOption>(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'item'
  },
  legend: {
    bottom: 5,
    textStyle: {
      color: isDark.value ? '#ccc' : '#333'
    },
    data: ['班级平均分', '班级最高分']
  },
  radar: {
    indicator: Object.keys(mainClassStats.value?.averageScores || {}).map(subject => ({
      name: subject,
      max: 100 // Assuming max score is 100 for all subjects
    })),
    shape: 'circle',
    center: ['50%', '45%'],
    radius: '65%',
    splitNumber: 5,
    axisName: {
      formatter: '{value}',
      color: isDark.value ? '#e5e5e5' : '#555',
      fontWeight: 'bold'
    },
    splitArea: {
      areaStyle: {
        color: isDark.value
          ? ['rgba(119, 136, 153, 0.1)', 'rgba(119, 136, 153, 0.2)']
          : ['rgba(193, 210, 240, 0.3)', 'rgba(193, 210, 240, 0.5)'],
      }
    },
  },
  series: [
    {
      name: '班级平均分',
      type: 'radar',
      data: [
        {
          value: Object.values(mainClassStats.value?.averageScores || {}).filter(val => typeof val === 'number' && !isNaN(val)) as number[],
          name: '班级平均分',
          areaStyle: {
            opacity: 0.7
          }
        }
      ]
    },
    {
      name: '班级最高分',
      type: 'radar',
      data: [
        {
          value: Object.values(mainClassStats.value?.highestScores || {}).filter(val => typeof val === 'number' && !isNaN(val)) as number[],
          name: '班级最高分',
          areaStyle: {
            opacity: 0.7
          }
        }
      ]
    }
  ]
}));

async function fetchInitialData() {
  try {
    const [classRes, examRes] = await Promise.all([
      getClassList({ pageSize: 1000 }),
      getExamList({ pageSize: 1000 })
    ]);

    // Defensive check for class list data structure
    const classListData = Array.isArray(classRes.data) ? classRes.data : (classRes.data && (classRes.data as any).list ? (classRes.data as any).list : []);
    classList.value = classListData.map((c: any) => ({
      id: c.id,
      className: c.class_name,
      teacher: c.teacher,
      studentCount: c.student_count,
      description: c.description,
      createTime: c.create_time,
    }));

    // Defensive check for exam list data structure
    const examListData = Array.isArray(examRes.data) ? examRes.data : examRes.data?.list || [];
    examList.value = examListData.map((e: any) => ({
      id: e.id,
      examName: e.exam_name,
      examType: e.exam_type,
      examDate: e.exam_date,
      startTime: e.start_time,
      endTime: e.end_time,
      duration: e.duration,
      status: e.status,
      description: e.description,
      createTime: e.create_time,
      subjects: e.subjects ? e.subjects.split(',').map((s: string) => s.trim()).filter((s: string) => s) : [],
      subjectIds: e.subject_ids ? e.subject_ids.split(',').map((id: string) => Number(id.trim())).filter((id: number) => !isNaN(id)) : [],
      classNames: e.class_names ? e.class_names.split(',').map((cn: string) => cn.trim()).filter((cn: string) => cn) : [],
      classIds: e.class_ids ? e.class_ids.split(',').map((id: string) => Number(id.trim())).filter((id: number) => !isNaN(id)) : [],
    }));

  } catch (error) {
    ElMessage.error('获取基础数据失败');
    console.error(error);
  }
}

interface ClassStats {
  studentCount: number;
  totalScores: number[];
  highestTotalScore: number;
  averageTotalScore: number;
  excellenceRate: number;
  excellenceThreshold: number;
  passRate: number;
  scoreDistribution: { name: string, value: number }[];
  averageScores: Record<string, number>;
  highestScores: Record<string, number>;
  topStudents: { name: string, totalScore: number, id: string }[];
  subjectStats: Record<string, { scores: number[], sum: number, count: number }>;
}

function createEmptyStats(): ClassStats {
  return {
    studentCount: 0,
    totalScores: [],
    highestTotalScore: 0,
    averageTotalScore: 0,
    excellenceRate: 0,
    excellenceThreshold: 0,
    passRate: 0,
    scoreDistribution: [],
    averageScores: {},
    highestScores: {},
    topStudents: [],
    subjectStats: {},
  };
}

function calculateClassStats(classScores: ScoreDetailDTO[]): ClassStats {
  if (!classScores || classScores.length === 0) {
    return createEmptyStats();
  }

  const stats = createEmptyStats();
  const studentData: Record<string, { totalScore: number, subjectScores: Record<string, number>, name: string, id: string }> = {};
  const subjectStats: Record<string, { scores: number[], sum: number, count: number }> = {};

  const subjectsInExam = [...new Set(classScores.map(s => s.subject))];

  for (const subject of subjectsInExam) {
    subjectStats[subject] = { scores: [], sum: 0, count: 0 };
  }

  for (const record of classScores) {
    const rawScore = parseFloat(record.score as any);
    if (record.studentId && !isNaN(rawScore)) {
      const studentId = record.studentId.toString();

      if (!studentData[studentId]) {
        studentData[studentId] = { totalScore: 0, subjectScores: {}, name: record.studentName, id: record.studentId.toString() };
      }

      studentData[studentId].totalScore += rawScore;
      studentData[studentId].subjectScores[record.subject] = rawScore;

      if (subjectStats[record.subject]) {
        subjectStats[record.subject].scores.push(rawScore);
        subjectStats[record.subject].sum += rawScore;
        subjectStats[record.subject].count++;
      }
    }
  }
  stats.subjectStats = subjectStats;

  for (const subject in subjectStats) {
    if (subjectStats[subject].count > 0) {
      stats.averageScores[subject] = parseFloat((subjectStats[subject].sum / subjectStats[subject].count).toFixed(2));
      stats.highestScores[subject] = Math.max(...subjectStats[subject].scores);
    }
  }

  const totalPossibleScore = subjectsInExam.length * 100;

  stats.studentCount = Object.keys(studentData).length;
  if (stats.studentCount > 0) {
    stats.totalScores = Object.values(studentData).map(s => s.totalScore);
    stats.highestTotalScore = Math.max(...stats.totalScores);
    stats.averageTotalScore = parseFloat((stats.totalScores.reduce((a, b) => a + b, 0) / stats.studentCount).toFixed(2));

    stats.topStudents = Object.values(studentData)
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 5)
      .map(s => ({ name: s.name, totalScore: s.totalScore, id: s.id }));

    const excellenceThreshold = totalPossibleScore * 0.85; // 优秀线
    const passThreshold = totalPossibleScore * 0.6; // 及格线

    stats.excellenceThreshold = excellenceThreshold;
    stats.passRate = (stats.totalScores.filter(s => s >= passThreshold).length / stats.studentCount) * 100;

    let excellentCount = 0;
    let goodCount = 0;
    let fairCount = 0;
    stats.totalScores.forEach(s => {
      if (s >= excellenceThreshold) excellentCount++;
      else if (s >= passThreshold) goodCount++;
      else fairCount++;
    });

    if (stats.studentCount > 0) {
      stats.excellenceRate = (excellentCount / stats.studentCount) * 100;
      stats.scoreDistribution = [
        { name: `优秀 (>=${excellenceThreshold.toFixed(0)})`, value: excellentCount },
        { name: `中等 (${passThreshold.toFixed(0)}-${excellenceThreshold.toFixed(0)})`, value: goodCount },
        { name: `及格 (<${passThreshold.toFixed(0)})`, value: fairCount }
      ].filter(item => item.value > 0);
    }
  }

  return stats;
}


const fetchClassReport = async () => {
  if (!selectedClass.value || !selectedExam.value) {
    hasSelection.value = false;
    mainClassStats.value = null;
    return;
  }
  loading.value = true;
  hasSelection.value = true;
  try {
    const res = await getScoresByExamAndClass(selectedExam.value.id, selectedClass.value);

    if (res.code === 200 && res.data && Array.isArray(res.data) && res.data.length > 0) {
      mainClassStats.value = calculateClassStats(res.data);
    } else {
      mainClassStats.value = createEmptyStats();
      ElMessage.info('未找到该班级在此次考试中的成绩记录');
    }
  } catch (error) {
    console.error('获取班级报告失败:', error);
    ElMessage.error('获取班级报告失败');
    mainClassStats.value = createEmptyStats(); // 错误时清空数据
  } finally {
    loading.value = false;
  }
};

watch([selectedClass, selectedExam], fetchClassReport);

onMounted(fetchInitialData);

const getRankClass = (index: number) => {
  if (index === 0) return 'rank-gold';
  if (index === 1) return 'rank-silver';
  if (index === 2) return 'rank-bronze';
  return 'rank-normal';
}

</script>

<style scoped lang="scss">
.report-container {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.operation-card {
  .operation-grid {
    display: flex;
    gap: 20px;
    align-items: center;
  }

  .grid-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;

    .grid-item-label {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-secondary);
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
}

.report-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.stat-card {
  .stat-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .stat-icon {
    height: 50px;
    width: 50px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .stat-info {
    .stat-title {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      margin-bottom: 6px;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
    }
  }
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.chart-card {
  min-height: 300px;
}

.chart {
  height: 280px;
  width: 100%;
}

.top-students-card {
  .top-students-table {
    .rank-badge {
      display: inline-block;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      color: #fff;
      text-align: center;
      line-height: 22px;
      font-weight: bold;
    }

    .rank-gold { background-color: #ffd700; }
    .rank-silver { background-color: #c0c0c0; }
    .rank-bronze { background-color: #cd7f32; }
    .rank-normal { background-color: #909399; }
  }
}
</style>
