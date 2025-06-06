import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import StudentLayout from '@/views/student/StudentLayout.vue'
import MyScoresLayout from '@/views/student/MyScoresLayout.vue'

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
import AnnouncementManagement from '@/views/settings/AnnouncementManagement.vue'

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
            },
            {
              path: 'announcements',
              name: 'SettingsAnnouncements',
              component: () => import('@/views/settings/AnnouncementManagement.vue'),
              meta: { title: '通知管理', icon: 'el-icon-bell' }
            },
            {
              path: 'mailbox',
              name: 'SettingsMailbox',
              component: () => import('@/views/settings/MailboxManagement.vue'),
              meta: { title: '信箱管理', icon: 'el-icon-message' }
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
          meta: { title: '学生首页', icon: 'el-icon-odometer' }
        },
        {
          path: 'my-scores',
          name: 'MyScores',
          component: () => import('@/views/student/MyDetailedScores.vue'),
          meta: { title: '我的成绩', icon: 'el-icon-trophy' },
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
          meta: { title: '通知公告', icon: 'el-icon-bell' }
        },
        {
          path: 'mailbox',
          name: 'StudentMailbox',
          component: () => import('@/views/student/Mailbox.vue'),
          meta: { title: '我的信箱', icon: 'el-icon-message' }
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
  
  const userStore = useUserStore()
  const token = userStore.token
  const isStudentPortal = to.path.startsWith('/student-portal')

  console.log(`[Router Guard] Navigating to: ${to.path}`);
  console.log(`[Router Guard] Token: ${token ? 'Exists' : 'None'}`);

  // 1. 如果目标是登录页
  if (to.path === '/login') {
    // 如果已有token，则根据角色重定向到对应首页，防止重复登录
    if (token) {
      // 尝试获取用户信息，以确保角色信息最新
      if (!userStore.username) {
        try {
          await userStore.getUserInfo();
        } catch (e) {
            // 获取信息失败，可能是无效token，登出后回到登录页
            await userStore.logoutAction();
            next();
            return;
        }
      }
      
      if (userStore.isAdmin) {
        next({ path: '/', replace: true });
      } else if (userStore.isStudent) {
        next({ path: '/student-portal', replace: true });
      } else {
        // 如果没有明确角色，回到登录页
        await userStore.logoutAction();
        next();
      }
    } else {
      // 没有token，正常访问登录页
      next();
    }
    return;
  }

  // 2. 如果没有token，且目标不是登录页，则重定向到登录页
  if (!token) {
    console.log('[Router Guard] No token, redirecting to login.');
    next(`/login?redirect=${to.path}`);
    return;
  }

  // 3. 如果有token，获取用户信息
  if (!userStore.username) {
    try {
      console.log('[Router Guard] Token exists, but no user info. Fetching...');
      await userStore.getUserInfo();
      console.log(`[Router Guard] User info fetched. Role: ${userStore.roles.join(', ')}`);
    } catch (error) {
      console.error('[Router Guard] Failed to fetch user info:', error);
      await userStore.logoutAction();
      ElMessage.error('用户信息验证失败，请重新登录。');
      next(`/login?redirect=${to.path}`);
      return;
    }
  }

  // 4. 根据角色进行严格的路径访问控制
  const isAdmin = userStore.isAdmin;
  const isStudent = userStore.isStudent;

  if (isStudentPortal) {
    // 目标是学生门户
    if (isStudent) {
      // 学生访问学生门户 -> 允许
      next();
    } else {
      // 非学生 (如管理员) 尝试访问学生门户 -> 拒绝，重定向到管理员首页
      console.warn(`[Router Guard] DENIED: Admin user trying to access student portal (${to.path}). Redirecting to /.`);
      ElMessage.warning('管理员账户无权访问学生门户');
      next('/');
    }
  } else {
    // 目标是后台管理系统
    if (isAdmin) {
      // 管理员访问后台 -> 允许
      next();
    } else {
      // 非管理员 (如学生) 尝试访问后台 -> 拒绝，重定向到学生首页
      console.warn(`[Router Guard] DENIED: Student user trying to access admin portal (${to.path}). Redirecting to /student-portal.`);
      ElMessage.error('您没有权限访问此页面');
      next('/student-portal');
    }
  }
});


// 路由切换后
router.afterEach(() => {
// ... existing code ...

})

export default router