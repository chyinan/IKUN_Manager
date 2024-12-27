<template>
  <div class="chart-container">
    <v-chart class="chart" :option="pieOption" />
    <v-chart class="chart" :option="barOption" />
  </div>
</template>

<script lang="ts" setup>
import { use } from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"
import { PieChart, BarChart } from "echarts/charts"
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
  PieChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const pieOption = ref({
  title: { text: '部门人员分布', left: 'center' },
  tooltip: { trigger: 'item' },
  legend: { orient: 'vertical', left: 'left' },
  series: [{
    name: '部门分布',
    type: 'pie',
    radius: '50%',
    data: [
      { value: 35, name: '技术部' },
      { value: 20, name: '市场部' },
      { value: 15, name: '财务部' },
      { value: 25, name: '销售部' },
      { value: 5, name: '行政部' }
    ]
  }]
})

const barOption = ref({
  title: { text: '各部门平均薪资', left: 'center' },
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    data: ['技术部', '市场部', '财务部', '销售部', '行政部']
  },
  yAxis: { type: 'value' },
  series: [{
    data: [12000, 8000, 9000, 10000, 7000],
    type: 'bar',
    showBackground: true,
    backgroundStyle: {
      color: 'rgba(180, 180, 180, 0.2)'
    }
  }]
})
</script>

<style scoped>
.chart-container {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;          /* 增加间距 */
  padding: 30px;      /* 增加内边距 */
}

.chart {
  flex: 1;
  min-width: 500px;   /* 增加最小宽度 */
  height: 500px;      /* 增加高度 */
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}
</style>