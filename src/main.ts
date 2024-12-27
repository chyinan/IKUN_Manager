import { createApp } from 'vue'
import { createPinia } from 'pinia'

//导入
import App from './App.vue'
import router from './router'
import './assets/main.css'

//导入ElementPlus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

//创建vue的应用实例
const app = createApp(App)

//注册ElementPlus的Icon组件
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

//应用pinia router elementPlus
app.use(createPinia())
app.use(router)
app.use(ElementPlus, {locale: zhCn})

app.mount('#app')
