<template>
  <div class="app-wrapper" :class="{ 'is-collapse': isCollapse, 'dark': isDark }">
    <!-- 侧边栏 -->
    <div class="sidebar-container">
      <div class="logo-container">
        <img src="@/assets/logo.png" alt="Logo" class="logo" />
        <h1 v-show="!isCollapse" class="title">高校人事管理系统</h1>
      </div>
      
      <el-scrollbar>
        <el-menu
          :default-active="activeMenu"
          :collapse="isCollapse"
          :unique-opened="true"
          :collapse-transition="false"
          class="sidebar-menu"
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
        >
          <sidebar-item
            v-for="route in routes"
            :key="route.path"
            :item="route"
            :base-path="route.path"
          />
        </el-menu>
      </el-scrollbar>
    </div>
    
    <!-- 主要内容区域 -->
    <div class="main-container">
      <!-- 顶部导航栏 -->
      <div class="navbar">
        <div class="left-menu">
          <el-icon class="fold-icon" @click="toggleSidebar">
            <component :is="isCollapse ? 'Expand' : 'Fold'" />
          </el-icon>
          
          <breadcrumb class="breadcrumb" />
        </div>
        
        <div class="right-menu">
          <!-- Dark Mode Switch -->
          <el-switch
            v-model="isDark"
            inline-prompt
            :active-icon="Moon"
            :inactive-icon="Sunny"
            class="dark-mode-switch"
            style="--el-switch-on-color: #2c2c2c; --el-switch-off-color: #f2f2f2;"
            @change="logSwitchChange"
          />
          
          <!-- User Avatar Dropdown -->
          <el-dropdown trigger="click" @command="handleCommand">
            <div class="avatar-container">
              <el-avatar :size="32" :src="userStore.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" />
              <span class="username">{{ userStore.username || '用户' }}</span>
              <el-icon><CaretBottom /></el-icon>
            </div>
            
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  <span>个人中心</span>
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  <span>退出登录</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      
      <!-- 内容区域 -->
      <div class="app-main">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <keep-alive>
              <component :is="Component" />
            </keep-alive>
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import SidebarItem from '@/components/SidebarItem.vue'
import Breadcrumb from '@/components/Breadcrumb.vue'
import { useDark, useToggle } from '@vueuse/core'
import { 
  Expand, 
  Fold, 
  User, 
  SwitchButton, 
  CaretBottom,
  Moon,
  Sunny
} from '@element-plus/icons-vue'

// 路由
const route = useRoute()
const router = useRouter()

// 用户存储
const userStore = useUserStore()

// 侧边栏折叠状态
const isCollapse = ref(false)

// Dark mode setup
const isDark = useDark()

// New function to log switch changes
const logSwitchChange = (newValue: boolean) => {
  console.log('[DEBUG] Dark mode switch changed. New value:', newValue);
  // Manually toggle the isDark ref to see if useDark reacts
  // Note: v-model should theoretically handle this, but we add manual toggle for testing
  isDark.value = newValue;
};

// 切换侧边栏
const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}

// 获取路由 (添加权限过滤)
const routes = computed(() => {
  const allRoutes = router.options.routes.find(route => route.path === '/')?.children || [];
  const isAdmin = userStore.username === 'admin'; // 直接检查用户名
  console.log('Filtering routes, isAdmin:', isAdmin);
  
  return allRoutes.filter(r => {
    // 如果路由没有meta或没有requiresAdmin，则显示
    if (!r.meta || r.meta.hidden) return false; // Hide routes marked as hidden
    if (r.meta.requiresAdmin) {
      // 如果需要admin权限，则只有admin用户能看到
      return isAdmin;
    } else {
      // 不需要admin权限的路由都显示
      return true;
    }
  });
})

// 当前激活的菜单
const activeMenu = computed(() => {
  const { meta, path } = route
  if (meta.activeMenu) {
    return meta.activeMenu
  }
  return path
})

// 处理下拉菜单命令
const handleCommand = (command: string) => {
  if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      userStore.logout()
      // router.push('/login'); // logout action in store should handle redirect
    }).catch(() => {
      // 取消操作
    })
  }
}
</script>

<style scoped>
.app-wrapper {
  position: relative;
  height: 100vh;
  width: 100%;
  display: flex;
  /* Match sidebar background color to hide rendering gaps */
  background-color: #304156; /* Default light background (matches sidebar) */
  color: #303133; /* Default light text */
  transition: background-color 0.3s ease, color 0.3s ease;
}

.sidebar-container {
  width: 210px;
  height: 100%;
  background-color: #304156; /* Default sidebar background */
  transition: width 0.28s ease, background-color 0.3s ease;
  overflow: hidden;
  flex-shrink: 0;
}

/* Force active AND hover menu item background to match sidebar bg */
.sidebar-menu .el-menu-item.is-active,
.sidebar-menu .el-menu-item:hover {
  background-color: #304156 !important; /* Match light sidebar bg */
}

.is-collapse .sidebar-container {
  width: 64px;
  background-color: #1f2937; /* Darker sidebar */
}

.logo-container {
  height: 60px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1f2937 !important; /* Default logo area background */
  transition: background-color 0.3s ease; /* 恢复过渡 */
}

.logo {
  width: 32px;
  height: 32px;
  margin-right: 10px;
}

.title {
  color: #fff; /* Default title color */
  font-size: 16px;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
}

.sidebar-menu {
  border-right: none !important;
  height: calc(100% - 60px);
  /* Keep default colors from el-menu props */
}

/* Remove specific background override for items to allow el-menu props to work */
/* .sidebar-menu :deep(.el-menu-item) {
  background-color: #304156 !important;
  border: none !important;
  overflow: hidden;
} */

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.navbar {
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  background-color: #fff; /* Default navbar background */
  transition: background-color 0.3s ease, box-shadow 0.3s ease, color 0.3s ease; /* 恢复过渡 */
}

.left-menu {
  display: flex;
  align-items: center;
}

.fold-icon {
  font-size: 20px;
  cursor: pointer;
  margin-right: 20px;
}

.breadcrumb {
  margin-left: 8px;
}

.right-menu {
  display: flex;
  align-items: center;
  gap: 20px; /* Add gap for spacing */
}

.avatar-container {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.username {
  margin: 0 8px;
  font-size: 14px;
}

.app-main {
  flex: 1;
  overflow: auto;
  padding: 20px; /* Added padding */
  background-color: #f0f2f5; /* Default main area background */
  transition: background-color 0.3s ease; /* 恢复过渡 */
}

.dark-mode-switch {
  /* Adjust vertical alignment if needed */
  vertical-align: middle;
}

/* --- Dark Mode Styles --- */
.app-wrapper.dark {
  /* Match dark sidebar background color */
  background-color: #1f2937; /* Dark overall background (matches dark sidebar) */
  color: #e0e0e0; /* Lighter default text */
}

.app-wrapper.dark .sidebar-container {
  background-color: #1f2937; /* Darker sidebar */
}

/* Force active AND hover menu item background to match dark sidebar bg */
.app-wrapper.dark .sidebar-menu .el-menu-item.is-active,
.app-wrapper.dark .sidebar-menu .el-menu-item:hover {
  background-color: #1f2937 !important; /* Match dark sidebar bg */
}

.app-wrapper.dark .logo-container {
  background-color: #111827; /* Even darker logo area */
}

.app-wrapper.dark .navbar {
  background-color: #1f2937; /* Dark navbar */
  box-shadow: 0 1px 4px rgba(255, 255, 255, 0.08);
  color: #e0e0e0; /* Light text for navbar items */
}

.app-wrapper.dark .navbar .fold-icon,
.app-wrapper.dark .navbar .breadcrumb :deep(a),
.app-wrapper.dark .navbar .breadcrumb :deep(.el-breadcrumb__inner),
.app-wrapper.dark .navbar .breadcrumb :deep(.el-breadcrumb__separator) {
  color: #e0e0e0; /* Light text for navbar left items */
}

.app-wrapper.dark .navbar .username {
   color: #e0e0e0; /* Light text for username */
}

/* Ensure dropdown menu is dark */
:global(.el-popper.is-dark) {
    background: #1f2937 !important;
    border: 1px solid #4b5563 !important;
}
:global(.el-popper.is-dark .el-dropdown-menu__item),
:global(.el-popper.is-dark .el-dropdown-menu__item .el-icon) {
    color: #e0e0e0 !important;
}
:global(.el-popper.is-dark .el-dropdown-menu__item:hover) {
    background-color: #374151 !important;
    color: #ffffff !important;
}
:global(.el-popper.is-dark .el-dropdown-menu__item--divided::before) {
    background-color: #4b5563 !important;
}

.app-wrapper.dark .app-main {
  background-color: #18181b; /* Dark main content area */
}

/* Optional: Adjust specific Element Plus components in dark mode if needed */
/* Example: Darker background for Table Header */
.app-wrapper.dark :deep(.el-table__header-wrapper th) {
  background-color: #2a2a2e !important;
}
.app-wrapper.dark :deep(.el-table th.el-table__cell) {
   background-color: #2a2a2e !important; /* Ensure header background consistency */
}

/* Example: Ensure dialogs have dark background */
:global(.el-overlay-dialog .el-dialog.is-draggable) {
    background-color: var(--el-bg-color);
}
:global(html.dark .el-overlay-dialog .el-dialog.is-draggable) {
    background-color: #1f2937 !important; /* Dark background for dialog */
    color: #e0e0e0;
}
:global(html.dark .el-dialog__header) {
    color: #e0e0e0 !important;
}
:global(html.dark .el-dialog__body) {
    color: #e0e0e0 !important;
}
:global(html.dark .el-dialog__footer) {
     border-top: 1px solid #4b5563; /* Optional: Add separator */
}

/* --- End Dark Mode Styles --- */

/* 路由视图过渡动画 (纯淡入淡出，稍延长) */
.fade-transform-enter-active,
.fade-transform-leave-active {
  /* 明确指定只过渡 opacity */
  transition: opacity 0.5s ease; /* 延长至 0.5s 方便观察 */
}

.fade-transform-enter-from,
.fade-transform-leave-to {
  opacity: 0;
  /* 确保没有其他 transform 或属性干扰 */
}

/* 主题切换过渡 (保持不变) */
.theme-fade-enter-active,
.theme-fade-leave-active {
  transition: all 0.3s ease;
}

.theme-fade-enter-from,
.theme-fade-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* --- Specific style for light mode switch icon --- */
/* Final attempt: Use high specificity to directly set color/fill */
.dark-mode-switch:not(.is-checked) :deep(.el-switch__core .el-switch__inner .is-icon) {
  /* Ensure the container itself doesn't force a color */
  color: inherit !important; 
}

.dark-mode-switch:not(.is-checked) :deep(.el-switch__core .el-switch__inner .is-icon svg) {
  color: black !important; /* Force SVG color */
  fill: black !important;  /* Force SVG fill */
}

/* Keep the commented-out dark mode recovery rules */
/* 
.dark-mode-switch.is-checked { 
  // ... (recovery rules if needed) ...
}
*/

/* Ensure the switch action (the circle) has a smooth transition */
.dark-mode-switch :deep(.el-switch__action) {
  transition: transform 0.3s ease, left 0.3s ease !important; /* Adjust duration/easing if needed */
}

</style> 