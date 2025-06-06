<template>
  <div class="report-container">
    <!-- 顶部操作区 -->
    <div class="operation-area">
      <el-select v-model="selectedClass" placeholder="请选择班级" style="width: 200px;" clearable>
        <el-option
          v-for="item in classList"
          :key="item.id"
          :label="item.className"
          :value="item.id">
        </el-option>
      </el-select>
      <el-select v-model="selectedExam" placeholder="请选择考试" style="width: 280px;" value-key="id" clearable>
        <el-option
          v-for="item in examList"
          :key="item.id"
          :label="item.examName"
          :value="item">
        </el-option>
      </el-select>
    </div>

    <!-- 条件渲染容器 -->
    <div v-if="hasSelection && mainClassStats" v-loading="loading" class="report-content">
      <!-- 数据概览卡片 -->
      <div class="overview-cards">
        <el-card 
          v-for="(item, index) in summaryData" 
          :key="index"
          class="stat-card">
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

      <!-- 图表和排名 -->
      <div class="charts-grid">
          <el-card class="chart-card">
            <template #header>班级成绩分布 (总分)</template>
            <v-chart class="chart" :option="distributionPieOption" :theme="chartTheme" autoresize />
          </el-card>
          <el-card class="chart-card">
            <template #header>各科平均分对比</template>
            <v-chart class="chart" :option="avgScoreBarOption" :theme="chartTheme" autoresize />
          </el-card>
          <el-card class="chart-card">
            <template #header>学科能力分析 (班级平均)</template>
            <v-chart class="chart" :option="subjectRadarOption" :theme="chartTheme" autoresize />
          </el-card>
          <el-card class="chart-card">
            <template #header>总分Top 5</template>
            <el-table :data="mainClassStats.topStudents" style="width: 100%" height="250">
              <el-table-column type="index" label="排名" width="60" />
              <el-table-column prop="name" label="姓名" />
              <el-table-column prop="totalScore" label="总分">
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
import { ref, onMounted, computed, watch, markRaw } from 'vue';
import { ElMessage, ElCard, ElSelect, ElOption, ElEmpty, ElTable, ElTableColumn, ElIcon } from 'element-plus';
import { getScoreList } from '@/api/score';
import { getClassList } from '@/api/class';
import { getExamList } from '@/api/exam';
import type { ClassItem as Class } from '@/types/common';
import type { Exam } from '@/types/common';
import type { ScoreDetail } from '@/api/score';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { PieChart, BarChart, RadarChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent, RadarComponent } from 'echarts/components';
import VChart from 'vue-echarts';
import type { EChartsOption } from 'echarts';
import { Compass, Tickets, Trophy } from '@element-plus/icons-vue';
import { useAppStore } from '@/stores/app';

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

const appStore = useAppStore();
const isDarkMode = computed(() => appStore.isDarkMode);
const chartTheme = computed(() => (isDarkMode.value ? 'dark' : undefined));

const loading = ref(false);
const hasSelection = ref(false);

const classList = ref<Class[]>([]);
const examList = ref<Exam[]>([]);
const selectedClass = ref<number | ''>('');
const selectedExam = ref<Exam | undefined>(undefined);

const mainClassStats = ref<ClassStats | null>(null);

const summaryData = ref([
  { icon: markRaw(Trophy), title: '班级最高总分', value: 'N/A', color: '#67C23A' },
  { icon: markRaw(Tickets), title: '班级平均总分', value: 'N/A', color: '#409EFF' },
  { icon: markRaw(Compass), title: '优秀率', value: 'N/A', color: '#E6A23C' },
]);

const distributionPieOption = ref<EChartsOption>({});
const avgScoreBarOption = ref<EChartsOption>({});
const subjectRadarOption = ref<EChartsOption>({});

async function fetchInitialData() {
  try {
    const [classRes, examRes] = await Promise.all([
      getClassList({ pageSize: 1000 }),
      getExamList({ pageSize: 1000 })
    ]);

    classList.value = classRes.data.map(c => ({
      id: c.id,
      className: c.class_name,
      teacher: c.teacher,
      studentCount: c.student_count,
      description: c.description,
      createTime: c.create_time,
    }));

    examList.value = examRes.data.list.map(e => ({
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
      subjects: e.subjects ? e.subjects.split(',').map(s => s.trim()).filter(s => s) : [],
      subjectIds: e.subject_ids ? e.subject_ids.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id)) : [],
      classNames: e.class_names ? e.class_names.split(',').map(cn => cn.trim()).filter(cn => cn) : [],
      classIds: e.class_ids ? e.class_ids.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id)) : [],
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

function calculateClassStats(classScores: ScoreDetail[]): ClassStats {
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
    if (record.student_id && !isNaN(rawScore)) {
      const studentId = record.student_id.toString();
      
      if (!studentData[studentId]) {
        studentData[studentId] = { totalScore: 0, subjectScores: {}, name: record.student_name, id: record.student_id };
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
    const totalSum = stats.totalScores.reduce((a, b) => a + b, 0);
    stats.averageTotalScore = parseFloat((totalSum / stats.studentCount).toFixed(2));
    stats.highestTotalScore = Math.max(...stats.totalScores);
    
    const totalFullScore = totalPossibleScore;
    stats.excellenceThreshold = totalFullScore * 0.9;

    const excellentCount = stats.totalScores.filter(score => score >= stats.excellenceThreshold).length;
    stats.excellenceRate = parseFloat(((excellentCount / stats.studentCount) * 100).toFixed(2));

    const passCount = stats.totalScores.filter(score => score >= totalFullScore * 0.6).length;
    stats.passRate = parseFloat(((passCount / stats.studentCount) * 100).toFixed(2));

    const distribution = { '优秀 (>=90%)': 0, '良好 (80-89%)': 0, '中等 (70-79%)': 0, '及格 (60-69%)': 0, '不及格 (<60%)': 0 };
    if (totalPossibleScore > 0) {
        for (const totalScore of stats.totalScores) {
            const percentage = (totalScore / totalPossibleScore) * 100;
            if (percentage >= 90) distribution['优秀 (>=90%)']++;
            else if (percentage >= 80) distribution['良好 (80-89%)']++;
            else if (percentage >= 70) distribution['中等 (70-79%)']++;
            else if (percentage >= 60) distribution['及格 (60-69%)']++;
            else distribution['不及格 (<60%)']++;
        }
    }
    stats.scoreDistribution = Object.entries(distribution).map(([name, value]) => ({ name, value }));
  }

  stats.topStudents = Object.values(studentData)
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 5)
    .map(s => ({ name: s.name, totalScore: s.totalScore, id: s.id }));

  console.log('计算出的班级统计数据:', stats);
  return stats;
}

function updateCharts(stats: ClassStats) {
  updateSummaryCards(stats);
  updateDistributionPieChart(stats);
  updateAvgScoreBarChart(stats);
  updateSubjectRadarChart(stats);
}

function updateSummaryCards(stats: ClassStats | null) {
  if (!stats || stats.studentCount === 0) {
    summaryData.value = [
      { icon: markRaw(Trophy), title: '班级最高总分', value: 'N/A', color: '#67C23A' },
      { icon: markRaw(Tickets), title: '班级平均总分', value: 'N/A', color: '#409EFF' },
      { icon: markRaw(Compass), title: '优秀率', value: 'N/A', color: '#E6A23C' },
    ];
    return;
  }

  const excellenceTitle = `优秀率 (总分>=${stats.excellenceThreshold.toFixed(2)})`;

  summaryData.value = [
    { icon: markRaw(Trophy), title: '班级最高总分', value: `${stats.highestTotalScore.toFixed(2)}`, color: '#67C23A' },
    { icon: markRaw(Tickets), title: '班级平均总分', value: `${stats.averageTotalScore.toFixed(2)}`, color: '#409EFF' },
    { icon: markRaw(Compass), title: excellenceTitle, value: `${stats.excellenceRate}%`, color: '#E6A23C' },
  ];
}

function updateDistributionPieChart(stats: ClassStats | null) {
  if (!stats || stats.scoreDistribution.length === 0) {
    distributionPieOption.value = {};
    return;
  }
  distributionPieOption.value = {
    tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c}人 ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      name: '成绩分布',
      type: 'pie',
      radius: '50%',
      data: stats.scoreDistribution.filter(d => d.value > 0),
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
    }]
  };
}

function updateAvgScoreBarChart(stats: ClassStats | null) {
    if (!stats || Object.keys(stats.averageScores).length === 0) {
        avgScoreBarOption.value = {};
        return;
    }
    const avgData = Object.entries(stats.averageScores).sort((a, b) => a[1] - b[1]);

    avgScoreBarOption.value = {
        xAxis: { type: 'value' },
        yAxis: { type: 'category', data: avgData.map(item => item[0]) },
        series: [{ data: avgData.map(item => item[1]), type: 'bar' }],
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '20%' }
    };
}

function updateSubjectRadarChart(stats: ClassStats | null) {
    if (!stats || Object.keys(stats.averageScores).length === 0) {
        subjectRadarOption.value = {};
        return;
    }
    const indicatorData = Object.keys(stats.averageScores).map(subject => ({ name: subject, max: 100 }));
    const seriesData = Object.values(stats.averageScores);

    subjectRadarOption.value = {
        radar: { indicator: indicatorData },
        series: [{ type: 'radar', data: [{ value: seriesData, name: '班级平均分' }] }],
        tooltip: { trigger: 'item' }
    };
}

async function fetchData() {
  if (!selectedClass.value || !selectedExam.value) {
    hasSelection.value = false;
    mainClassStats.value = null;
    return;
  }

  hasSelection.value = true;
  loading.value = true;
  try {
    const res = await getScoreList({
      classId: selectedClass.value,
      examId: selectedExam.value.id,
      pageSize: 1000 // 获取所有成绩
    });
    const stats = calculateClassStats(res.data);
    mainClassStats.value = stats;
    updateCharts(stats);
  } catch (error) {
    console.error('获取或处理成绩数据失败:', error);
    ElMessage.error('获取成绩数据失败');
    mainClassStats.value = null;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchInitialData();
});

watch([selectedClass, selectedExam], () => {
  fetchData();
});

</script>

<style scoped lang="scss">
.report-container {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.operation-area {
  margin-bottom: 20px;
  display: flex;
  gap: 15px;
}

.report-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.stat-card {
  .stat-content {
    display: flex;
    align-items: center;
    gap: 15px;
  }
  .stat-info {
    .stat-title {
      font-size: 14px;
      color: #606266;
      margin-bottom: 5px;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
    }
  }
}

.charts-grid {
  flex-grow: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.chart-card {
  display: flex;
  flex-direction: column;
  .chart {
    height: 300px;
    flex-grow: 1;
  }
}

:deep(.el-card__header) {
  font-weight: bold;
}
</style>