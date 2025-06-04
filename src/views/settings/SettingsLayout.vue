<template>
  <div class="settings-layout-container">
    <!-- 
      将来这里可以放置 Settings 模块共享的导航，例如 Tabs 或侧边栏菜单 
      目前直接使用 router-view 来展示子页面 (ValidationRules.vue, CarouselManagement.vue)
    -->
    <router-view v-slot="{ Component }">
      <component :is="Component" />
    </router-view>
  </div>
</template>

<script lang="ts" setup>
// 此布局组件目前不需要特定的脚本逻辑
// 如果将来需要在所有设置页面共享数据或方法，可以在这里添加
</script>

<style lang="scss" scoped>
.settings-layout-container {
  // 与 app-container 或其他页面容器保持一致的内边距
  padding: 20px; 
  background-color: var(--el-bg-color-page);
  // 确保内容区域至少填满视口高度减去可能的头部和导航栏高度
  min-height: calc(100vh - 50px - 34px); // 假设顶部导航50px, tagsView 34px (根据您的 DefaultLayout 调整)
}

/* 
// 过渡动画 (如果您的项目中没有全局定义 fade-transform)
// 您可以从 App.vue 或其他地方复制代码或自定义
.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all .5s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
*/
</style> 