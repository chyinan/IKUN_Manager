<template>
  <div class="log-container">
    <!-- 顶部操作栏 -->
    <div class="operation-header">
      <div class="log-title">
        <el-icon><Monitor /></el-icon>
        <span>系统日志监控</span>
      </div>
      <div class="operation-buttons">
        <el-button type="warning" @click="clearLogs">
          <el-icon><Delete /></el-icon>清空日志
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
            <span class="log-operation">{{ log.operation }}</span>
            <span class="log-message">{{ formatLogContent(log.content) }}</span>
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
      <el-tag type="danger">Vue: {{ vueCount }}</el-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Monitor, Delete, Download } from '@element-plus/icons-vue'
import { io, Socket } from 'socket.io-client'
import type { LogEntry, LogType } from '@/types/log'
import { getLogList } from '@/api/log'

// 日志列表
const logs = ref<LogEntry[]>([])
const terminalRef = ref<HTMLElement>()
let socket: Socket

// 统计数据
const systemCount = computed(() => logs.value.filter(log => log.type === 'system').length)
const dbCount = computed(() => logs.value.filter(log => log.type === 'database').length)
const vueCount = computed(() => logs.value.filter(log => log.type === 'vue').length)

// 格式化时间显示
const formatTime = (timeStr: string | undefined) => {
  if (!timeStr) {
    return new Date().toLocaleString()
  }
  
  try {
    // 尝试解析时间字符串
    const date = new Date(timeStr)
    // 检查是否为有效日期
    if (isNaN(date.getTime())) {
      return timeStr // 如果无法解析，则原样返回
    }
    return date.toLocaleString()
  } catch (e) {
    return timeStr // 出错时原样返回
  }
}

// 格式化日志内容，去除重复的用户名和操作
const formatLogContent = (content: string | undefined) => {
  if (!content) return '';
  
  // 检查内容是否包含用户名和操作（通常是重复的）
  const parts = content.split(' ');
  
  // 如果内容以用户名开头，后面跟着操作，则去除这部分
  if (parts.length >= 2) {
    // 检查第一部分是否与operator相同，第二部分是否与operation相同
    // 这里我们简单地检查内容的格式，如果符合"用户名 操作 其他内容"的模式，则只返回"其他内容"部分
    return parts.slice(2).join(' ');
  }
  
  return content;
}

// 添加日志
const addLog = (log: LogEntry) => {
  // 确保日志有创建时间
  if (!log.createTime) {
    log.createTime = new Date().toLocaleString();
  }
  
  // 处理可能的内容重复问题
  if (log.content && log.operator && log.operation) {
    // 检查内容是否以用户名和操作开头
    const prefix = `${log.operator} ${log.operation}`;
    if (log.content.startsWith(prefix)) {
      // 移除重复的前缀
      log.content = log.content.substring(prefix.length).trim();
    }
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
    const res = await getLogList();
    if (res.code === 200 && res.data) {
      const historyLogs = res.data
        .sort((a, b) => {
          // 确保有效的日期比较
          const dateA = a.createTime ? new Date(a.createTime).getTime() : 0;
          const dateB = b.createTime ? new Date(b.createTime).getTime() : 0;
          return dateB - dateA;
        })
        .map(log => {
          // 处理可能的内容重复问题
          if (log.content && log.operator && log.operation) {
            const prefix = `${log.operator} ${log.operation}`;
            if (log.content.startsWith(prefix)) {
              log.content = log.content.substring(prefix.length).trim();
            }
          }
          
          return {
            ...log,
            // 确保每条日志都有创建时间
            createTime: log.createTime || new Date().toLocaleString()
          };
        });
      logs.value = historyLogs;
    }
  } catch (error) {
    console.error('加载历史日志失败:', error);
    ElMessage.error('加载历史日志失败');
  }
}

// 清空日志
const clearLogs = () => {
  logs.value = []
  ElMessage.success('日志已清空')
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
      type: 'system',
      operation: 'ERROR',
      content: `WebSocket连接失败: ${error.message}`,
      operator: 'system',
      createTime: new Date().toLocaleString()
    })
  })
}

// 组件挂载与卸载
onMounted(async () => {
  await loadHistoryLogs()
  initWebSocket()
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
}

.operation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.log-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: bold;
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
  font-family: 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.5;
}

.log-line {
  margin: 4px 0;
  color: #ffffff;
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
  color: #64B5F6;
  font-weight: bold;
}

.log-operation {
  color: #9575CD;
  font-style: italic;
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
</style>