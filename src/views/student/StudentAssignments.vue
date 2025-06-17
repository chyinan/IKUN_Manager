<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
// 分离值与类型导入：AssignmentStatus 作为运行时枚举值导入
import { AssignmentStatus, getAssignmentsByStudent } from '@/api/assignment'
import type { AssignmentResponse } from '@/api/assignment'
import StudentSubmissionDetail from './StudentSubmissionDetail.vue' // 导入学生提交详情组件

const assignments = ref<AssignmentResponse[]>([])
const listLoading = ref(true)
const dialogVisible = ref(false)
const currentAssignmentId = ref<number | null>(null)

// 获取学生作业列表
const fetchAssignments = async () => {
  listLoading.value = true
  try {
    const response = await getAssignmentsByStudent()
    if (response.code === 200) {
      assignments.value = response.data
    } else {
      ElMessage.error(response.message || '获取我的作业列表失败')
    }
  } catch (error) {
    console.error('获取我的作业列表异常:', error)
    ElMessage.error('获取我的作业列表异常')
  } finally {
    listLoading.value = false
  }
}

// 处理作业状态显示
const formatStatus = (status: AssignmentStatus) => {
  switch (status) {
    case AssignmentStatus.DRAFT:
      return '草稿' // 学生通常看不到草稿状态的作业，但以防万一
    case AssignmentStatus.PUBLISHED:
      return '已发布'
    case AssignmentStatus.ARCHIVED:
      return '已归档'
    default:
      return status
  }
}

// 处理日期格式化
const formatDateTime = (dateTimeString: string) => {
  const date = new Date(dateTimeString);
  return date.toLocaleString(); // 或根据需要格式化
}

// 查看/提交作业
const handleViewOrSubmit = (assignmentId: number) => {
  currentAssignmentId.value = assignmentId
  dialogVisible.value = true
}

// 下载附件
const handleDownloadAttachment = (url: string | undefined) => {
  if (!url) return;
  window.open(url, '_blank')
}

// 处理提交成功后的回调
const handleSubmissionSuccess = () => {
  dialogVisible.value = false
  fetchAssignments() // 重新加载作业列表以更新提交状态
}

// 新增：根据状态返回 Element Plus Tag 颜色
const statusTagType = (status: AssignmentStatus | string) => {
  switch (status) {
    case AssignmentStatus.PUBLISHED:
    case 'published':
      return 'success'
    case AssignmentStatus.DRAFT:
    case 'draft':
      return 'info'
    case AssignmentStatus.ARCHIVED:
    case 'archived':
      return 'danger'
    default:
      return 'info'
  }
}

onMounted(() => {
  fetchAssignments()
})
</script>

<template>
  <div class="student-assignments-container">
    <h2>我的作业</h2>
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>我的作业列表</span>
        </div>
      </template>

      <el-table v-loading="listLoading" :data="assignments" style="width: 100%" border>
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="title" label="作业标题"></el-table-column>
        <el-table-column prop="teacherName" label="发布教师" width="120"></el-table-column>
        <el-table-column prop="classNames" label="所属班级">
          <template #default="scope">
            <el-tag v-for="(name, index) in scope.row.classNames" :key="index" style="margin-right: 5px;">
              {{ name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dueDate" label="截止日期" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.dueDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="statusTagType(scope.row.status)">
              {{ formatStatus(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="handleViewOrSubmit(scope.row.id)">查看/提交</el-button>
            <el-button link type="success" size="small" @click="handleDownloadAttachment(scope.row.attachmentUrl)" v-if="scope.row.attachmentUrl">下载附件</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 学生提交详情弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      title="作业详情与提交"
      width="70%"
      destroy-on-close
    >
      <StudentSubmissionDetail :assignment-id="currentAssignmentId" @success="handleSubmissionSuccess" @cancel="dialogVisible = false" />
    </el-dialog>
  </div>
</template>

<style scoped>
.student-assignments-container {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style> 