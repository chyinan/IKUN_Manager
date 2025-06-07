<template>
  <el-container class="student-layout-container">
    <el-header class="student-header">
      <div class="logo-area">
        校园学生门户
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
      customClass: 'glass-message-box'
    }).then(async () => {
      console.log('[StudentLayout] Logout confirmed by user.');
      try {
        await userStore.logout();
        console.log('[StudentLayout] userStore.logout() completed.');
        ElMessage.success('已成功退出登录');
        // router.push('/login'); // Commented out as userStore.resetState() handles it
        console.log('[StudentLayout] Logout process in .then() finished.');
      } catch (error) {
        console.error('[StudentLayout] Error during userStore.logout() or subsequent steps in .then():', error);
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
/* Summer Sea Blue V2 Theme Start */

// Define colors for easy management
$primary-text: #023047; // Prussian Blue
$accent-color: #0077b6; // A nice, rich blue
$gradient-start: #89f7fe; // Light cyan
$gradient-end: #66a6ff; // Light blue

.student-layout-container {
  min-height: 100vh; // Use min-height to allow content to expand
  position: relative;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  background-color: $gradient-end; // Fallback color
  isolation: isolate; // Create a new stacking context

  // Use a pseudo-element for the fixed background
  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: linear-gradient(135deg, $gradient-start 0%, $gradient-end 100%);
    z-index: -1; // Place it behind the container's content but within its stacking context
  }
}

.student-header {
  // Use a slightly transparent, blurred header that floats over the content
  background-color: rgba(255, 255, 255, 0.5);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  color: $primary-text;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 25px;
  height: 60px;
  line-height: 60px;
  position: sticky; // Make header sticky
  top: 0;
  z-index: 100;

  .logo-area {
    font-size: 21px;
    font-weight: 600;
    color: $primary-text;
  }

  .user-actions {
    display: flex;
    align-items: center;
    gap: 15px;
    font-weight: 500;
    .el-dropdown-link {
      cursor: pointer;
      color: $primary-text;
      display: flex;
      align-items: center;
      transition: color 0.2s ease;
      &:hover {
        color: $accent-color;
      }
    }
  }
}

.student-aside {
  width: 220px;
  // Make aside also have the glass effect, but slightly more transparent than header
  background-color: rgba(255, 255, 255, 0.35);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(255, 255, 255, 0.18);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: calc(100vh - 60px); // Adjust for header height
  position: sticky; // Make aside sticky
  top: 60px;

  .student-menu {
    background-color: transparent;
    border-right: none;
    height: 100%;
    padding-top: 10px;

    .el-menu-item {
      color: $primary-text;
      font-weight: 500;
      height: 48px;
      line-height: 48px;
      margin: 6px 10px;
      border-radius: 8px;
      transition: all 0.3s ease;

      .el-icon {
        margin-right: 12px;
        font-size: 18px;
        transition: color 0.3s ease;
      }

      &:hover {
        background-color: rgba(255, 255, 255, 0.4);
        color: $accent-color;
        transform: translateX(4px);
      }

      &.is-active {
        background-color: $accent-color;
        color: #fff;
        font-weight: 600;
        box-shadow: 0 4px 12px -4px rgba(0, 119, 182, 0.7);

        .el-icon {
          color: #fff;
        }
      }
    }
  }
}

.student-main {
  padding: 24px;
  background-color: transparent;
  // The main container will grow, so this doesn't need a specific height.
}

// Page transition styles
.page-slide-fade-enter-active,
.page-slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.55, 0, 0.1, 1);
}

.page-slide-fade-enter-from,
.page-slide-fade-leave-to {
  opacity: 0;
  transform: translateY(15px);
}

// Remove default focus outline for dropdown
.el-dropdown-link:focus {
  outline: none;
}
</style>

<style lang="scss">
/* Non-scoped styles for globally injected components like ElMessageBox */
.glass-message-box {
  background-color: rgba(41, 78, 114, 0.75) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  border-radius: 12px !important;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37) !important;
}

.glass-message-box .el-message-box__header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.glass-message-box .el-message-box__title,
.glass-message-box .el-message-box__content {
  color: #fff !important;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
}

.glass-message-box .el-message-box__content {
  font-size: 15px;
  font-weight: 500;
}

.glass-message-box .el-message-box__btns .el-button--primary {
  --el-button-bg-color: rgba(255, 255, 255, 0.2) !important;
  --el-button-border-color: rgba(255, 255, 255, 0.3) !important;
  --el-button-hover-bg-color: rgba(255, 255, 255, 0.3) !important;
  --el-button-hover-border-color: rgba(255, 255, 255, 0.4) !important;
  --el-button-text-color: #fff !important;
}

.glass-message-box .el-message-box__btns .el-button--default {
  background-color: transparent !important;
  border-color: transparent !important;
  color: #e5e7eb !important;
}
.glass-message-box .el-message-box__btns .el-button--default:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}
</style>

 