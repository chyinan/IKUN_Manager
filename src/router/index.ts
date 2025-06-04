import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import StudentLayout from '@/views/student/StudentLayout.vue'

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
import SettingsLayout from '@/views/settings/SettingsLayout.vue'
import ValidationRules from '@/views/settings/ValidationRules.vue'
import Profile from '@/views/profile/index.vue'
import Login from '@/views/login/index.vue'
import NotFound from '@/views/error/404.vue'
import CarouselManagement from '@/views/settings/CarouselManagement.vue'

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
          name: 'SettingsLayout',
          component: SettingsLayout,
          redirect: '/settings/validation-rules',
          meta: { title: '系统设置', icon: 'Setting', requiresAdmin: true },
          children: [
            {
              path: 'validation-rules',
              name: 'ValidationRules',
              component: ValidationRules,
              meta: { title: '验证规则', requiresAdmin: true }
            },
            {
              path: 'carousel',
              name: 'CarouselManagement',
              component: CarouselManagement,
              meta: { title: '轮播图管理', icon: 'Picture', requiresAdmin: true }
            }
          ]
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
      path: '/student-portal',
      component: StudentLayout,
      redirect: '/student-portal/dashboard',
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'StudentDashboard',
          component: () => import('@/views/student/StudentDashboard.vue'),
          meta: { title: '学生首页', icon: 'House' }
        },
        {
          path: 'my-scores',
          name: 'MyScores',
          component: () => import('@/views/student/MyScores.vue'),
          meta: { title: '我的成绩', icon: 'Memo' }
        },
        {
          path: 'upcoming-exams',
          name: 'UpcomingExams',
          component: () => import('@/views/student/UpcomingExams.vue'),
          meta: { title: '待考考试', icon: 'Clock' }
        },
        {
          path: 'announcements',
          name: 'StudentAnnouncements',
          component: () => import('@/views/student/Announcements.vue'),
          meta: { title: '学校通知', icon: 'Bell' }
        },
        {
          path: 'profile-settings',
          name: 'StudentProfileSettings',
          component: () => import('@/views/student/ProfileSettings.vue'),
          meta: { title: '个人设置', icon: 'Setting' }
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
  
  console.log(`[Router Guard] Navigating to: ${to.path}`);
  console.log(`[Router Guard] Token exists: ${!!token}`);
  console.log(`[Router Guard] userStore.username (before getUserInfo check): ${userStore.username}`);
  console.log(`[Router Guard] userStore.roles.value (before getUserInfo check): ${JSON.stringify(userStore.roles)}`);
  console.log(`[Router Guard] userStore.isAdmin (before getUserInfo check): ${userStore.isAdmin}`);
  
  // 如果是登录页，直接放行
  if (to.path === '/login') {
    if (token) {
      console.log('[Router Guard] On login page with token. Checking redirect...');
      console.log(`[Router Guard] userStore.isAdmin (for login redirect): ${userStore.isAdmin}`);
      console.log(`[Router Guard] userStore.isStudent (for login redirect): ${userStore.isStudent}`);
      if (userStore.isAdmin) { 
         next('/') 
      } else if (userStore.isStudent) { 
         next('/student-portal')
      } else {
         next('/') // Fallback
      }
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
  if (!userStore.username) { // Simpler check: if no username, try fetching
    console.log('[Router Guard] Username not found in store, attempting to fetch user info...');
    try {
      const userInfoFetchedSuccess = await userStore.getUserInfoAction(); // Ensure this is the correct action name
      console.log(`[Router Guard] getUserInfoAction success: ${userInfoFetchedSuccess}`);
      if (!userInfoFetchedSuccess) {
        userStore.resetState()
        ElMessage.error('获取用户信息失败，请重新登录')
        next(`/login?redirect=${to.path}`)
        return;
      }
      // After fetching, log the state again
      console.log(`[Router Guard] userStore.username (after getUserInfo): ${userStore.username}`);
      console.log(`[Router Guard] userStore.roles.value (after getUserInfo): ${JSON.stringify(userStore.roles)}`);
      console.log(`[Router Guard] userStore.isAdmin (after getUserInfo): ${userStore.isAdmin}`);
    } catch (error) {
      console.error('[Router Guard] Error fetching user info in guard:', error);
      userStore.resetState()
      ElMessage.error('获取用户信息异常，请重新登录')
      next(`/login?redirect=${to.path}`)
      return;
    }
  }

  // 角色和权限检查
  // 1. 检查管理员权限 (已有逻辑)
  if (to.meta.requiresAdmin) {
    console.log('[Router Guard] Route requires admin. Performing admin check...');
    console.log(`[Router Guard] Current userStore.username: ${userStore.username}`);
    console.log(`[Router Guard] Current userStore.roles.value: ${JSON.stringify(userStore.roles)}`);
    console.log(`[Router Guard] Current userStore.isAdmin value: ${userStore.isAdmin}`);
    
    if (!userStore.username) { 
       // This case should ideally be caught by the block above that fetches user info.
       // If it's reached, means username is still not available after fetch attempt or if fetch was skipped.
       console.warn('[Router Guard] Admin check: Username still not available!');
       userStore.resetState();
       ElMessage.error('用户信息加载异常，请重新登录（管理员检查处）');
       next(`/login?redirect=${to.path}`);
       return;
    }
    const isAdminUser = userStore.isAdmin; // 假设 userStore.isAdmin 已经是布尔值
    if (!isAdminUser) {
      ElMessage.error('您没有权限访问此页面 (来自路由守卫的 isAdmin 判断)');
      console.log(`[Router Guard] Access denied to ${to.path} for user ${userStore.username} because isAdmin is false.`);
      next('/404'); 
      return;
    }
  }

  // 2. 检查是否是学生门户的路由，并且当前用户是否是学生
  //    (这是一个简化的示例，实际应用中角色判断可能更复杂)
  if (to.path.startsWith('/student-portal')) {
    if (!userStore.username) { 
       userStore.resetState();
       ElMessage.error('用户信息加载失败，请重新登录');
       next(`/login?redirect=${to.path}`);
       return;
    }
    // 假设 userStore 中有 isStudent 属性或方法来判断是否为学生
    // 或者后端返回的用户信息中有角色字段，如 userStore.userInfo.role === 'student'
    const isStudentUser = userStore.isStudent; // 假设的属性
    if (!isStudentUser && !userStore.isAdmin) { // 如果不是学生也不是管理员（防止管理员被锁在学生门户之外，如果他们偶然访问）
      ElMessage.error('您没有权限访问学生门户');
      next('/login'); // 或者跳转到管理员首页 next('/');
      return;
    }
     // 如果是管理员，但不是学生，且访问学生门户，可以选择重定向或允许（取决于业务需求）
     // if (userStore.isAdmin && !isStudentUser) {
     //   ElMessage.info('管理员账户访问学生门户。');
     // }
  }
  
  console.log(`[Router Guard] Navigation guard passed, allowing navigation to: ${to.path}`);
  next()
})

export default router