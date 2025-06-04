<template>
  <div class="my-detailed-scores-container app-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>我的成绩报告</span>
        </div>
      </template>

      <el-form :inline="true" @submit.prevent>
        <el-form-item label="选择考试">
          <el-select
            v-model="selectedExamId"
            placeholder="请选择一场考试"
            @change="handleExamChange"
            filterable
            clearable
            style="width: 300px;"
            :loading="loadingExams"
          >
            <el-option
              v-for="exam in examsTaken"
              :key="exam.exam_id"
              :label="`${exam.exam_name} (${exam.exam_date})`"
              :value="exam.exam_id"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <el-divider v-if="selectedExamId && scoreReport" />

      <div v-if="loadingReport" v-loading="loadingReport" style="min-height: 200px;"></div>

      <div v-if="!loadingReport && selectedExamId && scoreReport" class="score-report-content">
        <h3>成绩报告详情</h3>
        <el-descriptions :column="2" border class="report-section">
          <el-descriptions-item label="学生姓名">{{ scoreReport.student_info.name }}</el-descriptions-item>
          <el-descriptions-item label="学号">{{ scoreReport.student_info.student_id_str }}</el-descriptions-item>
          <el-descriptions-item label="考试名称">{{ scoreReport.exam_info.name }}</el-descriptions-item>
          <el-descriptions-item label="考试日期">{{ scoreReport.exam_info.date }}</el-descriptions-item>
          <el-descriptions-item label="班级" v-if="scoreReport.class_info.name">{{ scoreReport.class_info.name }}</el-descriptions-item>
        </el-descriptions>

        <h4 class="report-subtitle">各科成绩详情</h4>
        <el-table :data="scoreReport.subject_details" border stripe class="report-section">
          <el-table-column prop="subject_name" label="科目名称" align="center" />
          <el-table-column prop="student_score" label="我的得分" align="center">
            <template #default="{ row }">{{ row.student_score ?? '-' }}</template>
          </el-table-column>
          <el-table-column prop="class_average_score" label="班级平均分" align="center">
            <template #default="{ row }">{{ row.class_average_score ?? '-' }}</template>
          </el-table-column>
          <el-table-column prop="class_subject_rank" label="班级排名" align="center">
            <template #default="{ row }">{{ row.class_subject_rank ?? '-' }}</template>
          </el-table-column>
        </el-table>

        <h4 class="report-subtitle">总分统计</h4>
        <el-descriptions :column="2" border class="report-section">
          <el-descriptions-item label="我的总分">{{ scoreReport.total_score_details.student_total_score ?? '-' }}</el-descriptions-item>
          <el-descriptions-item label="班级总分平均">{{ scoreReport.total_score_details.class_average_total_score ?? '-' }}</el-descriptions-item>
          <el-descriptions-item label="总分班级排名">{{ scoreReport.total_score_details.class_total_score_rank ?? '-' }}</el-descriptions-item>
          <el-descriptions-item label="总分年级排名">{{ scoreReport.total_score_details.grade_total_score_rank ?? '-' }}</el-descriptions-item>
        </el-descriptions>
        
        <!-- Chart Section -->
        <h4 class="report-subtitle">成绩可视化</h4>
        <el-row :gutter="20" class="report-section">
          <el-col :sm="24" :md="12">
            <el-card shadow="hover">
              <template #header>科目成绩雷达图</template>
              <div ref="radarChartRef" style="height: 400px;"></div>
            </el-card>
          </el-col>
          <el-col :sm="24" :md="12">
             <el-card shadow="hover">
              <template #header>总分对比</template>
              <div ref="barChartRef" style="height: 400px;"></div>
            </el-card>
          </el-col>
        </el-row>

      </div>
      <el-empty v-else-if="!loadingReport && selectedExamId && !scoreReport" description="暂无该场考试的成绩报告数据"></el-empty>
      <el-empty v-else-if="!loadingReport && !selectedExamId" description="请先选择一场考试查看成绩报告"></el-empty>

    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import { useUserStore } from '@/stores/user';
import { getStudentExamsTaken, getStudentScoreReport, type ExamTaken, type StudentScoreReport } from '@/api/score';
import { ElMessage } from 'element-plus';
import * as echarts from 'echarts/core';
import { RadarChart, BarChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent, MarkLineComponent, MarkPointComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  TitleComponent, 
  TooltipComponent, 
  LegendComponent, 
  GridComponent, 
  RadarChart, 
  BarChart, 
  CanvasRenderer, 
  MarkLineComponent, 
  MarkPointComponent
]);

const userStore = useUserStore();

const examsTaken = ref<ExamTaken[]>([]);
const selectedExamId = ref<number | null>(null);
const loadingExams = ref(false);
const loadingReport = ref(false);
const scoreReport = ref<StudentScoreReport | null>(null);

const radarChartRef = ref<HTMLElement | null>(null);
let radarChartInstance: echarts.ECharts | null = null;
const barChartRef = ref<HTMLElement | null>(null);
let barChartInstance: echarts.ECharts | null = null;


const fetchExamsTaken = async () => {
  if (!userStore.studentInfo?.id) { 
    ElMessage.warning('无法获取学生信息，请重新登录或联系管理员。');
    return;
  }
  loadingExams.value = true;
  try {
    const res = await getStudentExamsTaken(userStore.studentInfo.id);
    if (res.code === 200) {
      examsTaken.value = res.data;
      if (examsTaken.value.length === 0) {
        ElMessage.info('您目前没有已出成绩的考试记录。');
      }
    } else {
      ElMessage.error(res.message || '获取已参加考试列表失败');
    }
  } catch (error) {
    ElMessage.error('获取已参加考试列表时发生网络错误');
  } finally {
    loadingExams.value = false;
  }
};

const fetchScoreReport = async () => {
  if (!userStore.studentInfo?.id || !selectedExamId.value) {
    scoreReport.value = null;
    return;
  }
  loadingReport.value = true;
  scoreReport.value = null; 
  destroyCharts(); 

  try {
    const res = await getStudentScoreReport(userStore.studentInfo.id, selectedExamId.value);
    if (res.code === 200) {
      scoreReport.value = res.data;
      if (scoreReport.value) {
        await nextTick();
        initRadarChart();
        initBarChart();
      }
    } else {
      ElMessage.error(res.message || '获取成绩报告失败');
    }
  } catch (error) {
    ElMessage.error('获取成绩报告时发生网络错误');
  } finally {
    loadingReport.value = false;
  }
};

const handleExamChange = (examId: number | string | null) => {
  // el-select with clearable might pass '' when cleared, ensure it's null or a valid number
  const id = typeof examId === 'string' && examId === '' ? null : Number(examId);
  selectedExamId.value = id;
  if (id) {
    fetchScoreReport();
  } else {
    scoreReport.value = null;
    destroyCharts();
  }
};

const initRadarChart = () => {
  if (radarChartRef.value && scoreReport.value?.subject_details) {
    const chartData = scoreReport.value.subject_details;
    // Ensure all subjects have a max, default to 100 if not specified or if score exceeds it
    const indicators = chartData.map(item => ({
      name: item.subject_name,
      max: Math.max(100, item.student_score ?? 0, item.class_average_score ?? 0) // Dynamic max based on data, min 100
    }));
    const studentScores = chartData.map(item => item.student_score ?? 0);
    const classAverageScores = chartData.map(item => item.class_average_score ?? 0);

    radarChartInstance = echarts.init(radarChartRef.value);
    radarChartInstance.setOption({
      title: { text: '科目成绩对比雷达图', left: 'center' },
      tooltip: { trigger: 'item' },
      legend: { data: ['我的得分', '班级平均分'], bottom: 5, type: 'scroll' },
      radar: { indicator: indicators, shape: 'circle', center: ['50%', '55%'], radius: '65%', splitNumber: 5 },
      series: [{
        name: '成绩对比',
        type: 'radar',
        data: [
          { value: studentScores, name: '我的得分' },
          { value: classAverageScores, name: '班级平均分' }
        ],
        symbolSize: 8,
        lineStyle: { width: 2 }
      }]
    });
  }
};

const initBarChart = () => {
  if (barChartRef.value && scoreReport.value?.total_score_details) {
    const details = scoreReport.value.total_score_details;
    barChartInstance = echarts.init(barChartRef.value);
    barChartInstance.setOption({
      title: { text: '总分对比 (与班级平均)', left: 'center'},
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['我的总分', '班级平均总分'], bottom: 5, type: 'scroll' },
      grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
      xAxis: { type: 'category', data: ['总分'], axisTick: { alignWithLabel: true } },
      yAxis: { type: 'value', name: '分数', scale: true },
      series: [
        { name: '我的总分', type: 'bar', data: [details.student_total_score ?? 0], barWidth: '30%', itemStyle: { color: '#5470C6' } },
        { name: '班级平均总分', type: 'bar', data: [details.class_average_total_score ?? 0], barWidth: '30%', itemStyle: { color: '#91CC75'} }
      ]
    });
  }
}

const destroyCharts = () => {
  if (radarChartInstance) {
    radarChartInstance.dispose();
    radarChartInstance = null;
  }
  if (barChartInstance) {
    barChartInstance.dispose();
    barChartInstance = null;
  }
}

onMounted(() => {
  if (userStore.studentInfo?.id) {
      fetchExamsTaken();
  } else {
      const unwatch = watch(() => userStore.studentInfo, (newInfo) => {
          if (newInfo?.id) {
              fetchExamsTaken();
              unwatch(); 
          }
      }, { immediate: true }); 
  }
});

</script>

<style scoped lang="scss">
.my-detailed-scores-container {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .report-section {
    margin-top: 20px;
    margin-bottom: 30px;
  }
  .report-subtitle {
    font-size: 1.1em;
    font-weight: 600;
    margin-top: 25px;
    margin-bottom: 15px;
    color: #303133; //深灰色，更柔和
    padding-bottom: 5px;
    border-bottom: 1px solid #e0e0e0; // 添加下划线
  }
  .el-col {
    margin-bottom: 20px; // For responsive stacking on small screens
  }
}
</style> 