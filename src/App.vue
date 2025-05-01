<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

let cleanupBackendLogListener: (() => void) | null = null;

onMounted(() => {
  // Check if the Electron API is available (i.e., running in Electron)
  if (window.electronAPI && typeof window.electronAPI.onBackendLog === 'function') {
    console.log('[App.vue] Setting up backend log listener...');
    cleanupBackendLogListener = window.electronAPI.onBackendLog((logEntry: { type: string; message: string }) => {
      // Simply log the received message to the renderer console
      // You could also store these logs in a Vuex store or display them in a UI component
      if (logEntry.type === 'stderr') {
        console.error(`[Backend Log - STDERR]: ${logEntry.message.trim()}`);
      } else {
        console.log(`[Backend Log - STDOUT]: ${logEntry.message.trim()}`);
      }
    });
  } else {
    console.warn('[App.vue] Electron API for backend logs not found. Logs will not be forwarded to renderer console.');
  }
});

onUnmounted(() => {
  // Clean up the listener when the App component is unmounted
  if (cleanupBackendLogListener) {
    console.log('[App.vue] Cleaning up backend log listener...');
    cleanupBackendLogListener();
  }
});

</script>

<template>
  <router-view />
</template>

<style>
/* 全局样式可以在这里添加，但主要样式已经在main.css中定义 */
</style>