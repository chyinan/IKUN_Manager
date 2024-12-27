<template>
  <div class="chart-container">
    <v-chart class="chart" :option="lineOption" />
    <v-chart class="chart" :option="radarOption" />
  </div>
</template>

<script lang="ts" setup>
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

use([
  CanvasRenderer,
  LineChart,
  RadarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

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
    smooth: true,
    markPoint: {
      data: [
        { type: 'max', name: '最大值' },
        { type: 'min', name: '最小值' }
      ]
    }
  }]
})

const radarOption = ref({
  title: { 
    text: '学科能力分布', 
    left: 'center',
    top: 20
  },
  legend: { 
    data: ['能力值'],
    top: 50,
    right: 20
  },
  radar: {
    center: ['50%', '60%'],  // 调整雷达图中心位置
    radius: '65%',           // 增大雷达图半径
    indicator: [
      { name: '语文', max: 100 },
      { name: '数学', max: 100 },
      { name: '英语', max: 100 },
      { name: '物理', max: 100 },
      { name: '化学', max: 100 },
      { name: '生物', max: 100 }
    ]
  },
  series: [{
    name: '能力分布',
    type: 'radar',
    data: [{
      value: [85, 32, 88, 44, 50, 60],
      name: '能力值'
    }]
  }]
})
</script>

<style scoped>
.chart-container {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
  padding: 30px;
}

.chart {
  flex: 1;
  min-width: 500px;    /* 增加最小宽度 */
  height: 500px;       /* 增加高度 */
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}
</style>