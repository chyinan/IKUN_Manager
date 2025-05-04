/// <reference types="vite/client" />

// Remove the Element Plus locale declaration from here
// declare module 'element-plus/dist/locale/zh-cn.mjs';

// Import the interface definition
import type { IElectronAPI } from '@/preload.d';

// Keep the Window interface extension
declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}