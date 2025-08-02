<template>
  <section class="app-main" :style="appMainStyle">
    <router-view v-slot="{ Component }">
      <transition name="fade-transform" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </section>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue'

// Inject state provided in DefaultLayout.vue
const isElectron = inject<boolean>('isElectron', false)
const isMacOS = inject<boolean>('isMacOS', false) // Assuming isMacOS is also provided

// Dynamically calculate the height based on Electron state
const appMainStyle = computed(() => {
  let heightOffset = 50 // Default offset for Navbar
  if (isElectron && !isMacOS) {
    heightOffset += 30 // Add offset for custom title bar
  }
  return {
    height: `calc(100vh - ${heightOffset}px)`
  }
})

// AppMain组件 - 显示当前路由对应的组件
</script>

<style scoped>
.app-main {
  position: relative;
  overflow: hidden;
  padding: 20px;
  /* height is now set dynamically via :style */
  width: 100%;
  overflow-y: auto;
  box-sizing: border-box;
  background-color: var(--el-bg-color-page); /* Ensure background color matches */
}

/* Keep transitions */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style> 