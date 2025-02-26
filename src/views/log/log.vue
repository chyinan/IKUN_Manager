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
        <el-button type="primary" @click="toggleAutoScroll">
          <el-icon><VideoPlay /></el-icon>{{ autoScroll ? '暂停滚动' : '开始滚动' }}
        </el-button>
        <el-button type="success" @click="exportLogs">
          <el-icon><Download /></el-icon>导出日志
        </el-button>
      </div>
    </div>

    <!-- 日志显示区域 -->
    <div class="log-terminal" 
      ref="terminalRef" 
      @scroll="handleScroll">
      <div 
        v-for="(log, index) in logs" 
        :key="index"
        :class="['log-line', `log-${log.type}`]">
        <span class="log-time">[{{ log.time }}]</span>
        <span class="log-content">{{ log.content }}</span>
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
import { Monitor, Delete, Download, VideoPlay } from '@element-plus/icons-vue'
import { emitter } from '@/utils/eventBus'
import { logger } from '@/utils/logger'
import { io } from 'socket.io-client'
import { getLogList } from '@/api/log'

interface LogEntry {
  time: string
  type: 'database' | 'system' | 'vue'
  content: string
}

const logs = ref<LogEntry[]>([])
const terminalRef = ref<HTMLElement>()
const autoScroll = ref(true)

// 统计数据
const systemCount = computed(() => logs.value.filter(log => log.type === 'system').length)
const dbCount = computed(() => logs.value.filter(log => log.type === 'database').length)
const vueCount = computed(() => logs.value.filter(log => log.type === 'vue').length)

// 修改添加日志的方法
const addLog = (log: LogEntry) => {
  console.log('添加日志:', log)
  // 在数组末尾添加新日志
  logs.value.push(log)
  // 限制日志数量，保留最新的1000条
  if (logs.value.length > 1000) {
    logs.value = logs.value.slice(-1000)
  }
  // 如果开启了自动滚动，滚动到底部
  if (autoScroll.value) {
    scrollToBottom()
  }
}

// 滚动到底部
const scrollToBottom = () => {
  if (terminalRef.value) {
    setTimeout(() => {
      terminalRef.value!.scrollTop = terminalRef.value!.scrollHeight
    }, 0)
  }
}

// 滚动处理
const handleScroll = () => {
  if (!terminalRef.value) return
  
  const { scrollTop, scrollHeight, clientHeight } = terminalRef.value
  const atBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 10
  
  if (!atBottom && autoScroll.value) {
    autoScroll.value = false
  }
  if (atBottom && !autoScroll.value) {
    autoScroll.value = true
  }
}

// 清空日志
const clearLogs = () => {
  logs.value = []
  ElMessage.success('日志已清空')
}

// 切换自动滚动
const toggleAutoScroll = () => {
  autoScroll.value = !autoScroll.value
  if (autoScroll.value) {
    scrollToBottom()
  }
}

// 导出日志
const exportLogs = () => {
  const logText = logs.value
    .map(log => `[${log.time}] ${log.content}`)
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

// 创建Socket连接
const socket = io('http://localhost:3000', {
  transports: ['websocket'],  // 强制使用WebSocket
  reconnection: true,         // 启用重连
  reconnectionAttempts: 5,    // 最大重连次数
  reconnectionDelay: 1000     // 重连延迟
})

// 添加连接状态监听
socket.on('connect', () => {
  console.log('WebSocket连接成功')
  addLog({
    time: new Date().toLocaleTimeString(),
    type: 'system',
    content: 'WebSocket连接成功'
  })
})

socket.on('connect_error', (error) => {
  console.error('WebSocket连接失败:', error)
  addLog({
    time: new Date().toLocaleTimeString(),
    type: 'system',
    content: `WebSocket连接失败: ${error.message}`
  })
})

// 修改加载历史日志的方法
const loadHistoryLogs = async () => {
  try {
    const res = await getLogList({ limit: 1000 })
    if (res.code === 200) {
      // 将历史日志按时间倒序排列
      const historyLogs = res.data
        .sort((a, b) => new Date(b.create_time).getTime() - new Date(a.create_time).getTime())
        .map(log => ({
          time: new Date(log.create_time).toLocaleTimeString(),
          type: log.type,
          content: log.content
        }))
      // 使用新的日志替换当前日志列表
      logs.value = historyLogs
    }
  } catch (error) {
    console.error('加载历史日志失败:', error)
  }
}

// 修改socket连接和监听部分
onMounted(async () => {
  await loadHistoryLogs()
  // 订阅本地日志事件
  emitter.on('log', (log: any) => addLog(log as LogEntry))
  
  if (terminalRef.value) {
    terminalRef.value.addEventListener('scroll', handleScroll)
  }

  // 监听服务器日志
  socket.on('serverLog', (logData: LogEntry) => {
    console.log('收到服务器日志:', logData)
    
    // 确保日志格式正确
    const formattedLog = {
      time: logData.time || new Date().toLocaleTimeString(),
      type: logData.type || 'system',
      content: logData.content || '未知操作'
    }
    
    // 添加到日志列表
    addLog(formattedLog)
  })
})

onUnmounted(() => {
  emitter.off('log')
  if (terminalRef.value) {
    terminalRef.value.removeEventListener('scroll', handleScroll)
  }
  // 断开Socket连接
  socket.off('serverLog')
  socket.off('connect')
  socket.off('connect_error')
  socket.disconnect()
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
  align-items: center;
}

.log-time {
  color: #888;
  margin-right: 10px;
  font-size: 0.9em;
  min-width: 80px;
}

.log-content {
  flex: 1;
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