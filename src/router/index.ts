import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

// 导入视图组件
import Dashboard from '@/views/dashboard/index.vue'
import Department from '@/views/dept/index.vue'
import Employee from '@/views/emp/index.vue'
import EmployeeReport from '@/views/empReport/empReport.vue'
import Class from '@/views/clazz/index.vue'
import Student from '@/views/stu/index.vue'
import StuReport from '@/views/stuReport/stuReport.vue'
import Score from '@/views/score/index.vue'
import Exam from '@/views/exam/index.vue'
import Log from '@/views/log/log.vue'
import Profile from '@/views/profile/index.vue'
import Settings from '@/views/settings/index.vue'
import Login from '@/views/login/index.vue'
import NotFound from '@/views/error/404.vue'

// 路由配置
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: DefaultLayout,
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: Dashboard,
          meta: { title: '首页', icon: 'House' }
        },
        {
          path: 'employee',
          name: 'Employee',
          component: Employee,
          meta: { title: '员工管理', icon: 'User' }
        },
        {
          path: 'dept',
          name: 'Department',
          component: Department,
          meta: { title: '部门管理', icon: 'OfficeBuilding' }
        },
        {
          path: 'emp-report',
          name: 'EmployeeReport',
          component: EmployeeReport,
          meta: { title: '员工信息统计', icon: 'PieChart' }
        },
        {
          path: 'class',
          name: 'Class',
          component: Class,
          meta: { title: '班级管理', icon: 'School' }
        },
        {
          path: 'student',
          name: 'Student',
          component: Student,
          meta: { title: '学生管理', icon: 'User' }
        },
        {
          path: 'stu-report',
          name: 'StuReport',
          component: StuReport,
          meta: { title: '学生信息统计', icon: 'PieChart' }
        },
        {
          path: 'score',
          name: 'Score',
          component: Score,
          meta: { title: '成绩管理', icon: 'DocumentChecked' }
        },
        {
          path: 'exam',
          name: 'Exam',
          component: Exam,
          meta: { title: '考试管理', icon: 'Calendar' }
        },
        {
          path: 'log',
          name: 'Log',
          component: Log,
          meta: { title: '系统日志', icon: 'List', requiresAdmin: true }
        },
        {
          path: 'settings',
          name: 'Settings',
          component: Settings,
          meta: { title: '系统设置', icon: 'Setting', requiresAdmin: true }
        },
        {
          path: 'profile',
          name: 'Profile',
          component: Profile,
          meta: { title: '个人中心', icon: 'UserFilled', hidden: true }
        }
      ]
    },
    {
      path: '/login',
      name: 'Login',
      component: Login,
      meta: { title: '登录', hidden: true }
    },
    {
      path: '/404',
      name: 'NotFound',
      component: NotFound,
      meta: { title: '404', hidden: true }
    },
    {
      path: '/index',
      redirect: '/dashboard',
      meta: { hidden: true }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/404',
      meta: { hidden: true }
    }
  ]
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  document.title = `${to.meta.title ? to.meta.title + ' - ' : ''}IKUN管理系统`
  
  // 获取用户信息
  const userStore = useUserStore()
  const token = userStore.token
  
  // 如果是登录页，直接放行
  if (to.path === '/login') {
    if (token) {
      next('/')
    } else {
      next()
    }
    return
  }
  
  // 如果没有token，重定向到登录页
  if (!token) {
    ElMessage.warning('请先登录')
    next(`/login?redirect=${to.path}`)
    return
  }
  
  // 如果有token但没有用户信息，获取用户信息
  let userInfoFetched = !!userStore.username; // Check if username already exists
  if (token && !userInfoFetched) {
    try {
      userInfoFetched = await userStore.getUserInfo()
      if (!userInfoFetched) {
        // 获取用户信息失败，可能是token过期
        console.log('getUserInfo failed, resetting state.')
        userStore.resetState()
        ElMessage.error('获取用户信息失败，请重新登录')
        next(`/login?redirect=${to.path}`)
        return;
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      userStore.resetState()
      ElMessage.error('获取用户信息异常，请重新登录')
      next(`/login?redirect=${to.path}`)
      return;
    }
  }
  
  // 检查Admin权限
  if (to.meta.requiresAdmin) {
    console.log('Checking admin requirement for route:', to.path);
    // Make sure user info is loaded before checking isAdmin
    if (!userStore.username) {
       // This case should ideally be handled by the previous block, but as a safeguard:
       console.error('Attempting to access Admin page, but user info not loaded yet.');
       // It might be a race condition, try fetching again or redirect
       // For now, redirect to login as a safe measure
       userStore.resetState()
       ElMessage.error('用户信息加载失败，请重新登录');
       next(`/login?redirect=${to.path}`)
       return;
    }

    // Check if the user is admin 
    const isAdminUser = userStore.username === 'admin'; // Direct check for simplicity
    console.log(`Is user admin? (${userStore.username}): ${isAdminUser}`);
    if (!isAdminUser) {
      ElMessage.error('您没有权限访问此页面');
      next('/404'); // Or redirect to a specific 'forbidden' page
      return;
    }
  }
  
  // 如果一切正常，允许导航
  console.log('Navigation guard passed, allowing navigation to:', to.path);
  next()
})

export default router