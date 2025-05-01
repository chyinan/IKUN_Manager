<template>
  <div :class="['navbar', isDark ? 'dark' : '']">
    <!-- 折叠按钮 -->
    <div class="hamburger-container" @click="toggleSidebar">
      <el-icon :size="20">
        <component :is="sidebarCollapse ? 'Expand' : 'Fold'" />
      </el-icon>
    </div>

    <!-- 面包屑导航 -->
    <breadcrumb class="breadcrumb-container" />

    <div class="right-menu">
      <!-- 暗黑模式切换 -->
      <div class="right-menu-item theme-switch">
        <el-switch
          :model-value="isDark"
          inline-prompt
          :active-icon="Moon"
          :inactive-icon="Sunny"
          @change="handleThemeChange"
          size="large"
          style="--el-switch-on-color: #2c2c2c; --el-switch-off-color: #f2f2f2;"
        />
      </div>

      <!-- 用户信息下拉菜单 -->
      <el-dropdown class="avatar-container right-menu-item" trigger="click" @command="handleCommand">
        <div class="avatar-wrapper">
          <el-avatar :size="30" :src="userStore.avatar || '/avatar.png'" />
          <span class="username">{{ userStore.username }}</span>
          <el-icon class="el-icon-caret-bottom">
            <CaretBottom />
          </el-icon>
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
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { 
  Expand, 
  Fold, 
  User, 
  SwitchButton, 
  CaretBottom,
  Moon,
  Sunny
} from '@element-plus/icons-vue'
import Breadcrumb from '@/components/Breadcrumb.vue'

const router = useRouter()
const userStore = useUserStore()

// 定义组件的props
const props = defineProps({
  isDark: {
    type: Boolean,
    default: false
  },
  toggleDark: {
    type: Function,
    required: true
  },
  sidebarCollapse: {
    type: Boolean,
    default: false
  }
})

// 定义emit
const emit = defineEmits(['update:sidebarCollapse'])

// 折叠侧边栏方法
const toggleSidebar = () => {
  emit('update:sidebarCollapse', !props.sidebarCollapse)
}

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
    }).catch(() => {
      // 取消操作
    })
  }
}

// Handle theme change triggered by the switch
const handleThemeChange = (value: boolean | string | number) => {
  // Add type check and error logging for debugging
  if (typeof props.toggleDark === 'function') {
    props.toggleDark(); 
  } else {
    console.error('Navbar: props.toggleDark is not a function!', props.toggleDark);
  }
}
</script>

<style lang="scss" scoped>
.navbar {
  height: 50px;
  overflow: hidden;
  position: relative;
  background-color: var(--el-bg-color);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.07);
  display: flex;
  align-items: center;
  padding: 0 10px;

  &.dark {
    background-color: #1f2937;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  }
}

.hamburger-container {
  height: 100%;
  padding: 0 15px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: background 0.3s;
  margin-right: 10px;

  &:hover {
    background: rgba(0, 0, 0, 0.025);
  }

  .dark & {
    color: #f3f4f6;
    
    &:hover {
      background: rgba(255, 255, 255, 0.05);
    }
  }
}

.breadcrumb-container {
  flex-grow: 1;
}

.right-menu {
  height: 100%;
  display: flex;
  align-items: center;
  margin-left: auto;
  
  .right-menu-item {
    padding: 0 12px;
    height: 100%;
    display: flex;
    align-items: center;
    font-size: 18px;
    color: var(--el-text-color-regular);
    cursor: pointer;
    transition: background 0.3s;
    
    &:hover {
      background: rgba(0, 0, 0, 0.025);
    }
    
    .dark & {
      color: #f3f4f6;
      
      &:hover {
        background: rgba(255, 255, 255, 0.05);
      }
    }
  }
  
  .avatar-container {
    .avatar-wrapper {
      display: flex;
      align-items: center;
      
      .username {
        margin: 0 5px 0 8px;
        font-size: 14px;
      }
      
      .dark & {
        color: #f3f4f6;
      }
    }
  }

  .theme-switch {
    padding: 0 10px; 
    display: flex;
    align-items: center;

    :deep(.el-switch__core .el-switch__action .is-icon) {
       color: #606266;
    }
    :deep(.el-switch__core .el-switch__action .is-icon svg) {
        height: 14px;
        width: 14px;
    }
    
    :deep(.el-switch__core) {
        min-width: 45px;
        height: 24px;
        border-radius: 12px;
    }
    :deep(.el-switch__action) {
        width: 18px;
        height: 18px;
        top: 2px;
        left: 2px;
    }
     :deep(.el-switch.is-checked .el-switch__action) {
         left: calc(100% - 20px);
     }
  }
}
</style> 