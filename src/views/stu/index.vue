<template>
  <!-- 使用 Element Plus 的 TableV2 组件展示数据 -->
  <el-table-v2
    :columns="columns"
    :data="data"
    :width="700"
    :height="400"
    fixed
  />
</template>

<script lang="tsx" setup>
// 导入所需的组件和工具
import { ref, Fragment } from 'vue'
import dayjs from 'dayjs' // 日期处理工具
import {
  ElButton,
  ElIcon,
  ElTag,
  ElTooltip,
  TableV2FixedDir,
} from 'element-plus'
import { Timer } from '@element-plus/icons-vue'
import type { Column } from 'element-plus'

// ID生成器
let id = 0

// 模拟数据生成函数
const dataGenerator = () => ({
  id: `random-id-${++id}`,
  name: '菜虚鲲',
  date: '1919-8-10',
})

// 定义表格列配置
const columns: Column<any>[] = [
  {
    key: 'date',
    title: '生蛋日', // 列标题
    dataKey: 'date',
    width: 150,
    fixed: TableV2FixedDir.LEFT, // 固定在左侧
    // 自定义单元格渲染
    cellRenderer: ({ cellData: date }) => (
      <ElTooltip content={dayjs(date).format('YYYY/MM/DD')}>
        {/* 显示日期和图标 */}
        <span class="flex items-center">
          <ElIcon class="mr-3">
            <Timer />
          </ElIcon>
          {dayjs(date).format('YYYY/MM/DD')}
        </span>
      </ElTooltip>
    ),
  },
  {
    key: 'name',
    title: '鲲名',
    dataKey: 'name',
    width: 150,
    align: 'center',
    // 使用标签展示名称
    cellRenderer: ({ cellData: name }) => <ElTag>{name}</ElTag>,
  },
  {
    key: 'operations',
    title: '操作',
    // 操作按钮列
    cellRenderer: () => (
      <Fragment>
        <ElButton size="small">编鸡</ElButton>
        <ElButton size="small" type="danger">
          爆坤
        </ElButton>
      </Fragment>
    ),
    width: 150,
    align: 'center',
  },
]

const data = ref(Array.from({ length: 200 }).map(dataGenerator))
</script>
