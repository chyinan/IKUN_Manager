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
    <el-card shadow="never" class="table-card">
      <div class="list-header">
        <h2>我的作业</h2>
      </div>

      <el-table v-loading="listLoading" :data="assignments" style="width: 100%" class="modern-table" empty-text="当前没有待完成的作业">
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="title" label="作业标题"></el-table-column>
        <el-table-column prop="teacherName" label="发布教师" width="120"></el-table-column>
        <el-table-column prop="classNames" label="所属班级">
          <template #default="scope">
            <el-tag v-for="(name, index) in scope.row.classNames" :key="index" style="margin-right: 5px;" class="status-tag">
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
            <el-tag :type="statusTagType(scope.row.status)" class="status-tag">
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
      <StudentSubmissionDetail :assignment-id="currentAssignmentId || 0" @success="handleSubmissionSuccess" @cancel="dialogVisible = false" />
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.student-assignments-container {
  padding: 20px;
}

.table-card {
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 10px;

  :deep(.el-card__body) {
    padding: 0;
  }
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h2 {
    font-size: 24px;
    font-weight: 600;
    color: #ffffff;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
    margin: 0;
  }
}

// 借鉴 mailbox.vue 的现代透明表格样式
:deep(.modern-table) {
  background-color: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  overflow: hidden;

  --el-table-border-color: rgba(255, 255, 255, 0.2);

  .el-table__header-wrapper th,
  .el-table__header-wrapper tr {
    background-color: rgb(91 161 233 / 8%) !important;
    color: #fff;
    font-weight: 600;
  }

  .el-table__row {
    color: #ffffff;
    background-color: rgb(156 229 255 / 38%) !important;
    
    &:hover > td {
      background-color: rgba(156, 229, 255, 0.5) !important;
    }
  }

  td.el-table__cell,
  th.el-table__cell.is-leaf {
    border-color: transparent !important;
  }

  &::before,
  &::after {
    display: none;
  }
  
  .el-table__inner-wrapper {
     border-radius: 12px;
  }

  .el-table__empty-text {
    color: #c0c4cc;
  }

  .status-tag {
    background-color: rgba(255, 255, 255, 0.15) !important;
    border-color: rgba(255, 255, 255, 0.25) !important;
    color: #e0e7ff !important;
    font-weight: 500;
  }

  // 操作列的链接按钮颜色更加醒目
  .el-button.is-link {
    color: #bfe9ff !important;
    &:hover, &:focus {
      color: #e8f7ff !important;
      text-decoration: underline;
    }
  }
}

// 美化弹窗样式
:deep(.el-dialog) {
  background-color: rgba(255, 255, 255, 0.5); // 半透明背景
  backdrop-filter: blur(15px); // 应用背景模糊
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 15px; // 圆角
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);

  .el-dialog__header {
    .el-dialog__title {
      color: #303133; // 深色标题以保证可读性
      font-weight: 600;
    }
    .el-dialog__headerbtn .el-dialog__close {
      color: #303133;
      &:hover {
        color: #409eff;
      }
    }
  }

  .el-dialog__body {
    padding-top: 10px;
    padding-bottom: 20px;
    color: #333; // 保证弹窗内基本字体颜色
  }
}
</style> 