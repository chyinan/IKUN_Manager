<template>
  <el-container class="teacher-layout-container">
    <el-header class="teacher-header">
      <div class="logo-area">教师教学门户</div>
    </el-header>
    <el-container>
      <el-aside width="220px" class="teacher-aside">
        <el-menu
          :default-active="activeMenu"
          router
          class="teacher-menu"
        >
          <el-menu-item index="/teacher-portal/dashboard">
            <el-icon><House /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="/teacher-portal/students">
            <el-icon><User /></el-icon>
            <span>学生管理</span>
          </el-menu-item>
          <el-menu-item index="/teacher-portal/scores">
            <el-icon><Memo /></el-icon>
            <span>成绩管理</span>
          </el-menu-item>
          <el-menu-item index="/teacher-portal/exams">
            <el-icon><Calendar /></el-icon>
            <span>考试管理</span>
          </el-menu-item>
          <el-menu-item index="/teacher-portal/assignments">
            <el-icon><Document /></el-icon>
            <span>作业管理</span>
          </el-menu-item>
          <el-menu-item index="/teacher-portal/student-report">
            <el-icon><PieChart /></el-icon>
            <span>学生信息统计</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main class="teacher-main">
        <router-view v-slot="{ Component }">
          <transition name="page-slide-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { House, User, Memo, Calendar, Document, PieChart } from '@element-plus/icons-vue'

const route = useRoute()
const activeMenu = computed(() => route.path)
</script>

<style scoped lang="scss">
.teacher-layout-container {
  min-height: 100vh;
}
.teacher-header {
  background: #409eff;
  color: #fff;
  height: 60px;
  line-height: 60px;
  padding: 0 20px;
  font-size: 20px;
  font-weight: 600;
}
.teacher-aside {
  background: #ffffff;
  border-right: 1px solid #e4e7ed;
}
.teacher-main {
  padding: 15px;
  background: #f5f7fa;
}
</style> 