import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { getToken } from '@/utils/auth'
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
              meta: { title: '轮播图管理', requiresAdmin: true }
            },
            {
              path: 'announcements',
              name: 'SettingsAnnouncements',
              component: () => import('@/views/settings/AnnouncementManagement.vue'),
              meta: { title: '通知管理' }
            },
            {
              path: 'mailbox',
              name: 'SettingsMailbox',
              component: () => import('@/views/settings/MailboxManagement.vue'),
              meta: { title: '信箱管理' }
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
          path: 'mailbox',
          name: 'StudentMailbox',
          component: () => import('@/views/student/Mailbox.vue'),
          meta: { title: '我的信箱', icon: 'Message' }
        },
        {
          path: 'profile-settings',
          name: 'StudentProfileSettings',
          component: () => import('@/views/student/ProfileSettings.vue'),
          meta: { title: '个人设置', icon: 'Setting' }
        },
        {
          path: 'announcements',
          name: 'StudentAnnouncements',
          component: () => import('@/views/student/Announcements.vue'),
          meta: { title: '通知公告', icon: 'el-icon-bell' }
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

// 白名单: 不需要认证即可访问的路径
const whiteList = ['/login', '/404'];

// 路由守卫
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  document.title = `${to.meta.title ? to.meta.title + ' - ' : ''}IKUN管理系统`;
  
  const userStore = useUserStore();
  const token = getToken(); // 直接从 localStorage 获取 token

  if (token) {
    // 1. 如果有 token
    if (to.path === '/login') {
      next({ path: '/' }); // 如果已登录，访问登录页则重定向到首页
    } else {
      // 检查 Pinia store 中是否已有用户信息
      const hasUserInfo = userStore.userInfo && userStore.userInfo.role;
      if (hasUserInfo) {
        // 如果有，直接放行
        next();
      } else {
        // 如果 Pinia store 中没有，尝试从 sessionStorage 恢复
        const rehydrated = userStore.rehydrateStateFromSession();
        if (rehydrated) {
          console.log('[Router Guard] Rehydrated user state from session. Proceeding.');
          next(); // 恢复成功，放行
        } else {
          // 如果 sessionStorage 也恢复失败，说明 token 有问题
          console.error('[Router Guard] Token exists but cannot rehydrate state. Logging out.');
          await userStore.logout();
          ElMessage.error('用户会话已失效，请重新登录');
          next(`/login?redirect=${to.path}`);
        }
      }
    }
  } else {
    // 2. 如果没有 token
    if (whiteList.includes(to.path)) {
      // 如果在白名单中，直接放行
      next();
    } else {
      // 其他情况都重定向到登录页
      next(`/login?redirect=${to.path}`);
    }
  }
});

// 路由切换后
router.afterEach(() => {
// ... existing code ...

})

export default router