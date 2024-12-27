<template>
  <!-- 数据统计图表容器 -->
  <div class="chart-container">
    <!-- 成绩趋势折线图 -->
    <v-chart class="chart" :option="lineOption" />
    <!-- 学科能力雷达图 -->
    <v-chart class="chart" :option="radarOption" />
  </div>
</template>

<script lang="ts" setup>
// 导入echarts相关组件
import { use } from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"
import { LineChart, RadarChart } from "echarts/charts"
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from "echarts/components"
import VChart from "vue-echarts"
import { ref } from "vue"

// 注册需要使用的 echarts 组件
use([
  CanvasRenderer,
  LineChart,
  RadarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

// 配置折线图选项
const lineOption = ref({
  title: { text: '近六个月成绩趋势', left: 'center' },
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    data: ['1月', '2月', '3月', '4月', '5月', '6月']
  },
  yAxis: { type: 'value' },
  series: [{
    name: '平均分',
    type: 'line',
    data: [85, 88, 82, 90, 87, 92],
    smooth: true, // 启用平滑曲线
    markPoint: {
      // 标记最大最小值点
      data: [
        { type: 'max', name: '最大值' },
        { type: 'min', name: '最小值' }
      ]
    }
  }]
})

// 配置雷达图选项
const radarOption = ref({
  // 标题配置
  title: { 
    text: '学科能力分布', 
    left: 'center',
    top: 20
  },
  // 图例配置
  legend: { 
    data: ['能力值'],
    top: 50,
    right: 20
  },
  // 雷达图基础配置
  radar: {
    center: ['50%', '60%'],  // 雷达图中心位置
    radius: '65%',           // 雷达图半径
    indicator: [            // 各维度指标
      { name: '语文', max: 100 },
      { name: '数学', max: 100 },
      { name: '英语', max: 100 },
      { name: '物理', max: 100 },
      { name: '化学', max: 100 },
      { name: '生物', max: 100 }
    ]
  },
  // 数据系列配置
  series: [{
    name: '能力分布',
    type: 'radar',
    data: [{
      value: [85, 32, 88, 44, 50, 60], // 各科目能力值
      name: '能力值'
    }]
  }]
})
</script>

<style scoped>
/* 图表容器样式 */
.chart-container {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
  padding: 30px;
}

/* 单个图表样式 */
.chart {
  flex: 1;
  min-width: 500px;    /* 最小宽度 */
  height: 500px;       /* 固定高度 */
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}
</style>