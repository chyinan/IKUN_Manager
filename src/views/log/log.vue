<template>
  <div class="log-container">
    <!-- 顶部操作栏 -->
    <div class="operation-header" :class="{ 'dark-component-bg': isDark }">
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
    <div class="log-terminal" 
      ref="terminalRef">
      <div 
        v-for="(log, index) in logs" 
        :key="index"
        :class="['log-line', `log-${log.type}`]"
        :data-operation="log.operation">
        <span class="log-time">[{{ formatTime(log.createTime) }}]</span>
        <span class="log-content">
          <template v-if="log.operator && log.operation">
            <span class="log-operator">{{ log.operator }}</span>
            <span class="log-message">{{ log.content }}</span>
          </template>
          <template v-else>
            {{ log.content }}
          </template>
        </span>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="log-stats" :class="{ 'dark-component-bg': isDark }">
      <el-tag type="info">总日志数: {{ logs.length }}</el-tag>
      <el-tag type="success">系统: {{ systemCount }}</el-tag>
      <el-tag type="warning">数据库: {{ dbCount }}</el-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useDark } from '@vueuse/core'
import { Monitor, Delete, Download } from '@element-plus/icons-vue'
import { io, Socket } from 'socket.io-client'
import type { LogEntry, LogType, LogResponse } from '@/types/log'
import { getLogList, clearLogs as apiClearLogs } from '@/api/log'

// 日志列表
const logs = ref<LogEntry[]>([])
const terminalRef = ref<HTMLElement>()
let socket: Socket

// 统计数据
const systemCount = computed(() => logs.value.filter(log => log.type === 'system').length)
const dbCount = computed(() => logs.value.filter(log => log.type === 'database').length)

// Dark mode state
const isDark = useDark()

// 格式化时间显示
const formatTime = (timeStr: string | undefined | null) => {
  if (!timeStr) {
    return '---- -- -- --:--:--';
  }
  
  try {
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) {
      console.warn('formatTime received invalid date string:', timeStr);
      return timeStr;
    }
    return date.toLocaleString();
  } catch (e) {
    console.error('Error formatting time:', e, 'Input:', timeStr);
    return timeStr;
  }
}

// 添加日志
const addLog = (log: LogEntry) => {
  // Ensure log has createTime
  if (!log.createTime) {
    log.createTime = new Date().toLocaleString();
  }
  
  logs.value.push(log);
  if (logs.value.length > 1000) {
    logs.value = logs.value.slice(-1000);
  }
  scrollToBottom();
}

// 滚动到底部
const scrollToBottom = () => {
  if (terminalRef.value) {
    setTimeout(() => {
      terminalRef.value!.scrollTop = terminalRef.value!.scrollHeight
    }, 0)
  }
}

// 加载历史日志
const loadHistoryLogs = async () => {
  try {
    console.log('调用 API 获取历史日志');
    const response = await getLogList({ pageSize: 100, page: 1 });

    if (response && response.code === 200 && Array.isArray(response.data)) {
      const logEntries: LogEntry[] = response.data; 

      const historyLogs = logEntries
        .sort((a, b) => {
          const timeA = a.createTime || '0';
          const timeB = b.createTime || '0';
          return new Date(timeA).getTime() - new Date(timeB).getTime(); 
        });

      logs.value = historyLogs;
      console.log(`成功加载 ${historyLogs.length} 条历史日志`);
      nextTick(() => {
         scrollToBottom();
      });
    } else {
      console.error('加载历史日志失败: API 返回无效数据结构或错误代码', response);
      ElMessage.warning(response?.message || '加载历史日志失败，请检查后端服务或API响应');
    }
  } catch (error) {
    console.error('加载历史日志失败 (catch):', error);
    ElMessage.error('加载历史日志时发生网络或处理错误');
  }
}

// 删除旧日志
const handleDeleteOldLogs = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要删除数据库中的【所有】系统日志吗？此操作不可恢复！',
      '警告',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        buttonSize: 'default'
      }
    );

    // User confirmed
    try {
      const response = await apiClearLogs();
      if (response.code === 200) {
        logs.value = [];
        ElMessage.success('所有日志已成功删除');
      } else {
        ElMessage.error(response.message || '删除日志失败');
      }
    } catch (apiError: any) {
      console.error('删除日志 API 调用失败:', apiError);
      ElMessage.error(apiError.message || '删除日志时发生错误');
    }

  } catch (cancel) {
    // User clicked cancel or closed the dialog
    ElMessage.info('已取消删除操作');
  }
}

// 导出日志
const exportLogs = () => {
  const logText = logs.value
    .map(log => `[${formatTime(log.createTime)}][${log.type}] ${log.operator ? `${log.operator} ${log.operation} ` : ''}${log.content}`)
    .join('\n')
  
  const blob = new Blob([logText], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `system-logs-${new Date().toISOString().slice(0, 10)}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  ElMessage.success('日志导出成功')
}

// 初始化 WebSocket
const initWebSocket = () => {
  try {
    socket = io('http://localhost:3000', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })

    socket.on('connect', () => {
      addLog({
        type: 'system',
        operation: 'WEBSOCKET',
        content: 'WebSocket连接成功',
        operator: 'system',
        createTime: new Date().toLocaleString()
      })
    })

    socket.on('serverLog', (logData: LogEntry) => {
      // 确保接收到的日志有创建时间
      if (!logData.createTime) {
        logData.createTime = new Date().toLocaleString()
      }
      addLog(logData)
    })

    socket.on('connect_error', (error) => {
      console.error('WebSocket连接失败:', error)
      addLog({
        type: 'error', // Use 'error' type for consistency
        operation: 'WEBSOCKET_ERROR', // More specific operation
        content: `WebSocket连接失败: ${error.message}. 无法接收实时日志。`, // More informative message
        operator: 'system',
        createTime: new Date().toLocaleString()
      })
      // Do NOT generate mock logs on connection error
      // if (logs.value.length <= 1) {
      //   generateMockLogs();
      // }
       ElMessage.error('WebSocket 连接失败，无法接收实时日志'); // Show error to user
    })
  } catch (error) {
    console.error('WebSocket初始化失败:', error);
    ElMessage.error('WebSocket 初始化失败'); // Show error to user
    // Do NOT generate mock logs here
    // if (logs.value.length === 0) {
    //   generateMockLogs();
    // }
  }
}

// 组件挂载与卸载
onMounted(async () => {
  await loadHistoryLogs(); // Load real history first

  // Remove the check that generates mock logs if history is empty
  // if (logs.value.length === 0) {
  //   generateMockLogs();
  // }

  initWebSocket(); // Then connect WebSocket
})

onUnmounted(() => {
  if (socket) {
    socket.disconnect()
  }
})
</script>

<style scoped>
.log-container {
  padding: 20px;
  height: calc(100vh - 124px);
  display: flex;
  flex-direction: column;
  gap: 20px;
  transition: background-color 0.3s;
}

.operation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  transition: background-color 0.3s, border-color 0.3s, box-shadow 0.3s;
}

.log-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  transition: color 0.3s;
}

.operation-buttons {
  display: flex;
  gap: 10px;
}

.log-terminal {
  flex: 1;
  background: #1e1e1e;
  border-radius: 8px;
  padding: 20px;
  overflow-y: auto;
  font-family: Consolas, 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', monospace, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  border: 1px solid #333;
  transition: border-color 0.3s;
}

.log-line {
  margin: 4px 0;
  color: #d4d4d4;
  display: flex;
  align-items: flex-start;
}

.log-time {
  color: #888;
  margin-right: 10px;
  font-size: 0.9em;
  min-width: 160px;
  white-space: nowrap;
}

.log-content {
  flex: 1;
  display: flex;
  gap: 8px;
  word-break: break-all;
  align-items: center;
}

.log-operator {
  color: #9cdcfe;
  font-weight: bold;
}

.log-message {
  color: inherit;
}

.log-info .log-content {
  color: #4CAF50;
}

.log-warn .log-content {
  color: #FFC107;
}

.log-error .log-content {
  color: #F44336;
}

.log-insert .log-content {
  color: #4CAF50;
}

.log-update .log-content {
  color: #FFC107;
}

.log-delete .log-content {
  color: #F44336;
}

.log-query .log-content {
  color: #2196F3;
}

.log-stats {
  display: flex;
  gap: 15px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  transition: background-color 0.3s, border-color 0.3s, box-shadow 0.3s;
}

:deep(.el-tag) {
  padding: 8px 12px;
  font-size: 14px;
}

.log-database {
  color: #FFC107;
}

.log-system {
  color: #4CAF50;
}

.log-vue {
  color: #2196F3;
}

/* 添加操作类型的特殊样式 */
.log-line[data-operation="查询列表"] .log-content,
.log-line[data-operation="查询详情"] .log-content {
  color: #2196F3;
}

.log-line[data-operation="新增"] .log-content {
  color: #4CAF50;
}

.log-line[data-operation="更新"] .log-content {
  color: #FFC107;
}

.log-line[data-operation="删除"] .log-content {
  color: #F44336;
}

/* --- Dark Mode Styles using Conditional Class --- */

.dark-component-bg {
  background-color: #1f2937 !important;
  border-color: var(--el-border-color-lighter) !important;
  box-shadow: var(--el-box-shadow-light) !important;
}

/* Container background */
:deep(.app-wrapper.dark) .log-container {
   background-color: var(--el-bg-color-page);
}

/* Header */
.operation-header.dark-component-bg .log-title {
  color: #e0e0e0;
}
.operation-header.dark-component-bg :deep(.el-button) {
   background-color: var(--el-button-bg-color);
   color: var(--el-button-text-color);
   border-color: var(--el-button-border-color);
}
.operation-header.dark-component-bg :deep(.el-button:hover),
.operation-header.dark-component-bg :deep(.el-button:focus) {
   background-color: var(--el-button-hover-bg-color);
   color: var(--el-button-hover-text-color);
   border-color: var(--el-button-hover-border-color);
}

/* Terminal (adjust border) */
:deep(.app-wrapper.dark) .log-terminal {
   border-color: #4b5563;
}

/* Stats */
.log-stats.dark-component-bg :deep(.el-tag) {
   background-color: #374151;
   color: #a0a0a0;
   border-color: #4b5563;
}
/* Optional: Adjust specific tag colors for better contrast if needed */
.log-stats.dark-component-bg :deep(.el-tag--success) {
   background-color: #1e4620;
   color: #a7f3d0;
   border-color: #2f6f49;
}
.log-stats.dark-component-bg :deep(.el-tag--warning) {
   background-color: #573a00;
   color: #fde047;
   border-color: #8c6c00;
}
.log-stats.dark-component-bg :deep(.el-tag--danger) {
   background-color: #5c1e1e;
   color: #fecaca;
   border-color: #992d2d;
}
.log-stats.dark-component-bg :deep(.el-tag--info) {
   background-color: #374151;
   color: #a0a0a0;
   border-color: #4b5563;
}
</style>