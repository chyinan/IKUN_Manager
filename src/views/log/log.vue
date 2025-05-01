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
    <div class="log-stats">
      <el-tag type="info">总日志数: {{ logs.length }}</el-tag>
      <el-tag type="success">系统: {{ systemCount }}</el-tag>
      <el-tag type="warning">数据库: {{ dbCount }}</el-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
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
  color: #888;
  margin-right: 10px;
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