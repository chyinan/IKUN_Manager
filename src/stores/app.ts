// src/stores/app.ts
import { defineStore } from 'pinia'

interface SidebarState {
  opened: boolean;
  withoutAnimation: boolean;
}

interface AppState {
  sidebar: SidebarState;
  device: 'desktop' | 'mobile';
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    sidebar: {
      opened: true, // Default sidebar state
      withoutAnimation: false
    },
    device: 'desktop' // Default device type
  }),
  actions: {
    toggleSideBar() {
      this.sidebar.opened = !this.sidebar.opened
      this.sidebar.withoutAnimation = false
    },
    closeSideBar(payload: { withoutAnimation: boolean }) {
      this.sidebar.opened = false
      this.sidebar.withoutAnimation = payload.withoutAnimation
    },
    toggleDevice(device: 'desktop' | 'mobile') {
      this.device = device
    },
    setSidebarOpened(opened: boolean) {
        this.sidebar.opened = opened;
    }
  }
}) 