// 导入必要的 Vue Composition API 功能
import { ref, computed } from 'vue'
// 导入 Pinia 状态管理的核心函数
import { defineStore } from 'pinia'

// 定义并导出计数器状态管理store
export const useCounterStore = defineStore('counter', () => {
  // 定义响应式的计数状态
  const count = ref(0)
  
  // 计算属性：返回计数值的两倍
  const doubleCount = computed(() => count.value * 2)
  
  // 增加计数的方法
  function increment() {
    count.value++
  }

  // 返回状态和方法供组件使用
  return { count, doubleCount, increment }
})
