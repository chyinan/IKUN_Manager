<template>
  <div class="upcoming-exams-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>待考考试</span>
        </div>
      </template>
      <el-empty description="待考考试功能正在建设中..."></el-empty>
      <!-- TODO: Add upcoming exam listing here -->
      <!-- For example: A list or table of exams with their dates and subjects -->
    </el-card>
  </div>
</template>

<script setup lang="ts">
// Future imports and logic for fetching and displaying upcoming exams
</script>

<style scoped lang="scss">
.upcoming-exams-container {
  padding: 0; // Main padding is handled by StudentLayout
}

.card-header span {
  font-weight: bold;
  font-size: 18px;
}
</style> 