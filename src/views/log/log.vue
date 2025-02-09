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

// 添加日志
const addLog = (log: LogEntry) => {
  logs.value.push(log)
  if (logs.value.length > 1000) {
    logs.value = logs.value.slice(-1000)
  }
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

onMounted(() => {
  // 订阅日志事件
  emitter.on('log', (log: any) => addLog(log as LogEntry))
  if (terminalRef.value) {
    terminalRef.value.addEventListener('scroll', handleScroll)
  }

  // 数据库操作日志
  logger.db('INSERT', '员工表', '新增员工: 张三')

  // Vue组件日志
  logger.vue('组件已加载')

  // 系统日志
  logger.system('用户登录成功')
})

onUnmounted(() => {
  emitter.off('log')
  if (terminalRef.value) {
    terminalRef.value.removeEventListener('scroll', handleScroll)
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
}

.log-time {
  color: #666;
  margin-right: 10px;
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
</style>