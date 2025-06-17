<template>
  <div class="teacher-dashboard">
    <el-page-header content="教师首页" style="margin-bottom: 16px;" />
    <el-card>
      <h2>欢迎 {{ displayName }}！</h2>
      <p>这是教师教学门户的首页。在这里您可以快速进入学生管理、成绩管理、考试管理和作业管理等功能。</p>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const displayName = computed(() => userStore.userInfo?.displayName || userStore.username)
</script>

<style scoped>
.teacher-dashboard {
  padding: 16px;
}
</style> 