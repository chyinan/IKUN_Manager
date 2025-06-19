<template>
  <el-container class="teacher-layout-container">
    <el-header class="teacher-header">
      <div class="logo-area">教师教学门户</div>
      <div class="user-actions">
        <span>欢迎您，{{ userStore.userInfo?.displayName || userStore.username }}</span>
        <el-dropdown @command="handleCommand" trigger="click" popper-class="user-profile-dropdown">
          <el-avatar :src="userStore.avatar" :icon="UserFilled" class="user-avatar" />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout" :icon="SwitchButton" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
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
          <el-menu-item index="/teacher-portal/classes">
            <el-icon><School /></el-icon>
            <span>班级管理</span>
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
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  House, User, Memo, Calendar, Document, PieChart, SwitchButton, UserFilled, School
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)

const handleCommand = (command: string) => {
  console.log(`[TeacherLayout] handleCommand triggered with command: ${command}`);
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      customClass: 'glass-message-box'
    }).then(async () => {
      console.log('[TeacherLayout] Logout confirmed by user.');
      try {
        await userStore.logoutAction();
        console.log('[TeacherLayout] userStore.logout() completed.');
        ElMessage.success('已成功退出登录');
        router.push('/login');
        console.log('[TeacherLayout] Logout process in .then() finished.');
      } catch (error) {
        console.error('[TeacherLayout] Error during userStore.logout() or subsequent steps in .then():', error);
      }
    }).catch(() => {
      console.log('[TeacherLayout] Logout cancelled by user (outer .catch).');
    })
  }
}
</script>

<style scoped lang="scss">
.teacher-layout-container {
  min-height: 100vh;
}
.teacher-header {
  background: #67c23ad4;
  color: #fff;
  height: 60px;
  line-height: 60px;
  padding: 0 20px;
  font-size: 20px;
  font-weight: 600;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.teacher-aside {
  background: #ffffff;
  border-right: 1px solid #e4e7ed;
}
.teacher-main {
  padding: 15px;
  background: #f5f7fa;
}
.user-actions {
  display: flex;
  align-items: center;
  gap: 15px;
  font-weight: 500;

  .user-avatar {
    cursor: pointer;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    &:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
  }
}
</style> 