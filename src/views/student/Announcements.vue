<template>
  <div class="announcements-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>学校通知</span>
        </div>
      </template>
      <el-empty description="学校通知功能正在建设中...后端接口待实现。"></el-empty>
      <!-- TODO: Add announcement listing here once backend is ready -->
    </el-card>
  </div>
</template>

<script setup lang="ts">
// Future imports and logic for fetching and displaying announcements
</script>

<style scoped lang="scss">
.announcements-container {
  padding: 0; // Main padding is handled by StudentLayout
}

.card-header span {
  font-weight: bold;
  font-size: 18px;
}
</style> 