<template>
  <div class="log-container">
    <!-- 顶部操作栏 -->
    <div class="operation-header">
      <div class="log-title">
        <el-icon><Monitor /></el-icon>
        <span>系统日志监控</span>
      </div>
      <div class="operation-buttons">
        <el-button type="danger" @click="handleDeleteOldLogs">
          <el-icon><Delete /></el-icon>删除日志
        </el-button>
        <el-button type="success" @click="exportLogs">
          <el-icon><Download /></el-icon>导出日志
        </el-button>
      </div>
    </div>

    <!-- 日志显示区域 -->
    <div class="log-terminal" ref="terminalRef">
      <div 
        v-for="(log, index) in logs" 
        :key="index"
        :class="['log-line', `log-${log.type}`]"
        :data-operation="log.operation">
        <span class="log-time">[{{ formatTime(log.createTime) }}]</span>
        <span class="log-content">
          <span v-if="log.operator" :class="getOperatorClass(log.operator)">{{ log.operator }}</span>
          <span v-html="highlightSimple(log.content)"></span>
        </span>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="log-stats">
      <el-tag type="info">总日志数: {{ logs.length }}</el-tag>
      <el-tag type="success">系统: {{ systemCount }}</el-tag>
      <el-tag type="warning">数据库: {{ dbCount }}</el-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, markRaw } from 'vue';
import { ElMessage, ElCard, ElSelect, ElOption, ElEmpty, ElTable, ElTableColumn, ElIcon } from 'element-plus';
import { getClassScoreStats } from '@/api/score'; // 修改：导入 getClassScoreStats
import { getClassList } from '@/api/class';
import { getExamList } from '@/api/exam';
import type { ClassItem as Class } from '@/types/common';
import type { Exam } from '@/types/common';
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

// 修改：直接使用后端返回的统计数据结构
const mainClassStats = ref<any>(null);

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

// 新增：直接从后端统计数据更新概览卡片
function updateSummaryData(stats: any) {
  if (!stats) {
    summaryData.value = [
      { icon: markRaw(Trophy), title: '班级最高总分', value: 'N/A', color: '#67C23A' },
      { icon: markRaw(Tickets), title: '班级平均总分', value: 'N/A', color: '#409EFF' },
      { icon: markRaw(Compass), title: '优秀率', value: 'N/A', color: '#E6A23C' },
    ];
    return;
  }

  summaryData.value = [
    { icon: markRaw(Trophy), title: '班级最高总分', value: stats.highest_total_score?.toFixed(2) ?? 'N/A', color: '#67C23A' },
    { icon: markRaw(Tickets), title: '班级平均总分', value: stats.average_total_score?.toFixed(2) ?? 'N/A', color: '#409EFF' },
    { icon: markRaw(Compass), title: '优秀率', value: stats.excellence_rate ? `${(stats.excellence_rate * 100).toFixed(2)}%` : 'N/A', color: '#E6A23C' },
  ];
}

// 新增：直接从后端统计数据更新图表
function updateCharts(stats: any) {
  if (!stats || !stats.subject_stats) {
    distributionPieOption.value = {};
    avgScoreBarOption.value = {};
    subjectRadarOption.value = {};
    return;
  }
  
  const subjectStatsArray = Object.values(stats.subject_stats);

  // Distribution Pie Chart
  distributionPieOption.value = {
    tooltip: { trigger: 'item' },
    legend: { top: '5%', left: 'center', textStyle: { color: isDarkMode.value ? '#ccc' : '#333' } },
    series: [
      {
        name: '成绩分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: isDarkMode.value ? '#2c3e50' : '#fff',
          borderWidth: 2
        },
        label: { show: false, position: 'center' },
        emphasis: { label: { show: true, fontSize: '20', fontWeight: 'bold' } },
        labelLine: { show: false },
        data: stats.score_distribution || []
      }
    ]
  };

  // Average Score Bar Chart
  avgScoreBarOption.value = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: [{ type: 'category', data: Object.keys(stats.average_scores), axisTick: { alignWithLabel: true }, axisLabel: { color: isDarkMode.value ? '#ccc' : '#333' } }],
    yAxis: [{ type: 'value', axisLabel: { color: isDarkMode.value ? '#ccc' : '#333' } }],
    series: [{
      name: '平均分',
      type: 'bar',
      barWidth: '60%',
      data: Object.values(stats.average_scores)
    }]
  };
  
  const radarIndicators = subjectStatsArray.map((s: any) => ({ name: s.subject, max: s.full_score || 100 }));
  const radarClassData = subjectStatsArray.map((s: any) => s.average_score);

  // Subject Radar Chart
  subjectRadarOption.value = {
    tooltip: { trigger: 'item' },
    legend: { data: ['班级平均'], bottom: 5, textStyle: { color: isDarkMode.value ? '#ccc' : '#333' } },
    radar: {
      indicator: radarIndicators,
      shape: 'circle',
      splitNumber: 5,
      axisName: {
          formatter: '{value}',
          color: isDarkMode.value ? '#ccc' : '#333'
      },
    },
    series: [{
      name: '学科能力',
      type: 'radar',
      data: [
        { value: radarClassData, name: '班级平均' },
      ]
    }]
  };
}

// 修改：核心函数，调用新的API
async function fetchClassReport() {
  if (!selectedClass.value || !selectedExam.value?.id) {
    mainClassStats.value = null;
    hasSelection.value = false;
    updateSummaryData(null);
    updateCharts(null);
    return;
  }
  
  loading.value = true;
  hasSelection.value = true;
  
  try {
    const params = { classId: selectedClass.value, examId: selectedExam.value.id };
    const res = await getClassScoreStats(params);
    
    if (res.code === 200 && res.data && res.data.length > 0) {
      // 假设API返回的是一个数组，我们取第一项作为我们班级的统计数据
      // 后端应该确保在指定 classId 和 examId 时只返回一条记录
      mainClassStats.value = res.data[0]; 
      ElMessage.success('班级报表加载成功');
    } else {
      mainClassStats.value = null;
      ElMessage.warning(res.message || '未找到该班级在本次考试的统计数据');
    }
  } catch (error) {
    mainClassStats.value = null;
    ElMessage.error('加载班级报表失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
}

// 监听 mainClassStats 的变化，自动更新UI
watch(mainClassStats, (newStats) => {
  updateSummaryData(newStats);
  updateCharts(newStats);
}, { deep: true });

onMounted(() => {
  fetchInitialData();
});

// 监听下拉框变化，触发报表获取
watch([selectedClass, selectedExam], fetchClassReport, { immediate: true });
</script>

<style lang="scss" scoped>
.log-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 84px); /* Adjust based on layout */
  padding: 20px;
  background-color: var(--el-bg-color-page); /* Default light background */
  transition: background-color 0.3s;
}

.operation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  margin-bottom: 15px;
  background-color: var(--el-card-bg-color, var(--el-bg-color-overlay));
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  flex-shrink: 0;
  transition: background-color 0.3s, border-color 0.3s;
}

.log-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.operation-buttons {
  display: flex;
  gap: 10px;
}

.log-terminal {
  flex-grow: 1;
  background-color: #1e1e1e; /* Dark background for terminal */
  color: #d4d4d4; /* Light text */
  font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
  font-size: 14px;
  padding: 15px;
  border-radius: 8px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color-darker);
  margin-bottom: 15px;
}

/* Adjust terminal for light mode */
html:not(.dark) .log-terminal { /* More specific selector for light mode */
  background-color: #f5f5f5; /* Light background */
  color: #333; /* Dark text */
  border: 1px solid var(--el-border-color-lighter);
}

/* Specific light mode log colors (if needed, EP defaults might be okay) */
html:not(.dark) .log-line.log-system .log-content {
  color: #409EFF; /* Blue for system logs */
}
html:not(.dark) .log-line.log-database .log-content {
  color: #67C23A; /* Green for database */
}
html:not(.dark) .log-line.log-error .log-content {
  color: #F56C6C; /* Red for error */
}

.log-line {
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  margin-bottom: 5px;
}

.log-time {
  color: #909399;
  margin-right: 15px;
}
html:not(.dark) .log-time {
  color: #999;
}

.log-operator {
  font-weight: bold;
  margin-right: 5px;
}

/* Specific dark mode log colors */
.log-line.log-system .log-content {
  color: #66b1ff; /* Lighter blue */
}
.log-line.log-database .log-content {
  color: #85dcb8; /* Lighter green */
}
.log-line.log-error .log-content {
  color: #ffa8a8; /* Lighter red */
}

.log-content {
  color: #303133;
  word-break: break-all;
  white-space: pre-wrap;

  :deep(span) {
    margin-right: 4px;
  }

  /* Classes for operator */
  .hl-admin { color: #7E57C2; font-weight: 500; }
  .hl-system { color: #5D4037; font-style: italic; }
  .hl-operator { color: #3949AB; font-weight: 500; }

  /* Classes for simple highlighting from v-html */
  :deep(.hl-success) { color: #67c23a; font-weight: bold; }
  :deep(.hl-error) { color: #f56c6c; font-weight: bold; }
  :deep(.hl-delete) { color: #E53935; font-weight: 500; }
}

/* Dark mode text color override */
.dark .log-content {
  color: #fff;
}

.log-stats {
  flex-shrink: 0;
  padding: 10px 15px;
  background-color: var(--el-card-bg-color, var(--el-bg-color-overlay));
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  display: flex;
  gap: 15px;
  transition: background-color 0.3s, border-color 0.3s;
}

/* Remove specific dark-component-bg rules */

</style>