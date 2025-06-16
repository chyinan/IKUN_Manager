<template>
  <div class="my-detailed-scores-container">
    <el-card shadow="never" class="main-report-card">
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
            popper-class="glass-select-popper"
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
            popper-class="glass-select-popper"
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

      <el-divider v-if="selectedExamId && scoreReport" style="border-color: rgba(255,255,255,0.2);" />

      <div v-if="loadingReport" v-loading="loadingReport" style="min-height: 200px;"></div>

      <div v-if="!loadingReport && selectedExamId && scoreReport" class="score-report-content">
        
        <div class="report-section glass-card">
          <el-descriptions :column="2" border title="考试基础信息">
            <el-descriptions-item label-class-name="modern-label" label="学生姓名">{{ scoreReport.student_info.name }}</el-descriptions-item>
            <el-descriptions-item label-class-name="modern-label" label="学号">{{ scoreReport.student_info.student_id_str }}</el-descriptions-item>
            <el-descriptions-item label-class-name="modern-label" label="考试名称">{{ scoreReport.exam_info.name }}</el-descriptions-item>
            <el-descriptions-item label-class-name="modern-label" label="考试日期">{{ scoreReport.exam_info.date }}</el-descriptions-item>
            <el-descriptions-item label-class-name="modern-label" label="班级" v-if="scoreReport.class_info.name">{{ scoreReport.class_info.name }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="report-section glass-card">
          <h4 class="report-subtitle">各科成绩详情</h4>
          <el-table :data="scoreReport.subject_details" border stripe class="modern-table">
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
        </div>

        <div class="report-section glass-card">
          <el-descriptions :column="2" border title="总分统计">
            <el-descriptions-item label-class-name="modern-label" label="我的总分">{{ scoreReport.total_score_details.student_total_score ?? '-' }}</el-descriptions-item>
            <el-descriptions-item label-class-name="modern-label" label="班级总分平均">{{ scoreReport.total_score_details.class_average_total_score ?? '-' }}</el-descriptions-item>
            <el-descriptions-item label-class-name="modern-label" label="总分班级排名">{{ scoreReport.total_score_details.class_total_score_rank ?? '-' }}</el-descriptions-item>
            <el-descriptions-item label-class-name="modern-label" label="总分年级排名">{{ scoreReport.total_score_details.grade_total_score_rank ?? '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>
        
        <!-- Chart Section -->
        <div class="report-section">
          <h4 class="report-subtitle">成绩可视化</h4>
          <el-row :gutter="20">
            <el-col :sm="24" :md="12">
              <el-card shadow="hover" class="glass-card chart-card">
                <template #header>科目成绩雷达图</template>
                <div ref="radarChartRef" style="height: 400px;"></div>
              </el-card>
            </el-col>
            <el-col :sm="24" :md="12">
              <el-card shadow="hover" class="glass-card chart-card">
                <template #header>总分对比</template>
                <div ref="barChartRef" style="height: 400px;"></div>
              </el-card>
            </el-col>
          </el-row>
        </div>

      </div>
      <el-empty v-else-if="!loadingReport && selectedExamId && !scoreReport" description="暂无该场考试的成绩报告数据" :style="{ 'margin-top': '50px' }"></el-empty>
      <el-empty v-else-if="!loadingReport && !selectedExamId" description="请先选择一场考试查看成绩报告" :style="{ 'margin-top': '50px' }"></el-empty>

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
  const studentPk = userStore.userInfo?.studentInfo?.student_pk;
  if (!studentPk) {
    ElMessage.warning('无法获取学生信息，请重新登录或联系管理员。');
    return;
  }
  loadingExams.value = true;
  try {
    const res = await getStudentExamsTaken(studentPk);
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
  const currentStudentPk = userStore.userInfo?.studentInfo?.student_pk;
  
  loadingReport.value = false;
  scoreReport.value = null;
  destroyCharts();

  if (currentStudentPk === undefined || currentStudentPk === null) {
    return;
  }
  if (!selectedExamId.value) {
    return;
  }

  loadingReport.value = true;

  try {
    const res = await getStudentScoreReport(currentStudentPk, selectedExamId.value);
    if (res.code === 200 && res.data) {
      scoreReport.value = res.data;
      if (scoreReport.value && scoreReport.value.subject_details && scoreReport.value.total_score_details) {
        nextTick(() => {
          if (radarChartRef.value && barChartRef.value) {
            initRadarChart();
            initBarChart();
          }
        });
      }
    } else {
      ElMessage.error(res.message || '获取成绩报告失败');
      scoreReport.value = null;
    }
  } catch (error: any) {
    ElMessage.error('获取成绩报告时发生网络错误');
    console.error('[MyDetailedScores] Error fetching score report:', error);
    scoreReport.value = null;
  } finally {
    loadingReport.value = false;
  }
};


const handleExamTypeChange = () => {
  selectedExamId.value = null;
  scoreReport.value = null;
  destroyCharts();
};

const handleExamNameChange = (examId: number | null) => {
  if (examId) {
    fetchScoreReport();
  } else {
    scoreReport.value = null;
    destroyCharts();
  }
};


const initRadarChart = () => {
  if (radarChartRef.value && scoreReport.value?.subject_details) {
    const indicators = scoreReport.value.subject_details.map(item => ({
      name: item.subject_name,
      max: 100
    }));
    const studentScores = scoreReport.value.subject_details.map(item => item.student_score);
    const classAvgScores = scoreReport.value.subject_details.map(item => item.class_average_score);

    if (radarChartInstance) {
      radarChartInstance.dispose();
    }
    radarChartInstance = echarts.init(radarChartRef.value);
    radarChartInstance.setOption({
      title: {
        show: false
      },
      tooltip: {
        trigger: 'item',
        confine: true,
      },
      legend: {
        data: ['我的得分', '班级平均分'],
        right: 10,
        textStyle: {
          color: '#fff'
        }
      },
      radar: {
        indicator: indicators,
        shape: 'circle',
        axisName: {
          color: '#fff',
          fontSize: 12,
        },
        splitArea: {
          areaStyle: {
            color: [
              'rgba(137, 247, 254, 0.2)',
              'rgba(102, 166, 255, 0.2)',
            ],
          },
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.4)',
          },
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.4)',
          },
        },
      },
      series: [
        {
          name: '成绩对比',
          type: 'radar',
          data: [
            {
              value: studentScores,
              name: '我的得分',
              areaStyle: {
                color: 'rgba(0, 221, 255, 0.4)'
              },
              itemStyle: {
                 color: '#00DDFF',
              },
              lineStyle: {
                color: '#00DDFF'
              }
            },
            {
              value: classAvgScores,
              name: '班级平均分',
              areaStyle: {
                color: 'rgba(100, 255, 200, 0.4)',
              },
              itemStyle: {
                 color: '#64FFC8',
              },
              lineStyle: {
                color: '#64FFC8'
              }
            }
          ]
        }
      ]
    });
  }
};


const initBarChart = () => {
  if (barChartRef.value && scoreReport.value?.total_score_details) {
    const { student_total_score, class_average_total_score } = scoreReport.value.total_score_details;
    if (barChartInstance) {
      barChartInstance.dispose();
    }
    barChartInstance = echarts.init(barChartRef.value);
    barChartInstance.setOption({
      title: {
        show: false,
      },
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
      xAxis: [
        {
          type: 'category',
          data: ['我的总分', '班级总分平均'],
          axisTick: {
            alignWithLabel: true
          },
          axisLabel: {
             color: '#fff'
          }
        }
      ],
      yAxis: [
        {
          type: 'value',
          axisLabel: {
            color: '#fff'
          },
          splitLine: {
             lineStyle:{
                type:'dashed',
                color: 'rgba(255,255,255,0.2)'
             }
          }
        }
      ],
      series: [
        {
          name: '分数',
          type: 'bar',
          barWidth: '40%',
          data: [student_total_score, class_average_total_score],
          itemStyle: {
            color: (params: any) => params.name === '我的总分' ? '#00DDFF' : '#64FFC8',
            borderRadius: [4, 4, 0, 0]
          }
        }
      ]
    });
  }
};

const destroyCharts = () => {
  if (radarChartInstance) {
    radarChartInstance.dispose();
    radarChartInstance = null;
  }
  if (barChartInstance) {
    barChartInstance.dispose();
    barChartInstance = null;
  }
};

onMounted(() => {
  fetchExamsTaken();
});

watch([() => radarChartRef.value, () => barChartRef.value], () => {
  if (scoreReport.value && radarChartRef.value && barChartRef.value) {
    initRadarChart();
    initBarChart();
  }
});
</script>

<style scoped lang="scss">
// A generic glass card style that can be reused
.glass-card {
  background-color: rgba(0, 0, 0, 0.25); // MODIFIED: Darkened background
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  color: #fff;
}

.my-detailed-scores-container {
  padding: 0; // The parent layout handles padding
}

.main-report-card {
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 20px;

  :deep(.el-card__header) {
    border-bottom: none;
    padding-left: 0;
    padding-right: 0;
  }

  :deep(.el-card__body) {
    padding: 0; 
  }
}

.card-header {
  font-size: 1.5rem;
  font-weight: 600;
  color: #fff;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
  margin-bottom: 10px; /* Add some space below the header */
}

.report-section {
  margin-bottom: 24px;
}

.report-section.glass-card {
  padding: 24px;
}

:deep(.el-descriptions) {
  .el-descriptions__title {
    color: #fff;
    font-size: 1.1rem;
    font-weight: 600;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
  }
  .el-descriptions__body {
    background-color: transparent;
  }
  .el-descriptions__label.modern-label {
    background-color: rgba(0, 0, 0, 0.35) !important;
    color: #f0f8ff;
    font-weight: 600;
  }
  .el-descriptions__content {
    background-color: rgba(0, 0, 0, 0.25) !important;
    color: #fff;
    font-weight: 500;
  }
  .el-descriptions__cell {
    border-color: rgba(255, 255, 255, 0.2) !important;
  }
}

:deep(.modern-table) {
  background-color: transparent;
  border-radius: 8px;
  overflow: hidden;
  --el-table-border-color: rgb(46 139 235 / 10%) !important;

  .el-table__header-wrapper th,
  .el-table__header-wrapper tr {
    background-color: rgba(0, 0, 0, 0.4) !important;
    color: #fff;
    font-weight: 600;
    border-color: rgba(255, 255, 255, 0.2);
  }

  .el-table__row {
    color: #fff;
    background-color: rgba(0, 0, 0, 0.15) !important;
    
    &:hover > td {
      background-color: rgba(255, 255, 255, 0.1) !important;
    }
  }

  .el-table__row--striped > td.el-table__cell {
    background-color: rgba(0, 0, 0, 0.3) !important;
  }

  td.el-table__cell,
  th.el-table__cell.is-leaf {
    border-color: rgba(255, 255, 255, 0.2) !important;
  }

  // Hide default table borders
  &::before,
  &::after {
    display: none;
  }

  .el-table__inner-wrapper {
    border-radius: 8px; 
    overflow: hidden;
  }
}

.chart-card {
  :deep(.el-card__header) {
    color: #fff;
    font-weight: 600;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    text-align: center; // MODIFIED: Centered the title
  }
}

.report-subtitle {
  font-size: 1.25rem;
  font-weight: 600;
  color: #fff;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
  margin-top: 0;
  margin-bottom: 16px;
}

:deep(.el-form-item__label) {
  color: #f0f8ff;
  font-weight: 500;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}

:deep(.el-empty__description p) {
  color: #fff !important; // Use !important to ensure override
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
}

:deep(.el-empty) {
    --el-empty-fill-color-0: #51beff;
    --el-empty-fill-color-1: #6fc8fb;
    --el-empty-fill-color-2: #2494d0;
    --el-empty-fill-color-3: #2ca5e0;
    --el-empty-fill-color-4: #5abef8;
    --el-empty-fill-color-5: #43a6e2cc;
    --el-empty-fill-color-6: #2698db;
    --el-empty-fill-color-7: #309ddc;
    --el-empty-fill-color-8: #0c8ed4;
    --el-empty-fill-color-9: rgb(255 255 255 / 9%);
}

// --- Custom Select Box Styling ---
.main-report-card :deep(.el-select .el-input__wrapper) {
  background: rgba(135, 206, 250, 0.25) !important;
  box-shadow: none !important;
  border-radius: 8px;
  border: 1px solid rgba(173, 216, 230, 0.7) !important;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
.main-report-card :deep(.el-select .el-input__wrapper.is-focused) {
  border-color: #90d8ff !important;
}
.main-report-card :deep(.el-select .el-input__inner) {
  color: #fff !important;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}
.main-report-card :deep(.el-input.is-disabled .el-input__wrapper) {
  background-color: rgba(173, 216, 230, 0.15) !important;
  border: 1px solid rgba(173, 216, 230, 0.4) !important;
  backdrop-filter: none;
  cursor: not-allowed;
}
.main-report-card :deep(.el-input.is-disabled .el-input__inner) {
  color: rgba(255, 255, 255, 0.6) !important;
}
.main-report-card :deep(.el-select .el-input .el-select__caret) {
  color: rgba(255, 255, 255, 0.8) !important;
}
</style>

<style lang="scss">
// Global styles for the select popper, because it's teleported to the body
.glass-select-popper {
  &.el-popper {
    background-color: rgba(30, 41, 59, 0.85) !important;
    border: 1px solid rgba(255, 255, 255, 0.3) !important;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-radius: 8px;

    .el-select-dropdown__list {
      padding: 6px;
    }
    .el-select-dropdown__item {
      color: #e5e7eb; // a softer white
      border-radius: 4px;
      background-color: transparent !important; // Fix for default white background
      &.hover, &:hover {
        background-color: rgba(255, 255, 255, 0.1) !important;
      }
      &.selected {
        color: #7dd3fc; // light blue for selection
        background-color: rgba(14, 165, 233, 0.15) !important;
        font-weight: 600;
      }
    }
    .el-popper__arrow::before {
       background: rgba(30, 41, 59, 0.85) !important;
       border-color: rgba(255, 255, 255, 0.3) !important;
       right: 1px;
    }
  }
}
</style>