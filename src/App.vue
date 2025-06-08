<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue' // Import computed
import { useAppStore } from '@/stores/app'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import { logger } from '@/utils/logger'; // Correct import name: logger (lowercase)
import type { BackendLogEntry, IElectronAPI } from '@/preload.d'; // Import IElectronAPI too

// --- Stagewise Toolbar Integration ---
import { StagewiseToolbar } from '@stagewise/toolbar-vue';

const isDev = computed(() => import.meta.env.DEV);
const stagewiseConfig = {
  plugins: []
};
// --- End Stagewise Toolbar Integration ---

const appStore = useAppStore()
// ... existing script ...
const locale = ref(zhCn)
const logs = ref<string[]>([]) // Array to store log messages for display
const showTerminal = ref(false) // Control terminal visibility

let removeBackendLogListener: (() => void) | null = null;

// Setup listener for backend logs if in Electron
onMounted(() => {
  // Use type assertion for window.electronAPI
  const electronAPI = window.electronAPI as IElectronAPI | undefined;
  if (import.meta.env.MODE === 'electron' && electronAPI && typeof electronAPI.onBackendLog === 'function') {
    console.log('[App.vue] Setting up backend log listener...');
    removeBackendLogListener = electronAPI.onBackendLog((logEntry: BackendLogEntry) => {
      const formattedMessage = `[${logEntry.type || 'LOG'}] ${logEntry.message}`;
      console.log('[App.vue] Received Backend Log:', formattedMessage);
      logger.system(formattedMessage); // Use logger.system instead of logger.frontend
      logs.value.push(formattedMessage);
      if (logs.value.length > 100) {
        logs.value.shift();
      }
    });
  } else {
    console.log('[App.vue] Not in Electron or electronAPI.onBackendLog not available, skipping listener.');
  }
});

// Cleanup listener on component unmount
onBeforeUnmount(() => {
  if (removeBackendLogListener) {
    console.log('[App.vue] Removing backend log listener.');
    removeBackendLogListener();
  }
});

</script>

<template>
  <StagewiseToolbar v-if="isDev" :config="stagewiseConfig" />
  <el-config-provider :locale="locale">
    <router-view v-slot="{ Component }">
      <transition name="page-slide-fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>

    <!-- Simple Terminal Overlay (Optional) -->
    <div v-if="showTerminal" class="terminal-overlay">
      <button @click="showTerminal = false">Close</button>
      <pre>{{ logs.join('\n') }}</pre>
    </div>
    <!-- Button to toggle terminal (Optional) -->
    <!-- <button @click="showTerminal = !showTerminal" class="toggle-terminal">Toggle Logs</button> -->

  </el-config-provider>
</template>

<style scoped>
/* Transition Styles */
.page-slide-fade-enter-active {
  animation: slideInRight 0.3s ease-in-out; /* Uses global @keyframes slideInRight from main.css */
}

.page-slide-fade-leave-active {
  transition: opacity 0.3s ease;
}

.page-slide-fade-leave-to {
  opacity: 0;
}

/* Add styles for terminal overlay if used */
.terminal-overlay {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 200px;
  background-color: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 10px;
  overflow-y: auto;
  font-family: monospace;
  z-index: 9999;
}
.terminal-overlay button {
  position: absolute;
  top: 5px;
  right: 5px;
  background: #555;
  border: none;
  color: white;
  cursor: pointer;
}
.toggle-terminal {
  position: fixed;
  bottom: 10px;
  right: 10px;
  z-index: 10000;
}
</style>