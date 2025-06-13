import { createApp } from 'vue'
import { createPinia } from 'pinia'

// 导入根组件和路由
import App from './App.vue'
import router from './router'
import './assets/main.css'

// 导入Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import '@/styles/dark-overrides.css'
// Temporarily remove locale import entirely
// import zhCn from 'element-plus/lib/locale/lang/zh-cn'; 
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 导入 Store
import { useConfigStore } from '@/stores/config'; // 导入 Config Store

// 全局错误处理
window.addEventListener('error', (event) => {
  console.error('全局错误:', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的Promise拒绝:', event.reason)
})

// 创建Vue应用实例
const app = createApp(App)

// 注册所有Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 使用插件
const pinia = createPinia(); // 创建 Pinia 实例
app.use(pinia) // 先使用 Pinia
app.use(router)
// Use ElementPlus without locale configuration
app.use(ElementPlus)

// 全局错误处理
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue错误:', err)
  console.error('错误信息:', info)
}

// 在挂载前加载配置 (确保 Pinia 已初始化)
const configStore = useConfigStore();
configStore.fetchAndSetConfig().then(() => {
  // 配置加载完成后再挂载应用
  app.mount('#app');
}).catch(error => {
  console.error("应用初始化时加载配置失败:", error);
  // 即使配置加载失败，也尝试挂载应用
  app.mount('#app'); 
});
