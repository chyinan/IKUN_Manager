<script setup lang="ts">
import { ref, watch, defineProps, defineEmits, onMounted } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import type { SubmissionResponse, SubmissionGradeRequest } from '@/api/submission'
import { getSubmissionDetail, gradeSubmission } from '@/api/submission'

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
    <el-card v-if="submissionDetail">
      <template #header>
        <div class="card-header">
          <span>提交详情</span>
        </div>
      </template>
      <div>
        <p><strong>作业标题:</strong> {{ submissionDetail.assignmentTitle }}</p>
        <p><strong>学生姓名:</strong> {{ submissionDetail.studentName }} (学号: {{ submissionDetail.studentNumber }})</p>
        <p><strong>提交内容:</strong> {{ submissionDetail.submissionContent || '无' }}</p>
        <p v-if="submissionDetail.submissionFileUrl"><strong>提交文件:</strong> <el-link type="primary" :href="submissionDetail.submissionFileUrl" target="_blank">点击下载</el-link></p>
        <p><strong>提交时间:</strong> {{ new Date(submissionDetail.submittedAt).toLocaleString() }}</p>
        <p><strong>当前状态:</strong>
          <el-tag :type="submissionDetail.status === 'graded' ? 'success' : (submissionDetail.status === 'late' ? 'danger' : 'info')">
            {{ submissionDetail.status === 'submitted' ? '已提交' : (submissionDetail.status === 'graded' ? '已批改' : '迟交') }}
          </el-tag>
        </p>
        <p v-if="submissionDetail.grade !== null"><strong>当前分数:</strong> {{ submissionDetail.grade }}</p>
        <p v-if="submissionDetail.teacherComment"><strong>当前评语:</strong> {{ submissionDetail.teacherComment }}</p>
      </div>
    </el-card>

    <el-divider />

    <h3>批改作业</h3>
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

<style scoped>
.grade-submission-container {
  padding: 10px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}
.grade-form {
  margin-top: 20px;
}
</style>
