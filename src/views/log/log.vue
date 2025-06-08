<template>
  <div class="log-container">
    <!-- 顶部操作栏 -->
    <div class="operation-header">
      <div class="log-title">
        <el-icon><Monitor /></el-icon>
        <span>系统日志监控</span>
      </div>
      <div class="operation-buttons">
        <el-button type="danger" @click="handleClearLogs">
          <el-icon><Delete /></el-icon>清空日志
        </el-button>
        <el-button type="success" @click="exportLogs" disabled>
          <el-icon><Download /></el-icon>导出日志
        </el-button>
      </div>
    </div>

    <!-- 日志显示区域 -->
    <div class="log-terminal" ref="terminalRef">
      <div 
        v-for="(log, index) in logs" 
        :key="log.id || index"
        :class="['log-line', `log-${log.type}`]"
        :data-operation="log.operation">
        <span class="log-time">[{{ formatTime(log.createTime) }}]</span>
        <span class="log-content">
          <span v-if="log.operator" :class="getOperatorClass(log.operator)">[{{ log.operator }}]</span>
          <span v-html="highlightSimple(log.content)"></span>
        </span>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="log-stats">
      <el-tag type="info" size="large">总日志数: {{ totalLogs }}</el-tag>
      <el-tag type="success" size="large">系统: {{ systemCount }}</el-tag>
      <el-tag type="warning" size="large">数据库: {{ dbCount }}</el-tag>
      <el-tag type="danger" size="large">错误: {{ errorCount }}</el-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { getLogList, clearLogs } from '@/api/log';
import type { LogEntry } from '@/types/log';
import { ElMessage, ElMessageBox } from 'element-plus';
import io from 'socket.io-client';
import { Monitor, Delete, Download } from '@element-plus/icons-vue';
import dayjs from 'dayjs';

const logs = ref<LogEntry[]>([]);
const terminalRef = ref<HTMLElement | null>(null);
const totalLogs = ref(0); // For total count from server

// --- Fetching Initial Logs ---
const fetchLogs = async () => {
  try {
    // Fetch a decent number of recent logs initially
    const res = await getLogList({ page: 1, pageSize: 200 }); 
    if (res.code === 200 && Array.isArray(res.data)) {
      logs.value = res.data.reverse(); // Reverse to have oldest at top, newest at bottom
      totalLogs.value = res.total || res.data.length;
    } else {
      ElMessage.error('获取初始日志失败');
    }
    // Scroll to bottom after initial load
    scrollToBottom();
  } catch (error) {
    console.error(error);
    ElMessage.error('加载日志时发生错误');
  }
};

// --- Real-time Logs via Socket.IO ---
// Make sure the URL is correct for your environment
const socket = io(import.meta.env.VITE_APP_BASE_URL || 'http://localhost:3000', {
  transports: ['websocket', 'polling'],
});

onMounted(() => {
  fetchLogs();

  socket.on('connect', () => {
    console.log('Socket.IO connected for logs.');
  });

  socket.on('serverLog', (logEntry: LogEntry) => {
    logs.value.push(logEntry);
    totalLogs.value++;
    // Ensure we don't keep too many logs in memory on the frontend
    if (logs.value.length > 500) {
      logs.value.shift();
    }
    scrollToBottom();
  });

  socket.on('disconnect', () => {
    console.log('Socket.IO disconnected.');
  });
  
  socket.on('connect_error', (err) => {
    console.error('Socket.IO connection error:', err);
    ElMessage.error('无法连接到实时日志服务');
  });
});

onUnmounted(() => {
  socket.disconnect();
});

// --- Helper Functions for Template ---
const scrollToBottom = () => {
  nextTick(() => {
    if (terminalRef.value) {
      terminalRef.value.scrollTop = terminalRef.value.scrollHeight;
    }
  });
};

const formatTime = (timeStr: string | undefined) => {
  if (!timeStr) return '...';
  return dayjs(timeStr).format('YYYY-MM-DD HH:mm:ss');
};

const getOperatorClass = (operator: string | undefined) => {
  if (!operator) return '';
  const op = operator.toLowerCase();
  if (op.includes('admin')) return 'hl-admin';
  if (op.includes('system')) return 'hl-system';
  return 'hl-operator';
};

// Using v-html, so BE CAREFUL with user-generated content.
// Since this is for logs, it's generally considered safe.
const highlightSimple = (content: string) => {
  if (!content) return '';
  return content
    .replace(/(success|成功|启用)/gi, '<span class="hl-success">$1</span>')
    .replace(/(error|fail|失败|错误)/gi, '<span class="hl-error">$1</span>')
    .replace(/(delete|删除|清空|禁用)/gi, '<span class="hl-delete">$1</span>');
};

// --- Statistics (from currently displayed logs) ---
const systemCount = computed(() => logs.value.filter(log => log.type === 'system').length);
const dbCount = computed(() => logs.value.filter(log => log.type === 'database').length);
const errorCount = computed(() => logs.value.filter(log => log.type === 'error').length);

// --- Button Actions ---
const handleClearLogs = async () => {
    ElMessageBox.confirm(
    '这将清除数据库中的所有日志条目。此操作无法撤销，是否继续？',
    '警告：清空所有日志',
    {
      confirmButtonText: '确认清空',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        const res = await clearLogs();
        if (res.code === 200) {
          ElMessage.success('所有日志已成功清空！');
          logs.value = []; // Clear frontend logs
          totalLogs.value = 0;
        } else {
          ElMessage.error(res.message || '清空日志失败');
        }
      } catch (error: any) {
        ElMessage.error(error.message || '清空日志时发生服务器错误');
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
  color: #d4d4d4;
  font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
  font-size: 14px;
  padding: 15px;
  border-radius: 8px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color-darker);
  margin-bottom: 15px;
  /* Smooth scrolling */
  scroll-behavior: smooth;
}

/* Adjust terminal for light mode */
html:not(.dark) .log-terminal {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid var(--el-border-color-lighter);
}

.log-line {
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  margin-bottom: 2px;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
}

html:not(.dark) .log-line:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.log-time {
  color: #909399;
  margin-right: 15px;
}
html:not(.dark) .log-time {
  color: #888;
}

/* Specific log type colors (works for both light/dark) */
.log-line.log-system .log-content {
  color: #66b1ff;
}
.log-line.log-database .log-content {
  color: #85dcb8;
}
.log-line.log-error .log-content {
  color: #ff8b8b;
  font-weight: bold;
}
.log-line.log-warn .log-content {
  color: #e6a23c;
}
.log-line.log-info .log-content {
  color: #909399;
}
html:not(.dark) .log-line.log-info .log-content {
    color: #909399;
}

.log-content {
  :deep(span) {
    margin-right: 4px;
  }

  /* Classes for operator */
  .hl-admin { color: #d695ff; font-weight: bold; }
  .hl-system { color: #a5b6c7; font-style: italic; }
  .hl-operator { color: #73a7ff; }

  /* Dark mode overrides for highlight */
  :deep(.hl-success) { color: #85dcb8; font-weight: bold; }
  :deep(.hl-error) { color: #ffa8a8; font-weight: bold; }
  :deep(.hl-delete) { color: #ff8b8b; }

}

/* Light mode overrides */
html:not(.dark) .log-content {
    .hl-admin { color: #9370DB; } /* MediumPurple */
    .hl-system { color: #666; }
    .hl-operator { color: #1e88e5; }

    :deep(.hl-success) { color: #67c23a; }
    :deep(.hl-error) { color: #f56c6c; }
    :deep(.hl-delete) { color: #E53935; }
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
</style>