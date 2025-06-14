<template>
  <div class="log-container">
    <!-- 顶部搜索和操作栏 -->
    <div class="operation-header">
      <el-input
        v-model="searchParams.content"
        placeholder="搜索日志内容..."
        class="search-input"
        clearable>
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <el-select v-model="searchParams.type" placeholder="日志类型" clearable class="filter-item">
        <el-option
          v-for="item in logTypeOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value" />
      </el-select>

      <el-input
        v-model="searchParams.operation"
        placeholder="操作类型..."
        class="filter-item"
        clearable />

      <el-input
        v-model="searchParams.operator"
        placeholder="操作人..."
        class="filter-item"
        clearable />

      <el-date-picker
        v-model="searchDateRange"
        type="datetimerange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD HH:mm:ss"
        class="filter-item" />

      <el-button type="primary" @click="handleSearch">
        <el-icon><Search /></el-icon>搜索
      </el-button>
      <el-button @click="handleReset">
        <el-icon><RefreshLeft /></el-icon>重置
      </el-button>
    </div>

    <!-- 日志数据表格 -->
    <el-table
      :data="logs"
      stripe
      border
      highlight-current-row
      class="log-table"
      v-loading="loading"
      @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column prop="id" label="ID" width="80" align="center" />
      <el-table-column prop="createTime" label="时间" width="180">
        <template #default="{ row }">
          {{ formatTime(row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="type" label="类型" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="getLogTypeTagType(row.type)">{{ row.type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="operation" label="操作" width="150" />
      <el-table-column prop="operator" label="操作人" width="120">
        <template #default="{ row }">
          <span :class="getOperatorClass(row.operator)">{{ row.operator }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="content" label="内容" min-width="250" show-overflow-tooltip>
        <template #default="{ row }">
          <span v-html="highlightSimple(row.content)"></span>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页器和批量删除按钮 -->
    <div class="pagination-footer">
      <el-button
        type="danger"
        @click="handleBatchDelete"
        :disabled="selectedLogIds.length === 0"
        class="batch-delete-btn">
        <el-icon><Delete /></el-icon>批量删除 ({{ selectedLogIds.length }})
      </el-button>
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="totalLogs"
        :page-sizes="[10, 20, 30, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        background
        class="pagination" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { getLogList, batchDeleteLogs } from '@/api/log';
import type { LogEntry, LogQueryParams } from '@/types/log';
import type { PageInfo } from '@/types/page'; // 导入 PageInfo
import { ElMessage, ElMessageBox } from 'element-plus';
import { Monitor, Delete, Download, Search, RefreshLeft } from '@element-plus/icons-vue';
import dayjs from 'dayjs';

const logs = ref<LogEntry[]>([]);
const totalLogs = ref(0);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);

// 搜索和过滤参数
const searchParams = ref<LogQueryParams>({
  type: '',
  operation: '',
  content: '',
  operator: '',
  startDate: '',
  endDate: '',
});

// 日期范围选择器
const searchDateRange = ref<[Date, Date] | null>(null);

// 监听日期范围变化，更新 startDate 和 endDate
watch(searchDateRange, (newRange) => {
  if (newRange && newRange.length === 2) {
    searchParams.value.startDate = dayjs(newRange[0]).format('YYYY-MM-DD HH:mm:ss');
    searchParams.value.endDate = dayjs(newRange[1]).format('YYYY-MM-DD HH:mm:ss');
  } else {
    searchParams.value.startDate = '';
    searchParams.value.endDate = '';
  }
});

// 日志类型选项
const logTypeOptions = [
  { label: '所有类型', value: '' },
  { label: '系统', value: 'system' },
  { label: '数据库', value: 'database' },
  { label: 'Vue前端', value: 'vue' },
  { label: '认证', value: 'auth' },
  { label: '管理', value: 'management' },
  { label: '邮箱', value: 'mailbox' },
  { label: '用户', value: 'user' },
  { label: '错误', value: 'error' },
  { label: '信息', value: 'info' },
  { label: '警告', value: 'warn' },
];

// 获取日志列表
const fetchLogs = async () => {
  loading.value = true;
  try {
    const params: LogQueryParams = {
      page: currentPage.value,
      pageSize: pageSize.value,
      type: searchParams.value.type === '' ? undefined : searchParams.value.type,
      operation: searchParams.value.operation === '' ? undefined : searchParams.value.operation,
      content: searchParams.value.content === '' ? undefined : searchParams.value.content,
      operator: searchParams.value.operator === '' ? undefined : searchParams.value.operator,
      startDate: searchParams.value.startDate === '' ? undefined : searchParams.value.startDate,
      endDate: searchParams.value.endDate === '' ? undefined : searchParams.value.endDate,
    };
    const res = await getLogList(params);
    console.log('获取到的日志数据:', res);

    if (res.code === 200 && res.data) {
      logs.value = res.data.list || [];
      totalLogs.value = res.data.total || 0;
    } else {
      ElMessage.warning(res?.message || '获取日志列表失败');
      logs.value = [];
      totalLogs.value = 0;
    }
  } catch (error: any) {
    console.error('获取日志列表失败:', error);
    ElMessage.error(error.response?.data?.message || error.message || '获取日志列表失败');
    logs.value = [];
    totalLogs.value = 0;
  } finally {
    loading.value = false;
  }
};

// 搜索按钮点击事件
const handleSearch = () => {
  currentPage.value = 1; // 搜索时重置为第一页
  fetchLogs();
};

// 重置按钮点击事件
const handleReset = () => {
  searchParams.value = {
    type: '',
    operation: '',
    content: '',
    operator: '',
    startDate: '',
    endDate: '',
  };
  searchDateRange.value = null; // 重置日期选择器
  currentPage.value = 1;
  pageSize.value = 10; // 重置为默认每页大小
  fetchLogs();
};

// 监听分页变化
watch([currentPage, pageSize], () => {
  fetchLogs();
});

onMounted(() => {
  fetchLogs();
});

const formatTime = (timeStr: string | undefined) => {
  if (!timeStr) return '';
  return dayjs(timeStr).format('YYYY-MM-DD HH:mm:ss');
};

const getOperatorClass = (operator: string | undefined) => {
  if (!operator) return '';
  const op = operator.toLowerCase();
  if (op.includes('admin')) return 'hl-admin';
  if (op.includes('system')) return 'hl-system';
  return 'hl-operator';
};

const highlightSimple = (content: string) => {
  if (!content) return '';
  return content
    .replace(/(success|成功|启用)/gi, '<span class="hl-success">$1</span>')
    .replace(/(error|fail|失败|错误)/gi, '<span class="hl-error">$1</span>')
    .replace(/(delete|删除|清空|禁用)/gi, '<span class="hl-delete">$1</span>');
};

// --- Button Actions ---
const handleBatchDelete = async () => {
  if (selectedLogIds.value.length === 0) {
    ElMessage.warning('请选择要删除的日志');
    return;
  }
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedLogIds.value.length} 条日志吗？此操作无法撤销，是否继续？`,
    '警告：批量删除日志',
    {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        const res = await batchDeleteLogs(selectedLogIds.value);
        if (res.code === 200) {
          ElMessage.success(res.message || '批量删除成功！');
          fetchLogs(); // 重新获取日志列表
          selectedLogIds.value = []; // 清空选中项
        } else {
          ElMessage.error(res.message || '批量删除失败');
        }
      } catch (error: any) {
        console.error('批量删除日志时发生错误:', error);
        ElMessage.error(error.response?.data?.message || error.message || '批量删除日志时发生服务器错误');
      }
    })
    .catch(() => {
      ElMessage.info('操作已取消');
    });
};

const exportLogs = () => {
  ElMessage.warning('导出功能正在紧张开发中，敬请期待！');
  // In the future, implementation would call api/log.ts exportLogs function
};

// 多选功能
const selectedLogIds = ref<number[]>([]);
const handleSelectionChange = (selection: LogEntry[]) => {
  selectedLogIds.value = selection.map(item => item.id!).filter(id => id !== undefined);
};

const getLogTypeTagType = (type: string) => {
  switch (type) {
    case 'system': return 'info';
    case 'database': return 'success';
    case 'error': return 'danger';
    case 'auth': return 'warning';
    case 'management': return ''; // default
    case 'user': return 'primary';
    case 'mailbox': return 'info';
    case 'info': return '';
    case 'warn': return 'warning';
    case 'vue': return 'success';
    default: return '';
  }
};
</script>

<style lang="scss" scoped>
.log-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 84px); /* Adjust based on layout */
  padding: 20px;
  background-color: var(--el-bg-color-page);
  transition: background-color 0.3s;
}

.operation-header {
  display: flex;
  justify-content: flex-start; /* Adjust to start */
  align-items: center;
  padding: 15px 20px;
  margin-bottom: 15px;
  background-color: var(--el-card-bg-color, var(--el-bg-color-overlay));
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  flex-shrink: 0;
  flex-wrap: wrap; /* Allow wrapping for responsiveness */
  gap: 10px; /* Spacing between items */
  transition: background-color 0.3s, border-color 0.3s;
}

.log-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: bold;
  color: var(--el-text-color-primary);
  margin-right: 20px; /* Space before search inputs */
}

.search-input,
.filter-item {
  width: 200px; /* Default width for search/filter inputs */
}

.log-table {
  width: 100%;
  flex-grow: 1; /* Allow table to take available space */
  margin-bottom: 15px;
}

.pagination-footer {
  display: flex;
  justify-content: space-between; /* Distribute items */
  align-items: center;
  padding: 10px 15px;
  background-color: var(--el-bg-color-overlay);
  border-radius: 4px;
  flex-shrink: 0; /* Prevent footer from shrinking */
  transition: background-color 0.3s;
}

.batch-delete-btn {
  margin-right: 20px; /* Space between button and pagination */
}

/* Specific styles for log content highlights */
.hl-success {
  color: var(--el-color-success);
  font-weight: bold;
}
.hl-error {
  color: var(--el-color-danger);
  font-weight: bold;
}
.hl-delete {
  color: var(--el-color-warning);
  font-weight: bold;
}
.hl-admin {
  color: var(--el-color-primary);
  font-weight: bold;
}
.hl-system {
  color: var(--el-color-info);
  font-weight: bold;
}
.hl-operator {
  color: var(--el-text-color-regular);
}

/* Dark mode specific styles */
.dark .operation-header,
.dark .pagination-footer {
  background-color: #263445;
  border-color: #3b4d61;
}

.dark .log-table {
  --el-table-row-hover-bg-color: #2c3a4d;
  --el-table-header-bg-color: #222e3e;
  --el-table-header-text-color: #e0e0e0;
  --el-table-border-color: #3b4d61;
}
</style>