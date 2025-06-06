<template>
  <el-container class="student-layout-container">
    <el-header class="student-header">
      <div class="logo-area">
        GGS学生门户
      </div>
      <div class="user-actions">
        <span>欢迎您，{{ userStore.userInfo?.display_name || userStore.username }}</span>
        <el-dropdown @command="handleCommand">
          <span class="el-dropdown-link">
            <el-avatar :src="userStore.avatar" :icon="UserFilled" size="small" style="margin-right: 8px;"></el-avatar>
            个人中心<el-icon class="el-icon--right"><arrow-down /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人设置</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>
    <el-container>
      <el-aside width="220px" class="student-aside">
        <el-menu
          :default-active="activeMenu"
          class="student-menu"
          router
        >
          <el-menu-item index="/student-portal/dashboard">
            <el-icon><House /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="/student-portal/my-scores">
            <el-icon><Memo /></el-icon>
            <span>我的成绩</span>
          </el-menu-item>
          <el-menu-item index="/student-portal/upcoming-exams">
            <el-icon><Clock /></el-icon>
            <span>待考考试</span>
          </el-menu-item>
          <el-menu-item index="/student-portal/mailbox">
            <el-icon><Message /></el-icon>
            <span>我的信箱</span>
          </el-menu-item>
          <el-menu-item index="/student-portal/announcements">
            <el-icon><Bell /></el-icon>
            <span>学校通知</span>
          </el-menu-item>
          <el-menu-item index="/student-portal/profile-settings">
            <el-icon><Setting /></el-icon>
            <span>个人设置</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main class="student-main">
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
import { ArrowDown, House, Memo, Clock, Bell, Setting, Document, UserFilled, Message } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => {
  return route.path
})

const handleCommand = (command: string) => {
  console.log(`[StudentLayout] handleCommand triggered with command: ${command}`);
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }).then(async () => {
      console.log('[StudentLayout] Logout confirmed by user.');
      try {
        await userStore.logoutAction();
        console.log('[StudentLayout] userStore.logoutAction() completed.');
        ElMessage.success('已成功退出登录');
        // router.push('/login'); // Commented out as userStore.resetState() handles it
        console.log('[StudentLayout] Logout process in .then() finished.');
      } catch (error) {
        console.error('[StudentLayout] Error during userStore.logoutAction() or subsequent steps in .then():', error);
      }
    }).catch(() => {
      console.log('[StudentLayout] Logout cancelled by user (outer .catch).');
      // User cancelled
    })
  } else if (command === 'profile') {
    router.push('/student-portal/profile-settings')
  }
}
</script>

<style scoped lang="scss">
.student-layout-container {
  height: 100vh;
  background-color: #f0f2f5;
}

.student-header {
  background-color: #001529; // Dark blue, common for admin headers
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;
  line-height: 60px;

  .logo-area {
    font-size: 20px;
    font-weight: bold;
  }

  .user-actions {
    display: flex;
    align-items: center;
    gap: 15px;
    .el-dropdown-link {
      cursor: pointer;
      color: white;
      display: flex;
      align-items: center;
    }
  }
}

.student-aside {
  background-color: #fff;
  border-right: 1px solid #e6e6e6;
  transition: width 0.3s; // For potential collapse functionality later

  .student-menu {
    border-right: none; // Remove default border from el-menu
    height: calc(100vh - 60px); // Full height minus header
    overflow-y: auto;

    .el-menu-item {
      &.is-active {
        background-color: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
        border-right: 3px solid var(--el-color-primary);
      }
      &:hover {
        background-color: #f5f7fa;
      }
    }
  }
}

.student-main {
  padding: 20px;
  background-color: #f0f2f5;
  // The global transition from App.vue might also apply here if not carefully managed.
  // For now, we use a transition directly within the student layout.
}

// Ensure icons are visible
.el-icon {
  vertical-align: middle;
}
</style> 