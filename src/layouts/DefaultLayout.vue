<template>
  <div :class="['app-wrapper', { 'is-collapse': sidebarCollapse }]">
    <!-- 自定义标题栏（仅在Electron环境下非macOS系统显示） -->
    <template v-if="isElectron && !isMacOS">
      <div class="custom-titlebar">
        <div class="drag-region"></div>
        <div class="window-controls">
          <button class="control-button minimize" @click="minimizeWindow">
            <el-icon><Minus /></el-icon>
          </button>
          <button class="control-button maximize" @click="maximizeWindow">
            <el-icon><component :is="isMaximized ? CopyDocument : FullScreen" /></el-icon>
          </button>
          <button class="control-button close" @click="closeWindow">
            <el-icon><Close /></el-icon>
          </button>
        </div>
      </div>
    </template>

    <div class="main-wrapper">
      <!-- 侧边栏 -->
      <div :class="['sidebar-container', isDark ? 'dark' : '']">
        <!-- Logo -->
        <div class="logo-container">
          <img v-if="!sidebarCollapse" :src="logoSrc" alt="Logo" class="sidebar-logo" />
          <span v-if="!sidebarCollapse" class="sidebar-title">高校人事管理系统</span>
          <img v-else :src="logoSrc" alt="Logo" class="sidebar-logo-small" />
      </div>
      
        <!-- 菜单 -->
        <div class="sidebar-menu">
        <el-menu
          :default-active="activeMenu"
            :collapse="sidebarCollapse"
            :background-color="isDark ? '#1f2937' : ''"
            :text-color="isDark ? '#f3f4f6' : ''"
            :active-text-color="isDark ? '#409eff' : ''"
          :unique-opened="true"
          :collapse-transition="false"
            router
          >
            <template v-for="(menuRoute, index) in menuList" :key="index">
              <!-- 无子菜单 -->
              <el-menu-item v-if="!menuRoute.children" :index="ensureAbsolutePath(menuRoute.path)">
                <el-icon v-if="menuRoute.meta && menuRoute.meta.icon">
                  <component :is="menuRoute.meta.icon" />
                </el-icon>
                <template #title>{{ getTitle(menuRoute) }}</template>
              </el-menu-item>
              
              <!-- 有子菜单 -->
              <el-sub-menu v-else :index="ensureAbsolutePath(menuRoute.path)">
                <template #title>
                  <el-icon v-if="menuRoute.meta && menuRoute.meta.icon">
                    <component :is="menuRoute.meta.icon" />
          </el-icon>
                  <span>{{ getTitle(menuRoute) }}</span>
                </template>
                
                <el-menu-item
                  v-for="child in menuRoute.children"
                  :key="child.path"
                  :index="ensureAbsolutePath(menuRoute.path) + '/' + child.path.replace(/^\/?/, '')"
                  @click="logNavigationPath(ensureAbsolutePath(menuRoute.path) + '/' + child.path.replace(/^\/?/, ''), child)"
                >
                  <el-icon v-if="child.meta && child.meta.icon">
                    <component :is="child.meta.icon" />
                  </el-icon>
                  <template #title>{{ getTitle(child) }}</template>
                </el-menu-item>
              </el-sub-menu>
            </template>
          </el-menu>
        </div>
      </div>
      
      <!-- 主内容区 -->
      <div class="main-container">
        <navbar
          :is-dark="isDark"
          :toggle-dark="toggleDark"
          :sidebar-collapse="sidebarCollapse" 
          @update:sidebar-collapse="sidebarCollapse = $event"
        />
        <app-main />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, provide, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'
import type { IElectronAPI } from '@/preload.d'; // Import IElectronAPI
import { 
  Expand, 
  Fold, 
  User, 
  SwitchButton, 
  CaretBottom,
  Moon,
  Sunny,
  // Import window control icons
  Minus,
  FullScreen,
  CopyDocument,
  Close
} from '@element-plus/icons-vue'
import Navbar from '@/components/Navbar.vue'
import AppMain from '@/components/AppMain.vue'
import defaultLogo from '@/assets/logo.png' 
import favicon from '/favicon.png' // Import from public

// 路由
const route = useRoute()
const router = useRouter()

// Pinia Stores
const userStore = useUserStore()
const appStore = useAppStore()

// 侧边栏折叠状态
const sidebarCollapse = ref(false)

// --- Robust Dark Mode Control ---
const isDark = ref(appStore.isDarkMode); // Initialize from store

const toggleDark = (value?: boolean) => {
  // Determine the new state. If a boolean is passed, use it. Otherwise, toggle.
  const newState = typeof value === 'boolean' ? value : !isDark.value;
  
  // Update the local ref
  isDark.value = newState;
  
  // Update the class on the <html> element
  if (newState) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  
  // Update the app store
  appStore.toggleDarkMode(newState);

  console.log(`[DefaultLayout] Dark mode toggled. New state: ${newState}`);
};

// Watch for changes from other sources (like browser/system preference if useDark was used)
// This is a simplified example; a full implementation might watch for storage changes.
// For now, we primarily control it via our toggle.

// Electron相关
const isElectron = ref(!!window.electronAPI)
const isMacOS = ref(false)
const isMaximized = ref(false)

// Move listener cleanup function declaration to the setup scope
let removeWindowStateListener: (() => void) | null = null;

// Window control functions (Use assertion here too)
const minimizeWindow = () => {
  const electronAPI = window.electronAPI as IElectronAPI | undefined;
  if (electronAPI) {
    electronAPI.minimizeWindow()
  }
}

const maximizeWindow = () => {
  const electronAPI = window.electronAPI as IElectronAPI | undefined;
  if (electronAPI) {
    electronAPI.maximizeWindow()
  }
}

const closeWindow = () => {
  const electronAPI = window.electronAPI as IElectronAPI | undefined;
  if (electronAPI) {
    electronAPI.closeWindow()
  }
}

const ensureAbsolutePath = (pathStr: string): string => {
  if (!pathStr) return '/'; 
  // 移除所有可能存在的前导斜杠，然后确保以单个斜杠开头
  const cleanedPath = pathStr.replace(/^\/+/, '');
  return `/${cleanedPath}`;
};

const logNavigationPath = (path: string, childRoute: any) => {
  console.log(`[DefaultLayout Menu Click] Index for el-menu-item: '${path}'`, JSON.parse(JSON.stringify(childRoute)));
  // console.log(`[DefaultLayout Menu Click] Vue Router will attempt to push: router.push('${path}')`);
};

onMounted(() => {
  // On mount, ensure the class list and local state match the store's state.
  isDark.value = appStore.isDarkMode;
  if (isDark.value) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  console.log(`[DefaultLayout onMounted] Initialized dark mode state from store: ${isDark.value}`);

  // --- Electron Initialization Logic --- 
  const electronAPI = window.electronAPI as IElectronAPI | undefined;
  if (isElectron.value && electronAPI && typeof electronAPI.onWindowStateChange === 'function') {
    console.log('[DefaultLayout Combined onMounted] Setting up Electron listeners...');
    // Assign to the variable declared in the outer scope
    removeWindowStateListener = electronAPI.onWindowStateChange((maximized: boolean) => {
      console.log('[Vue DefaultLayout] Received window state change:', maximized);
      isMaximized.value = maximized;
    });
    
    // Check initial maximized state (if needed, must be implemented in main/preload)
    // For now, we rely on the event listener

    // Also, need to get platform info if required for logic (e.g., hiding controls)
    // Example: Assume main process sends platform info on request or startup
    // ipcRenderer.invoke('get-platform').then(platform => { isDarwin.value = platform === 'darwin'; });
  } else {
      console.log('[DefaultLayout Combined onMounted] Not in Electron or API not available.');
  }
  console.log('[DefaultLayout Combined onMounted] END');
});

onBeforeUnmount(() => {
  // Now this can access removeWindowStateListener
  if (removeWindowStateListener) {
    removeWindowStateListener();
    console.log('[Vue DefaultLayout] Removed window state listener.');
  }
});

// 提供给子组件的共享状态
provide('isDark', isDark)
provide('toggleDark', toggleDark)
provide('sidebarCollapse', sidebarCollapse)
provide('isElectron', isElectron)
provide('isMaximized', isMaximized)
provide('isMacOS', isMacOS)

// routes computed property (remains the same)
const routes = computed(() => {
  const allRoutes = router.options.routes.find(route => route.path === '/')?.children || [];
  const isAdmin = userStore.username === 'admin'; // 直接检查用户名
  console.log('Filtering routes, isAdmin:', isAdmin);
  
  return allRoutes.filter(r => {
    // 如果路由没有meta或标记为hidden，则不显示
    if (!r.meta || r.meta.hidden) return false; 

    // 检查是否需要 admin 权限 (通用逻辑)
    if (r.meta.requiresAdmin) {
      return isAdmin;
    } else {
      // 不需要 admin 权限的路由都显示
      return true;
    }
  });
})

// activeMenu computed property (remains the same)
const activeMenu = computed(() => {
  const { meta, path } = route
  if (meta.activeMenu) {
    return meta.activeMenu
  }
  return path
})

// handleCommand (remains the same)
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

// 处理菜单数据
const menuList = computed(() => {
  // 过滤掉不需要显示在菜单中的路由
  return routes.value.filter(route => {
    return route.meta && !route.meta.hidden
  })
})

// Logo path based on sidebar state
const logoSrc = computed(() => (sidebarCollapse.value ? favicon : defaultLogo))

// Helper for template optional chaining
const getTitle = (item: any) => item?.meta?.title ?? '';
</script>

<style lang="scss" scoped>
.app-wrapper {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .main-wrapper {
    display: flex;
    flex: 1;
    height: 100%;
    width: 100%;
    overflow: hidden;
  }
}

.sidebar-container {
  width: 220px;
  height: 100%;
  transition: width 0.3s;
  overflow: hidden;
  background-color: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;

  &.dark {
    background-color: #1f2937;
    border-right: 1px solid #374151;
  }
}

.logo-container {
  height: 60px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--el-border-color-light);

  .sidebar-logo {
    height: 32px;
    margin-right: 12px;
    vertical-align: middle;
  }

  .sidebar-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    white-space: nowrap;
    vertical-align: middle;
  }

  .sidebar-logo-small {
    height: 32px;
  width: 32px;
  }

  .dark & {
    border-bottom: 1px solid #374151;
    .sidebar-title {
       color: #f3f4f6;
    }
  }
}

.sidebar-menu {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  /* 修改 Element Plus 菜单样式 */
  :deep(.el-menu) {
  border-right: none;
    width: 100%;
  }

  :deep(.el-menu-item), :deep(.el-sub-menu__title) {
    height: 50px;
    line-height: 50px;
  }

  :deep(.el-menu-item .el-icon), :deep(.el-sub-menu__title .el-icon) {
    margin-right: 10px;
  }
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--el-bg-color-page);
}

.is-collapse {
  .sidebar-container {
    width: 64px;
  }
}

// 自定义标题栏样式
.custom-titlebar {
  height: 30px;
  background-color: var(--el-bg-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  -webkit-app-region: drag;
  z-index: 9999;

  .drag-region {
    flex: 1;
    height: 100%;
  }

  .window-controls {
  display: flex;
    -webkit-app-region: no-drag;
}

  .control-button {
    width: 46px;
    height: 30px;
  display: flex;
    justify-content: center;
  align-items: center;
    background: transparent;
    border: none;
  cursor: pointer;
    
    &:hover {
      background-color: rgba(0, 0, 0, 0.1);
    }
    
    &.close:hover {
      background-color: #e81123;
      color: white;
    }
  }
}

.dark .custom-titlebar {
  background-color: #1f2937;
}
</style> 