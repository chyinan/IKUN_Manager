<template>
  <div class="my-scores-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>我的成绩</span>
        </div>
      </template>
      <el-empty description="成绩查询功能正在建设中..."></el-empty>
      <!-- TODO: Add score listing and details here -->
      <!-- For example: A table of completed exams, with options to view detailed scores -->
    </el-card>
  </div>
</template>

<script setup lang="ts">
// Future imports and logic for fetching and displaying scores
</script>

<style scoped lang="scss">
.my-scores-container {
  padding: 0; // Main padding is handled by StudentLayout
}

.card-header span {
  font-weight: bold;
  font-size: 18px;
}
</style> 