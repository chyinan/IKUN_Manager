<template>
  <div :class="['app-wrapper', { 'is-collapse': sidebarCollapse }]">
    <!-- 自定义标题栏（仅在Electron环境下非macOS系统显示） -->
    <template v-if="isElectron && !isMacOS">
      <div class="custom-titlebar">
        <div class="drag-region"></div>
        <div class="window-controls">
          <button class="control-button minimize" @click="minimizeWindow">
            <i class="el-icon-minus"></i>
          </button>
          <button class="control-button maximize" @click="maximizeWindow">
            <i :class="isMaximized ? 'el-icon-copy-document' : 'el-icon-full-screen'"></i>
          </button>
          <button class="control-button close" @click="closeWindow">
            <i class="el-icon-close"></i>
          </button>
        </div>
      </div>
    </template>

    <div class="main-wrapper">
      <!-- 侧边栏 -->
      <div :class="['sidebar-container', isDark ? 'dark' : '']">
        <!-- Logo -->
        <div class="logo-container">
          <img v-if="!sidebarCollapse" src="/logo.png" alt="Logo" class="sidebar-logo" />
          <span v-if="!sidebarCollapse" class="sidebar-title">高校人事管理系统</span>
          <img v-else src="/favicon.ico" alt="Logo" class="sidebar-logo-small" />
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
            <template v-for="(route, index) in menuList" :key="index">
              <!-- 无子菜单 -->
              <el-menu-item v-if="!route.children" :index="route.path">
                <el-icon v-if="route.meta && route.meta.icon">
                  <component :is="route.meta.icon" />
                </el-icon>
                <template #title>{{ route.meta.title }}</template>
              </el-menu-item>
              
              <!-- 有子菜单 -->
              <el-sub-menu v-else :index="route.path">
                <template #title>
                  <el-icon v-if="route.meta && route.meta.icon">
                    <component :is="route.meta.icon" />
                  </el-icon>
                  <span>{{ route.meta.title }}</span>
                </template>
                
                <el-menu-item
                  v-for="child in route.children"
                  :key="child.path"
                  :index="route.path + '/' + child.path"
                >
                  <el-icon v-if="child.meta && child.meta.icon">
                    <component :is="child.meta.icon" />
                  </el-icon>
                  <template #title>{{ child.meta.title }}</template>
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
import { computed, ref, onMounted, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useDark } from '@vueuse/core'
import { 
  Expand, 
  Fold, 
  User, 
  SwitchButton, 
  CaretBottom,
  Moon,
  Sunny
} from '@element-plus/icons-vue'
import Navbar from '@/components/Navbar.vue'
import AppMain from '@/components/AppMain.vue'
import defaultLogo from '@/assets/logo.png' 
import favicon from '/favicon.png' // Import from public

// 路由
const route = useRoute()
const router = useRouter()

// 用户存储
const userStore = useUserStore()

// 侧边栏折叠状态
const sidebarCollapse = ref(false)

// *** Local Dark Mode Implementation with localStorage ***
const STORAGE_KEY = 'theme-preference' // Key for localStorage

// Initialize isDark: Try reading from localStorage, default to false (light)
const initializeIsDark = () => {
  const storedPreference = localStorage.getItem(STORAGE_KEY);
  // Check for 'dark', consider null/other values as light
  return storedPreference === 'dark'; 
}

const isDark = useDark()

const toggleDark = () => {
  isDark.value = !isDark.value;
  const newPreference = isDark.value ? 'dark' : 'light';
  console.log(`[DefaultLayout Local Toggle] Toggled local isDark to: ${isDark.value}, saving preference: ${newPreference}`);
  
  // Update HTML class
  if (isDark.value) {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }
  
  // Save preference to localStorage
  try {
    localStorage.setItem(STORAGE_KEY, newPreference);
  } catch (e) {
    console.error('Failed to save theme preference to localStorage:', e);
  }
};
console.log('[DefaultLayout Top Level] Initial Local isDark:', isDark.value);
console.log('[DefaultLayout Top Level] typeof local toggleDark:', typeof toggleDark);
// *** End Local Implementation ***

// Electron相关
const isElectron = ref(!!window.electronAPI)
const isMacOS = ref(false)
const isMaximized = ref(false)

// 窗口控制函数
const minimizeWindow = () => {
  if (window.electronAPI) {
    window.electronAPI.minimizeWindow()
  }
}

const maximizeWindow = () => {
  if (window.electronAPI) {
    window.electronAPI.maximizeWindow()
  }
}

const closeWindow = () => {
  if (window.electronAPI) {
    window.electronAPI.closeWindow()
  }
}

onMounted(() => {
  console.log('[DefaultLayout Combined onMounted] START');
  // Log local values
  console.log('[DefaultLayout Combined onMounted] Local isDark value:', isDark.value); 
  console.log('[DefaultLayout Combined onMounted] typeof local toggleDark:', typeof toggleDark);

  // Apply initial theme based on the already initialized local ref
  // The class should already match the initialized isDark state
  console.log('[DefaultLayout Combined onMounted] Initial theme class should match isDark state.');
  // Optional: Force re-apply class for robustness, though initializeIsDark should handle it.
  if (isDark.value) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
  } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
  }

  // --- Electron Initialization Logic --- 
  if (isElectron.value && window.electronAPI) {
    console.log('[DefaultLayout Combined onMounted] Setting up Electron listeners...');
    // Detect OS
    window.electronAPI.getPlatform().then((platform: string) => {
      isMacOS.value = platform === 'darwin'
    });
    // Detect initial window state
    window.electronAPI.isMaximized().then((maximized: boolean) => {
      isMaximized.value = maximized
    });
    // Listen for maximize changes
    window.electronAPI.onMaximizeChange((maximized: boolean) => {
      isMaximized.value = maximized
    });
    // Listen for window state changes (for AppMain height adjustment in Electron)
    window.electronAPI.onWindowStateChange?.((_, maximized) => { // Optional chaining for safety
        isMaximized.value = maximized // Reuse existing isMaximized state if needed elsewhere
    });
    // Initial get window state (redundant if onWindowStateChange works reliably)
    // window.electronAPI.getWindowState?.().then(state => {
    //   isMaximized.value = state.maximized;
    // }).catch(err => {
    //   console.error('获取窗口状态失败:', err);
    // });
  } else {
      console.log('[DefaultLayout Combined onMounted] Not in Electron or API not available.');
  }
  console.log('[DefaultLayout Combined onMounted] END');
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