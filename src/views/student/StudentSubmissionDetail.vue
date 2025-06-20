<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import type { AssignmentResponse, AssignmentStatus } from '@/api/assignment'
import { getAssignmentDetail } from '@/api/assignment'
import type { SubmissionRequest, SubmissionResponse } from '@/api/submission'
import { submitAssignment, updateSubmission, getMySubmissionForAssignment } from '@/api/submission'
import { Plus } from '@element-plus/icons-vue'
import type { UploadProps, UploadRawFile } from 'element-plus'
import { uploadFile } from '@/api/common'

const props = defineProps({
  assignmentId: { type: Number, required: true }
})

const emit = defineEmits(['success', 'cancel'])

const assignmentDetail = ref<AssignmentResponse | null>(null)
const submissionDetail = ref<SubmissionResponse | null>(null)
const submissionForm = ref<SubmissionRequest>({
  assignmentId: props.assignmentId,
  submissionContent: '',
  submissionFileUrl: '',
  submissionFileOriginalName: ''
})

const formRef = ref<any>(null)
const loading = ref(true)
const isSubmitted = ref(false) // 是否已提交过
const isGraded = ref(false) // 是否已批改

// 文件上传相关
const fileList = ref<any[]>([])
const submissionFile = ref<File | null>(null)
const imageUrl = ref<string>('') // 用于显示图片附件预览或下载链接

const rules = {
  // 可以根据需求添加校验规则
}

// 处理文件选择
const handleFileChange: UploadProps['onChange'] = (uploadFile, uploads) => {
  submissionFile.value = uploadFile.raw || null;
  imageUrl.value = URL.createObjectURL(uploadFile.raw as UploadRawFile);
  fileList.value = [uploadFile]; // Keep only the latest file
}

// 处理文件上传前的校验
const beforeFileUpload: UploadProps['beforeUpload'] = (rawFile) => {
  // 可以在这里添加文件大小、类型等校验
  return true;
}

// 加载作业详情
const loadAssignmentDetail = async () => {
  try {
    const response = await getAssignmentDetail(props.assignmentId)
    if (response.code === 200 && response.data) {
      assignmentDetail.value = response.data
    } else {
      ElMessage.error(response.message || '加载作业详情失败')
    }
  } catch (error) {
    console.error('加载作业详情异常:', error)
    ElMessage.error('加载作业详情异常')
  }
}

// 加载学生自己的提交详情
const loadMySubmissionDetail = async () => {
  try {
    const response = await getMySubmissionForAssignment(props.assignmentId)
    if (response.code === 200 && response.data) {
      submissionDetail.value = response.data
      isSubmitted.value = true
      isGraded.value = response.data.status === 'graded'
      submissionForm.value = {
        assignmentId: response.data.assignmentId,
        submissionContent: response.data.submissionContent || '',
        submissionFileUrl: response.data.submissionFileUrl || '',
        submissionFileOriginalName: response.data.submissionFileOriginalName || ''
      }
      if (response.data.submissionFileUrl) {
        imageUrl.value = response.data.submissionFileUrl;
        fileList.value = [{ name: response.data.submissionFileUrl.substring(response.data.submissionFileUrl.lastIndexOf('/') + 1), url: response.data.submissionFileUrl, status: 'success' }];
      }
    } else if (response.code === 404) {
      // 404表示未提交，这是正常情况
      isSubmitted.value = false
      isGraded.value = false
    } else {
      ElMessage.error(response.message || '加载提交详情失败')
    }
  } catch (error: any) {
    // 如果后端返回 404（未提交）或业务提示"未找到该作业的提交记录"，视为正常未提交
    const status = error?.response?.status
    const msg = error?.response?.data?.message || ''
    if (status === 404 || msg.includes('未找到该作业的提交记录')) {
      isSubmitted.value = false
      isGraded.value = false
    } else {
      console.error('加载提交详情异常:', error)
      ElMessage.error('加载提交详情异常')
    }
  }
}

// 提交或更新作业
const handleSubmit = async () => {
  if (!formRef.value) return

  formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      const loadingInstance = ElLoading.service({ fullscreen: true, text: '提交中...' });
      try {
        let finalSubmissionFileUrl = submissionForm.value.submissionFileUrl; // 保留已有的文件URL
        let finalOriginalName = submissionForm.value.submissionFileOriginalName;

        if (submissionFile.value) {
          // 如果选择了新文件，则上传
          const uploadResponse = await uploadFile(submissionFile.value, 'submission_files');
          // uploadFile 从 common.ts 返回 response.data, 后端返回 { filePath: '...', originalFilename: '...' }
          if (uploadResponse && (uploadResponse as any).filePath) {
            finalSubmissionFileUrl = `/uploads/${(uploadResponse as any).filePath}`;
            finalOriginalName = (uploadResponse as any).originalFilename || submissionFile.value.name;
          } else {
            console.error('File upload response did not contain filePath:', uploadResponse);
            ElMessage.error('文件上传失败，无法获取文件路径。');
            loadingInstance.close();
            return;
          }
        } else if (!imageUrl.value && submissionForm.value.submissionFileUrl) {
          // 如果清除了预览图且之前有URL，说明用户要删除附件
          finalSubmissionFileUrl = '';
          finalOriginalName = '';
        }

        const payload: SubmissionRequest = {
          assignmentId: submissionForm.value.assignmentId,
          submissionContent: submissionForm.value.submissionContent,
          submissionFileUrl: finalSubmissionFileUrl,
          submissionFileOriginalName: finalOriginalName
        };

        let response;
        if (isSubmitted.value) {
          // 如果已提交过，则更新
          response = await updateSubmission(submissionDetail.value!.id, payload);
        } else {
          // 否则，新提交
          response = await submitAssignment(payload);
        }

        if (response.code === 200) {
          ElMessage.success(isSubmitted.value ? '提交更新成功' : '作业提交成功');
          emit('success');
        } else {
          ElMessage.error(response.message || '操作失败');
        }
      } catch (error) {
        console.error('作业提交/更新异常:', error);
        ElMessage.error('作业提交/更新异常');
      } finally {
        loadingInstance.close();
      }
    }
  })
}

// 取消操作
const handleCancel = () => {
  emit('cancel')
}

// 初始化数据
const initData = async () => {
  loading.value = true
  await Promise.all([
    loadAssignmentDetail(),
    loadMySubmissionDetail()
  ])
  loading.value = false
}

watch(() => props.assignmentId, (newVal) => {
  if (newVal) {
    submissionForm.value.assignmentId = newVal;
    initData()
  } else {
    // reset form if assignmentId is null
    assignmentDetail.value = null;
    submissionDetail.value = null;
    submissionForm.value = {
      assignmentId: 0, // Reset to a default or appropriate value
      submissionContent: '',
      submissionFileUrl: '',
      submissionFileOriginalName: ''
    };
    isSubmitted.value = false;
    isGraded.value = false;
    fileList.value = [];
    submissionFile.value = null;
    imageUrl.value = '';
  }
}, { immediate: true })

</script>

<template>
  <div class="student-submission-detail-container" v-loading="loading">
    <el-card v-if="assignmentDetail" class="detail-card">
      <template #header>
        <div class="card-header">
          <span>作业详情</span>
        </div>
      </template>
      <div class="detail-content">
        <p><strong>作业标题:</strong> {{ assignmentDetail.title }}</p>
        <p><strong>发布教师:</strong> {{ assignmentDetail.teacherName }}</p>
        <p><strong>发布班级:</strong>
          <el-tag v-for="(name, index) in assignmentDetail.classNames" :key="index" style="margin-right: 5px;" class="detail-tag">
            {{ name }}
          </el-tag>
        </p>
        <p><strong>截止日期:</strong> {{ new Date(assignmentDetail.dueDate).toLocaleString() }}</p>
        <p><strong>作业内容:</strong> {{ assignmentDetail.content || '无' }}</p>
        <p v-if="assignmentDetail.attachmentUrl"><strong>作业附件:</strong>
          <el-link type="primary" :href="assignmentDetail.attachmentUrl" target="_blank">点击下载</el-link>
        </p>
      </div>
    </el-card>

    <el-divider class="custom-divider"/>

    <h3 class="section-title">我的提交</h3>
    <el-card v-if="isSubmitted" class="detail-card">
      <template #header>
        <div class="card-header">
          <span>已提交</span>
          <el-tag :type="submissionDetail?.status === 'graded' ? 'success' : (submissionDetail?.status === 'late' ? 'danger' : 'info')" class="detail-tag">
            {{ submissionDetail?.status === 'submitted' ? '已提交' : (submissionDetail?.status === 'graded' ? '已批改' : '迟交') }}
          </el-tag>
        </div>
      </template>
      <div class="detail-content">
        <p><strong>提交内容:</strong> {{ submissionDetail?.submissionContent || '无' }}</p>
        <p v-if="submissionDetail?.submissionFileUrl"><strong>提交文件:</strong>
          <el-link type="primary" :href="submissionDetail.submissionFileUrl" target="_blank">点击下载</el-link>
        </p>
        <p><strong>提交时间:</strong> {{ new Date(submissionDetail!.submittedAt).toLocaleString() }}</p>
        <p v-if="isGraded">
          <strong>分数:</strong> {{ submissionDetail?.grade !== null ? submissionDetail?.grade : '未批改' }}
        </p>
        <p v-if="isGraded">
          <strong>教师评语:</strong> {{ submissionDetail?.teacherComment || '无' }}
        </p>
      </div>
    </el-card>
    <el-alert v-else type="info" show-icon :closable="false" class="custom-alert">您尚未提交该作业。</el-alert>

    <el-divider class="custom-divider"/>

    <h3 v-if="!isGraded" class="section-title">{{ isSubmitted ? '修改我的提交' : '提交作业' }}</h3>
    <el-form
      v-if="!isGraded"
      ref="formRef"
      :model="submissionForm"
      :rules="rules"
      label-width="120px"
      class="submission-form"
      @submit.prevent="handleSubmit"
    >
      <el-form-item label="提交内容" prop="submissionContent">
        <el-input
          v-model="submissionForm.submissionContent"
          type="textarea"
          :rows="4"
          placeholder="请输入您的作业内容"
        ></el-input>
      </el-form-item>

      <el-form-item label="提交附件" prop="submissionFileUrl">
        <el-upload
          class="submission-uploader"
          action="#"
          :auto-upload="false"
          :on-change="handleFileChange"
          :before-upload="beforeFileUpload"
          :file-list="fileList"
          :limit="1"
        >
          <el-icon class="uploader-icon"><Plus /></el-icon>
        </el-upload>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleSubmit">提交作业</el-button>
        <el-button @click="handleCancel">取消</el-button>
      </el-form-item>
    </el-form>
    <el-alert v-else type="success" show-icon :closable="false">该作业已批改，您无法再修改提交内容。</el-alert>
  </div>
</template>

<style scoped lang="scss">
.student-submission-detail-container {
  color: #333; // 统一容器内字体颜色

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

  .custom-alert {
    background-color: rgba(230, 247, 255, 0.7);
    border: 1px solid rgba(145, 213, 255, 0.7);
    color: #004085;
  }

  :deep(.el-form-item__label) {
    color: #555;
    font-weight: 500;
  }

  :deep(.el-textarea__inner),
  :deep(.el-input__inner) {
    background-color: rgba(255, 255, 255, 0.6);
    border-color: rgba(0, 0, 0, 0.2);
    &:focus {
      border-color: #409eff;
      box-shadow: 0 0 0 1px #409eff;
    }
  }

  .submission-uploader {
    :deep(.el-upload) {
      background-color: rgba(255, 255, 255, 0.6);
      border: 1px dashed rgba(0, 0, 0, 0.3);
      border-radius: 6px;
      &:hover {
        border-color: #409eff;
        .uploader-icon {
          color: #409eff;
        }
      }
    }
    :deep(.el-upload-list__item) {
      background-color: rgba(255, 255, 255, 0.8);
    }
    .uploader-icon {
      font-size: 28px;
      color: #8c939d;
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