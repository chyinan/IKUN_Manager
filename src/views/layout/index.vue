<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()

// 退出登录处理函数
const handleLogout = () => {
  // 清除token
  localStorage.removeItem('token')
  // 显示成功消息
  ElMessage.success('退出成功')
  // 跳转到登录页
  router.push('/login')
}
</script>

<template>
   <div class="common-layout">
    <el-container>
      <!-- 顶栏 - header -->
      <el-header class="header">
        <span class="title">东京都立咒术高专人事管理系统</span>
        <span class="right_tool">
          <a href=""><el-icon><Lock /></el-icon> 修改玄坤 &nbsp;&nbsp;&nbsp;&nbsp;</a>
          <a @click="handleLogout" style="cursor: pointer">
            <el-icon><SwitchButton /></el-icon> 退出IKUN&nbsp;&nbsp;&nbsp;&nbsp;
          </a>
        </span>
      </el-header>
      

      <!-- 左侧菜单 & 主区域 -->
      <el-container>
        <!-- 左侧菜单 -->
        <el-aside width="200px" class="aside">
          <el-scrollbar>
            <el-menu router>
              <!-- 首页菜单 -->
              <el-menu-item index="/index">
                <el-icon><Promotion /></el-icon> 首页
              </el-menu-item>
              
              <!-- 班级管理菜单 -->
              <el-sub-menu index="/manage">
                <template #title>
                  <el-icon><Menu /></el-icon> 班级管理
                </template>
                <el-menu-item index="/clazz">
                  <el-icon><HomeFilled /></el-icon>班级管理
                </el-menu-item>
                <el-menu-item index="/stu">
                  <el-icon><UserFilled /></el-icon>学生管理
                </el-menu-item>
              </el-sub-menu>
              
              <!-- 系统信息管理 -->
              <el-sub-menu index="/system">
                <template #title>
                  <el-icon><Tools /></el-icon>人事管理
                </template>
                <el-menu-item index="/dept">
                  <el-icon><HelpFilled /></el-icon>部门管理
                </el-menu-item>
                <el-menu-item index="/emp">
                  <el-icon><Avatar /></el-icon>员工管理
                </el-menu-item>
              </el-sub-menu>

              <!-- 数据统计管理 -->
              <el-sub-menu index="/report">
                <template #title>
                  <el-icon><Histogram /></el-icon>数据统计管理
                </template>
                <el-menu-item index="/empReport">
                  <el-icon><InfoFilled /></el-icon>员工信息统计
                </el-menu-item>
                <el-menu-item index="/stuReport">
                  <el-icon><Share /></el-icon>学员信息统计
                </el-menu-item>
                <el-menu-item index="/log">
                  <el-icon><Document /></el-icon>日志信息统计
                </el-menu-item>
              </el-sub-menu>
			
            </el-menu>
          </el-scrollbar>
        </el-aside>

        <!-- 主展示区域 -->
        <el-main>
          <RouterView></RouterView>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<style scoped>
.header {
  background-image: linear-gradient(to right, #0cc6e7, #4db5e9, #6fc6eb, #8bd7ec, #a5e8ee);
  line-height: 60px;
}

.title {
  color: white;
  font-size: 35px;
  font-family: 方正剪纸简体;
  
}

.right_tool {
  float: right;
}

a {
  text-decoration: none;
  color: white;
}

.aside {
  border: 1px solid #ccc;
  height: 690px;
  width: 220px;
}
</style>