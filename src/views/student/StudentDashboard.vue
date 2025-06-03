<template>
  <div class="student-dashboard-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>欢迎来到IKUN学生门户</span>
        </div>
      </template>
      <el-empty description="学生首页内容正在建设中..."></el-empty>
      <!-- TODO: Add dashboard content here -->
      <!-- For example: Quick links, summary of upcoming exams, recent scores or announcements -->
    </el-card>
  </div>
</template>

<script setup lang="ts">
// Future imports and logic for the dashboard
</script>

<style scoped lang="scss">
.student-dashboard-container {
  padding: 0; // Main padding is handled by StudentLayout
}

.card-header span {
  font-weight: bold;
  font-size: 18px;
}
</style> 