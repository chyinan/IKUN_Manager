<template>
  <div class="my-detailed-scores-container app-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>我的成绩报告</span>
        </div>
      </template>

      <el-form :inline="true" @submit.prevent>
        <el-form-item label="选择考试类型">
          <el-select
            v-model="selectedExamType"
            placeholder="请选择考试类型"
            @change="handleExamTypeChange"
            clearable
            style="width: 220px;"
            :loading="loadingExams"
          >
            <el-option
              v-for="examType in uniqueExamTypes"
              :key="examType"
              :label="examType"
              :value="examType"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="选择具体考试">
          <el-select
            v-model="selectedExamId"
            placeholder="请先选择考试类型"
            @change="handleExamNameChange"
            filterable
            clearable
            style="width: 300px;"
            :loading="loadingExams"
            :disabled="!selectedExamType || filteredExamsByName.length === 0"
          >
            <el-option
              v-for="exam in filteredExamsByName"
              :key="exam.exam_id"
              :label="`${exam.exam_name} (${exam.exam_date})`"
              :value="exam.exam_id"
            />
            <template #empty v-if="selectedExamType && filteredExamsByName.length === 0">
              <p style="text-align: center; color: #999;">该类型下无考试记录</p>
            </template>
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
          <el-table-column prop="subject" label="科目名称" align="center" />
          <el-table-column prop="student_score" label="我的得分" align="center">
            <template #default="{ row }">{{ row.student_score ?? '-' }}</template>
          </el-table-column>
          <el-table-column prop="class_average_score" label="班级平均分" align="center">
            <template #default="{ row }">{{ row.class_average_score ?? '-' }}</template>
          </el-table-column>
          <el-table-column prop="class_rank" label="班级排名" align="center">
            <template #default="{ row }">{{ row.class_rank ?? '-' }}</template>
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
import { ref, onMounted, watch, nextTick, computed } from 'vue';
import { useUserStore } from '@/stores/user';
import { getStudentExamsTaken, getStudentScoreReport } from '@/api/score';
import type { ExamTaken, StudentScoreReport } from '@/api/score';
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
const selectedExamType = ref<string | null>(null);
const selectedExamId = ref<number | null>(null);
const loadingExams = ref(false);
const loadingReport = ref(false);
const scoreReport = ref<StudentScoreReport | null>(null);

const radarChartRef = ref<HTMLElement | null>(null);
let radarChartInstance: echarts.ECharts | null = null;
const barChartRef = ref<HTMLElement | null>(null);
let barChartInstance: echarts.ECharts | null = null;

const fetchExamsTaken = async () => {
  if (!userStore.userInfo?.id) {
    ElMessage.warning('无法获取用户信息，请重新登录或联系管理员。');
    return;
  }
  loadingExams.value = true;
  try {
    const res = await getStudentExamsTaken(userStore.userInfo.id);
    if (res.code === 200) {
      examsTaken.value = res.data;
      if (examsTaken.value.length === 0) {
        ElMessage.info('您目前没有已出成绩的考试记录。');
      }
    } else {
      ElMessage.error(res.message || '获取已参加考试列表失败');
    }
  } catch (error: any) {
    ElMessage.error('获取已参加考试列表时发生网络错误');
    console.error('[MyDetailedScores] Error fetching exams taken:', error);
  } finally {
    loadingExams.value = false;
  }
};

const uniqueExamTypes = computed(() => {
  const types = new Set(examsTaken.value.map(exam => exam.exam_type));
  return Array.from(types).sort();
});

const filteredExamsByName = computed(() => {
  if (!selectedExamType.value) {
    return [];
  }
  return examsTaken.value.filter(exam => exam.exam_type === selectedExamType.value);
});

const fetchScoreReport = async () => {
  // Get student PK directly from the store here
  const currentStudentPk = userStore.userInfo?.studentInfo?.student_pk;

  // Print current values for debugging
  console.log(`[MyDetailedScores.vue fetchScoreReport] Attempting to fetch. Student PK from store: ${currentStudentPk}, Selected Exam ID: ${selectedExamId.value}`);

  // Reset loading state for report specifically if not already reset
  loadingReport.value = false;
  // Clear previous report data before attempting a new fetch or validation failure
  scoreReport.value = null;
  destroyCharts();

  // Validate studentId and examId before proceeding
  if (currentStudentPk === undefined || currentStudentPk === null) {
    console.warn('[MyDetailedScores.vue fetchScoreReport] Aborted: Student PK from store is undefined or null.');
    return;
  }
  if (!selectedExamId.value) {
    console.warn('[MyDetailedScores.vue fetchScoreReport] Aborted: selectedExamId is not set.');
    return;
  }

  loadingReport.value = true;
  // Use the locally fetched student PK for the API call
  console.log(`[MyDetailedScores.vue fetchScoreReport] Using Student PK: ${currentStudentPk}, Exam ID: ${selectedExamId.value} for API call`);

  try {
    // const studentIdToFetch = userStore.userInfo.studentInfo?.id; // This line used .id, should be .student_pk and is now currentStudentPk
    // console.log('[MyDetailedScores.vue DEBUG] Using studentId to fetch report:', studentIdToFetch); // This line is redundant
    // Use currentStudentPk directly in the API call
    const res = await getStudentScoreReport(currentStudentPk, selectedExamId.value);
    if (res.code === 200 && res.data) {
      scoreReport.value = res.data;
      console.log('[MyDetailedScores.vue DEBUG] scoreReport.value assigned. Checking refs immediately:', {
          radar: radarChartRef.value, // Log ref value BEFORE nextTick
          bar: barChartRef.value
      });

      if (scoreReport.value && scoreReport.value.subject_details && scoreReport.value.total_score_details) {
        // 使用 nextTick 来确保 DOM 已经更新
        nextTick(() => {
          console.log('[MyDetailedScores.vue DEBUG] Inside nextTick. Checking refs again:', {
              radar: radarChartRef.value, // Log ref value INSIDE nextTick
              bar: barChartRef.value
          });

          if (radarChartRef.value && barChartRef.value) { // 再次确认 ref 是否有效
            console.log('[MyDetailedScores.vue DEBUG] Refs are available. Calling initRadarChart and initBarChart.');
            initRadarChart();
            initBarChart();
          } else {
            console.error('[MyDetailedScores.vue DEBUG] Critical: Refs are STILL NOT available even inside nextTick.', {
                radar: radarChartRef.value,
                bar: barChartRef.value
            });
            // 进一步的调试可能需要检查 v-if 条件和组件的渲染流程
            if(radarChartRef.value === null && document.querySelector('.my-detailed-scores-container div[ref="radarChartRef"]')) {
                console.warn('[MyDetailedScores.vue DEBUG] radarChartRef is null, but a DOM element with that ref name might exist (check querySelector). This indicates a Vue reactivity issue with the ref itself.')
            }
             if (!scoreReport.value) {
                console.warn('[MyDetailedScores.vue DEBUG] scoreReport.value is null/undefined inside nextTick, v-if might have hidden the chart section again.');
            }
          }
        });
      } else {
        console.warn('[MyDetailedScores.vue DEBUG] scoreReport.value is missing subject_details or total_score_details after assignment.');
      }
    } else {
      // Handle cases where API returns success code but no data
      scoreReport.value = null; // Ensure report is cleared
      ElMessage.warning(res.message || '获取成绩报告失败，无数据返回');
    }
  } catch (error: any) {
    console.error('[MyDetailedScores.vue] fetchScoreReport error:', error);
    ElMessage.error(error.message || '获取成绩报告时发生网络错误');
  } finally {
    loadingReport.value = false;
  }
};

const handleExamTypeChange = (type: string | null) => {
  selectedExamType.value = type;
  selectedExamId.value = null;
  scoreReport.value = null;
  destroyCharts();
};

const handleExamNameChange = (examIdValue: number | string | null) => {
  const id = typeof examIdValue === 'string' && examIdValue === '' ? null : Number(examIdValue);
  selectedExamId.value = id;
  if (id) {
    fetchScoreReport();
  } else {
    scoreReport.value = null;
    destroyCharts();
  }
};

const initRadarChart = () => {
  console.log('[DEBUG] initRadarChart called');
  if (radarChartInstance) {
    radarChartInstance.dispose(); // Dispose previous instance
  }
  if (!radarChartRef.value) {
    console.error('[DEBUG] radarChartRef is not available.');
    return;
  }
  if (!scoreReport.value || !scoreReport.value.subject_details || scoreReport.value.subject_details.length === 0) {
    console.warn('[DEBUG] No subject details available for radar chart.');
    // Optionally clear the chart div or display a message
    radarChartRef.value.innerHTML = '<p style="text-align:center; color:#999;">无科目数据显示</p>';
    return;
  }

  try {
    radarChartInstance = echarts.init(radarChartRef.value);
    console.log('[DEBUG] Radar chart instance created.');

    // --- Data Preparation Logic START ---
    const indicators = scoreReport.value.subject_details.map(subject => ({
      name: subject.subject_name,
      max: 100 // Assuming max score is 100 as full_score is not available
    }));
    console.log('[DEBUG] Radar indicators:', JSON.parse(JSON.stringify(indicators)));

    const studentScores = scoreReport.value.subject_details.map(subject => subject.student_score ?? 0);
    console.log('[DEBUG] Radar student scores:', JSON.parse(JSON.stringify(studentScores)));

    const classAverageScores = scoreReport.value.subject_details.map(subject => subject.class_average_score ?? 0);
     console.log('[DEBUG] Radar class average scores:', JSON.parse(JSON.stringify(classAverageScores)));
    // --- Data Preparation Logic END ---

    const option = {
      title: {
        text: '科目成绩雷达图',
        left: 'center'
      },
      tooltip: {
        trigger: 'item' // Show tooltip when hovering over data points
      },
      legend: {
        data: ['我的得分', '班级平均分'],
        bottom: 10 // Position legend at the bottom
      },
      radar: {
        indicator: indicators,
        shape: 'circle', // Or 'polygon'
        splitNumber: 5, // Number of split segments
        axisName: {
            color: '#333',
            fontSize: 12
        },
        splitArea: {
            areaStyle: {
                color: ['rgba(250,250,250,0.1)', 'rgba(200,200,200,0.1)'], // Alternating background colors for segments
            }
        },
        axisLine: { // Axis line style
            lineStyle: {
                color: 'rgba(150,150,150,0.5)'
            }
        },
        splitLine: { // Split line style
            lineStyle: {
                color: 'rgba(150,150,150,0.5)'
            }
        }
      },
      series: [
        {
          name: '成绩对比', // This name is often for overall series, individual names are in legend.data
          type: 'radar',
          data: [
            {
              value: studentScores,
              name: '我的得分',
              itemStyle: { color: '#5470C6' }, // Color for student scores
              lineStyle: { width: 2 },
              areaStyle: { color: 'rgba(84, 112, 198, 0.2)'} // Fill area for student scores
            },
            {
              value: classAverageScores,
              name: '班级平均分',
              itemStyle: { color: '#91CC75' }, // Color for class average
              lineStyle: { width: 2 },
              areaStyle: { color: 'rgba(145, 204, 117, 0.2)'} // Fill area for class average
            }
          ]
        }
      ]
    };
    console.log('[DEBUG] Radar chart option:', JSON.parse(JSON.stringify(option)));

    radarChartInstance.setOption(option);
    console.log('[DEBUG] Radar chart option set.');

  } catch (error: any) {
    console.error('[DEBUG] Error initializing radar chart:', error);
    if (radarChartRef.value) {
        radarChartRef.value.innerHTML = `<p style="text-align:center; color:red;">雷达图加载失败: ${error.message}</p>`;
    }
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
  fetchExamsTaken();
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
    color: #303133;
    padding-bottom: 5px;
    border-bottom: 1px solid #e0e0e0;
  }
  .el-col {
    margin-bottom: 20px;
  }
}
</style> 