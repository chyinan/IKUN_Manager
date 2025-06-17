<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { AssignmentResponse } from '@/api/assignment'
import { AssignmentStatus, getAllAssignments, deleteAssignment } from '@/api/assignment'
import { useUserStore } from '@/stores/user'
import AssignmentForm from './AssignmentForm.vue' // 导入作业表单组件
import router from '@/router'

const userStore = useUserStore()
const assignments = ref<AssignmentResponse[]>([])
const total = ref(0)
const listLoading = ref(true)
const dialogVisible = ref(false)
const currentAssignmentId = ref<number | null>(null)

// Computed property to determine if the current user is a teacher or admin
const isTeacherOrAdmin = computed(() => {
  return userStore.roles.includes('teacher') || userStore.roles.includes('admin')
})

// 获取作业列表
const fetchAssignments = async () => {
  listLoading.value = true
  try {
    const response = await getAllAssignments()
    if (response.code === 200) {
      assignments.value = response.data
      total.value = response.data.length
    } else {
      ElMessage.error(response.message || '获取作业列表失败')
    }
  } catch (error) {
    console.error('获取作业列表异常:', error)
    ElMessage.error('获取作业列表异常')
  } finally {
    listLoading.value = false
  }
}

// 处理作业状态显示
const formatStatus = (status: AssignmentStatus) => {
  switch (status) {
    case AssignmentStatus.DRAFT:
      return '草稿'
    case AssignmentStatus.PUBLISHED:
      return '已发布'
    case AssignmentStatus.ARCHIVED:
      return '已归档'
    default:
      return status
  }
}

// 根据状态返回 Tag 颜色
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

// 处理日期格式化
const formatDateTime = (dateTimeString: string) => {
  const date = new Date(dateTimeString);
  return date.toLocaleString(); // 或根据需要格式化
}

// 新增作业
const handleAdd = () => {
  currentAssignmentId.value = null
  dialogVisible.value = true
}

// 编辑作业
const handleEdit = (id: number) => {
  currentAssignmentId.value = id
  dialogVisible.value = true
}

// 删除作业
const handleDelete = async (id: number) => {
  ElMessageBox.confirm('确定删除该作业吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        const response = await deleteAssignment(id)
        if (response.code === 200) {
          ElMessage.success('删除成功')
          fetchAssignments()
        } else {
          ElMessage.error(response.message || '删除失败')
        }
      } catch (error) {
        console.error('删除作业异常:', error)
        ElMessage.error('删除作业异常')
      }
    })
    .catch(() => {
      // 用户取消删除
    })
}

// 查看作业提交
const handleViewSubmissions = (assignmentId: number) => {
  router.push(`/assignment/submissions/${assignmentId}`)
}

// 处理表单提交成功后的回调
const handleFormSuccess = () => {
  dialogVisible.value = false
  fetchAssignments()
}

onMounted(() => {
  fetchAssignments()
})
</script>

<template>
  <div class="assignment-list-container">
    <h2>作业管理</h2>
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>作业列表</span>
          <el-button v-if="isTeacherOrAdmin" type="primary" @click="handleAdd">发布新作业</el-button>
        </div>
      </template>

      <el-table v-loading="listLoading" :data="assignments" style="width: 100%" border>
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="title" label="作业标题"></el-table-column>
        <el-table-column prop="teacherName" label="发布教师" width="120"></el-table-column>
        <el-table-column prop="classNames" label="发布班级">
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
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="handleEdit(scope.row.id)" v-if="isTeacherOrAdmin && scope.row.status !== AssignmentStatus.ARCHIVED">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(scope.row.id)" v-if="isTeacherOrAdmin && scope.row.status !== AssignmentStatus.ARCHIVED">删除</el-button>
            <el-button link type="primary" size="small" @click="handleViewSubmissions(scope.row.id)" v-if="isTeacherOrAdmin">查看提交</el-button>
            <el-button link type="success" size="small" @click="handleDownloadAttachment(scope.row.attachmentUrl)" v-if="scope.row.attachmentUrl">下载附件</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- AssignmentForm 弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="currentAssignmentId ? '编辑作业' : '发布新作业'"
      width="60%"
      destroy-on-close
    >
      <AssignmentForm :assignment-id="currentAssignmentId" @success="handleFormSuccess" @cancel="dialogVisible = false" />
    </el-dialog>
  </div>
</template>

<style scoped>
.assignment-list-container {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style> 