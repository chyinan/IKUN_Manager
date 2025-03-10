<template>
    <el-breadcrumb class="app-breadcrumb" separator="/">
      <transition-group name="breadcrumb">
        <el-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="item.path">
          <span v-if="index === breadcrumbs.length - 1 || !item.redirect" class="no-redirect">
            {{ item.meta.title }}
          </span>
          <a v-else @click.prevent="handleLink(item)">{{ item.meta.title }}</a>
        </el-breadcrumb-item>
      </transition-group>
    </el-breadcrumb>
  </template>
  
  <script setup lang="ts">
  import { ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import type { RouteLocationNormalizedLoaded } from 'vue-router'
  
  // 路由
  const route = useRoute()
  const router = useRouter()
  
  // 面包屑数据
  const breadcrumbs = ref<any[]>([])
  
  // 获取面包屑
  const getBreadcrumbs = () => {
    // 过滤掉没有meta.title的路由
    const matched = route.matched.filter(item => item.meta && item.meta.title)
    
    // 如果第一个不是首页，则添加首页
    const first = matched[0]
    if (first && first.path !== '/dashboard') {
      matched.unshift({
        path: '/dashboard',
        meta: { title: '首页' },
        redirect: undefined
      })
    }
    
    breadcrumbs.value = matched
  }
  
  // 处理链接点击
  const handleLink = (item: any) => {
    const { redirect, path } = item
    if (redirect) {
      router.push(redirect.toString())
      return
    }
    router.push(path)
  }
  
  // 监听路由变化
  watch(
    () => route.path,
    () => {
      getBreadcrumbs()
    },
    { immediate: true }
  )
  </script>
  
  <style scoped>
  .app-breadcrumb {
    display: inline-block;
    font-size: 14px;
    line-height: 60px;
  }
  
  .app-breadcrumb .no-redirect {
    color: #97a8be;
    cursor: text;
  }
  
  /* 过渡动画 */
  .breadcrumb-enter-active,
  .breadcrumb-leave-active {
    transition: all 0.5s;
  }
  
  .breadcrumb-enter-from,
  .breadcrumb-leave-to {
    opacity: 0;
    transform: translateX(20px);
  }
  
  .breadcrumb-leave-active {
    position: absolute;
  }
  </style>