<script setup lang="ts">
import { ref, watch, defineProps, defineEmits, onMounted } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import type { SubmissionResponse, SubmissionGradeRequest } from '@/api/submission'
import { getSubmissionDetail, gradeSubmission } from '@/api/submission'
import axios from 'axios'

const props = defineProps({
  submissionId: { type: Number, required: true }
})

const emit = defineEmits(['success', 'cancel'])

const gradeForm = ref<SubmissionGradeRequest>({
  submissionId: props.submissionId,
  grade: 0,
  teacherComment: ''
})

const submissionDetail = ref<SubmissionResponse | null>(null)
const formRef = ref<any>(null)
const loading = ref(false)

const rules = {
  grade: [
    { required: true, message: '请输入分数', trigger: 'blur' },
    { type: 'number', min: 0, max: 100, message: '分数必须在0-100之间', trigger: 'blur' }
  ]
}

// 加载提交详情
const loadSubmissionDetail = async (id: number) => {
  loading.value = true
  try {
    const response = await getSubmissionDetail(id)
    if (response.code === 200 && response.data) {
      submissionDetail.value = response.data
      // 如果已经有分数和评语，则填充表单
      if (response.data.grade !== null) {
        gradeForm.value.grade = response.data.grade
      }
      if (response.data.teacherComment !== null) {
        gradeForm.value.teacherComment = response.data.teacherComment
      }
    } else {
      ElMessage.error(response.message || '加载提交详情失败')
    }
  } catch (error) {
    console.error('加载提交详情异常:', error)
    ElMessage.error('加载提交详情异常')
  } finally {
    loading.value = false
  }
}

// 处理文件下载
const handleDownload = async (fileUrl: string, originalName?: string) => {
  const loadingInstance = ElLoading.service({ text: '正在准备下载...', background: 'rgba(0, 0, 0, 0.7)' });
  try {
    const response = await axios({
      url: fileUrl,
      method: 'GET',
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = originalName || fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);

  } catch (error) {
    console.error('下载文件时出错:', error);
    ElMessage.error('下载文件失败，请检查链接或网络');
  } finally {
    loadingInstance.close();
  }
};

// 提交批改
const handleSubmit = async () => {
  if (!formRef.value) return

  formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      const loadingInstance = ElLoading.service({ fullscreen: true, text: '提交批改中...' });
      try {
        const response = await gradeSubmission(gradeForm.value)
        if (response.code === 200) {
          ElMessage.success('批改成功')
          emit('success')
        } else {
          ElMessage.error(response.message || '批改失败')
        }
      } catch (error) {
        console.error('批改作业异常:', error)
        ElMessage.error('批改作业异常')
      } finally {
        loadingInstance.close();
      }
    }
  })
}

// 取消批改
const handleCancel = () => {
  emit('cancel')
  resetForm()
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  gradeForm.value = {
    submissionId: props.submissionId,
    grade: 0,
    teacherComment: ''
  }
}

watch(() => props.submissionId, (newVal) => {
  if (newVal) {
    gradeForm.value.submissionId = newVal;
    loadSubmissionDetail(newVal)
  } else {
    resetForm()
  }
}, { immediate: true })
</script>

<template>
  <div class="grade-submission-container" v-loading="loading">
    <el-card v-if="submissionDetail" class="detail-card">
      <template #header>
        <div class="card-header">
          <span>提交详情</span>
        </div>
      </template>
      <div class="detail-content">
        <p><strong>作业标题:</strong> {{ submissionDetail.assignmentTitle }}</p>
        <p><strong>学生姓名:</strong> {{ submissionDetail.studentName }} (学号: {{ submissionDetail.studentNumber }})</p>
        <p><strong>提交内容:</strong> {{ submissionDetail.submissionContent || '无' }}</p>
        <p v-if="submissionDetail.submissionFileUrl">
          <strong>提交文件:</strong> 
          <el-button type="primary" link @click="handleDownload(submissionDetail.submissionFileUrl!, submissionDetail.submissionFileOriginalName)">
            {{ submissionDetail.submissionFileOriginalName || '点击下载' }}
          </el-button>
        </p>
        <p><strong>提交时间:</strong> {{ new Date(submissionDetail.submittedAt).toLocaleString() }}</p>
        <p><strong>当前状态:</strong>
          <el-tag :type="submissionDetail.status === 'graded' ? 'success' : (submissionDetail.status === 'late' ? 'danger' : 'info')" class="detail-tag">
            {{ submissionDetail.status === 'submitted' ? '已提交' : (submissionDetail.status === 'graded' ? '已批改' : '迟交') }}
          </el-tag>
        </p>
        <p v-if="submissionDetail.grade !== null"><strong>当前分数:</strong> {{ submissionDetail.grade }}</p>
        <p v-if="submissionDetail.teacherComment"><strong>当前评语:</strong> {{ submissionDetail.teacherComment }}</p>
      </div>
    </el-card>

    <el-divider class="custom-divider" />

    <h3 class="section-title">批改作业</h3>
    <el-form
      ref="formRef"
      :model="gradeForm"
      :rules="rules"
      label-width="100px"
      class="grade-form"
      @submit.prevent="handleSubmit"
    >
      <el-form-item label="分数" prop="grade">
        <el-input-number v-model="gradeForm.grade" :min="0" :max="100" controls-position="right"></el-input-number>
      </el-form-item>
      <el-form-item label="教师评语" prop="teacherComment">
        <el-input
          v-model="gradeForm.teacherComment"
          type="textarea"
          :rows="3"
          placeholder="请输入教师评语"
        ></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSubmit">提交批改</el-button>
        <el-button @click="handleCancel">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped lang="scss">
.grade-submission-container {
  color: #333;

  .section-title {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: #2c3e50;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
  }

  .detail-card {
    background-color: rgba(255, 255, 255, 0.4);
    border: none;
    border-radius: 8px;
    margin-bottom: 1rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

    .card-header {
      font-weight: 600;
      color: #2c3e50;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .detail-content p {
      margin: 8px 0;
      line-height: 1.6;
      strong {
        color: #555;
      }
    }
  }

  .detail-tag {
    background-color: rgba(64, 158, 255, 0.2);
    border-color: rgba(64, 158, 255, 0.3);
    color: #00529b;
  }

  .custom-divider {
    border-color: rgba(0, 0, 0, 0.1);
    margin: 2rem 0;
  }

  :deep(.el-form-item__label) {
    color: #555;
    font-weight: 500;
  }

  :deep(.el-input-number),
  :deep(.el-textarea__inner) {
    background-color: rgba(255, 255, 255, 0.6) !important;
    border-color: rgba(0, 0, 0, 0.2) !important;
    color: #333;
    width: 100%;
    
    .el-input__inner {
      background-color: transparent !important;
      border-color: transparent !important;
      color: #333;
    }
    
    &:focus, &:focus-within {
      border-color: #409eff !important;
      box-shadow: 0 0 0 1px #409eff;
    }
  }

  .el-button {
    border-radius: 6px;
  }

  .el-button--primary {
    background-color: #409eff;
    border-color: #409eff;
    &:hover {
      background-color: #66b1ff;
      border-color: #66b1ff;
    }
  }
}
</style>
