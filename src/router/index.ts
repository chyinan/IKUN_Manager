import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/layout/index.vue'),
      redirect: '/index',
      children: [
        {
          path: 'index',
          name: 'index',
          component: () => import('../views/index/index.vue') //首页
        },
        {
          path: 'emp',
          name: 'emp',
          component: () => import('../views/emp/index.vue') //员工管理
        },
        {
          path: 'dept',
          name: 'dept',
          component: () => import('../views/dept/index.vue') //部门管理
        },
        {
          path: 'clazz',
          name: 'clazz',
          component: () => import('../views/clazz/index.vue') //班级管理
        },
        {
          path: 'stu',
          name: 'stu',
          component: () => import('../views/stu/index.vue') //学员管理
        },
        {
          path: 'empReport',
          name: 'empReport',
          component: () => import('../views/empReport/empReport.vue') //员工信息统计
        },
        {
          path: 'stuReport',
          name: 'stuReport',
          component: () => import('../views/stuReport/stuReport.vue') //学员信息统计
        },
        {
          path: 'log',
          name: 'log',
          component: () => import('../views/log/log.vue') //学员信息统计
        },
      ]
    }
  ]
})

export default router