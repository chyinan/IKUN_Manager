<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { SubmissionStatus } from '@/api/submission'
import type { SubmissionResponse } from '@/api/submission'
import { getSubmissionsByAssignmentId, getSubmissionDetail } from '@/api/submission'
import type { AssignmentResponse } from '@/api/assignment'
import { getAssignmentDetail } from '@/api/assignment'
import GradeSubmission from './GradeSubmission.vue' // 导入批改组件
import { useUserStore } from '@/stores/user'

const route = useRoute()
const userStore = useUserStore()
const assignmentId = computed(() => Number(route.params.id))

const assignmentDetail = ref<AssignmentResponse | null>(null)
const submissions = ref<SubmissionResponse[]>([])
const listLoading = ref(true)
const dialogVisible = ref(false) // 控制批改弹窗显示
const currentSubmissionId = ref<number | null>(null) // 当前要批改的提交ID

// Computed property to determine if the current user is a teacher or admin
const isTeacherOrAdmin = computed(() => {
  return userStore.roles.includes('teacher') || userStore.roles.includes('admin')
})

// 获取作业详情
const fetchAssignmentDetail = async () => {
  try {
    const response = await getAssignmentDetail(assignmentId.value)
    if (response.code === 200 && response.data) {
      assignmentDetail.value = response.data
    } else {
      ElMessage.error(response.message || '获取作业详情失败')
    }
  } catch (error) {
    console.error('获取作业详情异常:', error)
    ElMessage.error('获取作业详情异常')
  }
}

// 获取提交列表
const fetchSubmissions = async () => {
  listLoading.value = true
  try {
    const response = await getSubmissionsByAssignmentId(assignmentId.value)
    if (response.code === 200 && response.data) {
      submissions.value = response.data
    } else {
      ElMessage.error(response.message || '获取提交列表失败')
    }
  } catch (error) {
    console.error('获取提交列表异常:', error)
    ElMessage.error('获取提交列表异常')
  } finally {
    listLoading.value = false
  }
}

// 处理提交状态显示
const formatStatus = (status: SubmissionStatus) => {
  switch (status) {
    case SubmissionStatus.SUBMITTED:
      return '已提交'
    case SubmissionStatus.GRADED:
      return '已批改'
    case SubmissionStatus.LATE:
      return '迟交'
    default:
      return status
  }
}

// 处理日期格式化
const formatDateTime = (dateTimeString: string) => {
  const date = new Date(dateTimeString);
  return date.toLocaleString(); // 或根据需要格式化
}

// 批改作业
const handleGrade = (submissionId: number) => {
  currentSubmissionId.value = submissionId
  dialogVisible.value = true
}

// 处理批改成功后的回调
const handleGradeSuccess = () => {
  dialogVisible.value = false
  fetchSubmissions() // 重新加载提交列表以更新状态和分数
}

// 下载提交文件
const handleDownloadFile = (url: string) => {
  if (url) {
    window.open(url, '_blank')
  } else {
    ElMessage.warning('没有可下载的附件')
  }
}

onMounted(() => {
  fetchAssignmentDetail()
  fetchSubmissions()
})
</script>

<template>
  <div class="submission-list-container">
    <h2>
      作业提交列表: <span class="assignment-title">{{ assignmentDetail?.title || '加载中...' }}</span>
    </h2>
    <el-card class="box-card">
       <template #header>
        <div class="card-header">
          <span>提交记录</span>
          <el-button @click="$router.back()">返回作业列表</el-button>
        </div>
       </template>

      <el-table v-loading="listLoading" :data="submissions" style="width: 100%" border empty-text="该作业暂无提交记录">
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="studentName" label="学生姓名" width="120"></el-table-column>
        <el-table-column prop="studentNumber" label="学号" width="120"></el-table-column>
        <el-table-column prop="submissionContent" label="提交内容" show-overflow-tooltip></el-table-column>
        <el-table-column prop="submittedAt" label="提交时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.submittedAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === SubmissionStatus.GRADED ? 'success' : (scope.row.status === SubmissionStatus.LATE ? 'danger' : 'info')" class="status-tag">
              {{ formatStatus(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="grade" label="分数" width="80">
          <template #default="scope">
            {{ scope.row.grade !== null ? scope.row.grade : '未批改' }}
          </template>
        </el-table-column>
        <el-table-column prop="teacherComment" label="教师评语" show-overflow-tooltip></el-table-column>
        <el-table-column label="操作" width="180" fixed="right" v-if="isTeacherOrAdmin">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="handleGrade(scope.row.id)" v-if="scope.row.status !== SubmissionStatus.GRADED">批改</el-button>
            <el-button link type="success" size="small" @click="handleDownloadFile(scope.row.submissionFileUrl)" v-if="scope.row.submissionFileUrl">下载文件</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 批改作业弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      title="批改作业"
      width="50%"
      destroy-on-close
    >
      <GradeSubmission :submission-id="currentSubmissionId" @success="handleGradeSuccess" @cancel="dialogVisible = false" />
    </el-dialog>
  </div>
</template>

<style scoped>
.submission-list-container {
  padding: 20px;
}
.box-card {
  margin-top: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.assignment-title {
  font-weight: normal;
  font-size: 0.9em;
  color: #606266;
}
</style>
