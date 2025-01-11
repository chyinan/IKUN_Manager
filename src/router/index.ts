import { createRouter, createWebHistory } from 'vue-router'

// 创建路由实例
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/login/login.vue')
    },
    {
      path: '/',
      redirect: '/login'  // 重定向到登录页
    },
    {
      path: '/home',
      name: 'home',
      component: () => import('../views/layout/index.vue'),
      redirect: '/index',
      meta: { requiresAuth: true },  // 添加需要认证标记
      children: [
        {
          path: '/index',
          name: 'index',
          component: () => import('../views/index/index.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: '/emp',
          name: 'emp',
          component: () => import('../views/emp/index.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: '/dept',
          name: 'dept',
          component: () => import('../views/dept/index.vue') //部门管理
        },
        {
          path: '/clazz',
          name: 'clazz',
          component: () => import('../views/clazz/index.vue') //班级管理
        },
        {
          path: '/stu',
          name: 'stu',
          component: () => import('../views/stu/index.vue') //学员管理
        },
        {
          path: '/empReport',
          name: 'empReport',
          component: () => import('../views/empReport/empReport.vue') //员工信息统计
        },
        {
          path: '/stuReport',
          name: 'stuReport',
          component: () => import('../views/stuReport/stuReport.vue') //学员信息统计
        },
        {
          path: '/log',
          name: 'log',
          component: () => import('../views/log/log.vue') //学员信息统计
        },
      ]
    }
  ]
})

// // 添加全局路由守卫
// router.beforeEach((to, from, next) => {
//   const token = localStorage.getItem('token')
  
//   if (to.path === '/login') {
//     if (token) {
//       next('/home')  // 已登录则跳转到首页
//     } else {
//       next()
//     }
//   } else if (to.matched.some(record => record.meta.requiresAuth)) {
//     // 验证需要登录的页面
//     if (!token) {
//       next({
//         path: '/login',
//         query: { redirect: to.fullPath }
//       })
//     } else {
//       next()
//     }
//   } else {
//     next()
//   }
// })
// 修改路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  
  if (to.path === '/login') {
    if (token) {
      next('/home')
    } else {
      next()
    }
  } else {
    if (token) {
      next()
    } else {
      next('/login')
    }
  }
})

export default router