<script setup lang="ts">
import { ref, watch, defineProps, defineEmits, onMounted } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import type { AssignmentCreateRequest, AssignmentResponse, AssignmentStatus } from '@/api/assignment'
import { createAssignment, updateAssignment, getAssignmentDetail, AssignmentStatus as AssignmentStatusEnum, getClassList } from '@/api/assignment'
import type { ClassItem } from '@/types/class'
import { Plus } from '@element-plus/icons-vue'
import type { UploadProps, UploadRawFile } from 'element-plus'
import { uploadFile } from '@/api/common' // Assuming a common file upload API

const props = defineProps({
  assignmentId: { type: Number, default: null }
})

const emit = defineEmits(['success', 'cancel'])

const assignmentForm = ref<AssignmentCreateRequest>({
  title: '',
  content: '',
  attachmentUrl: '',
  dueDate: new Date().toISOString().slice(0, 16), // Default to current time
  status: AssignmentStatusEnum.DRAFT,
  classIds: []
})

const formRef = ref<any>(null)
const loading = ref(false)
const dialogTitle = ref('发布新作业')
const classOptions = ref<ClassItem[]>([])

const rules = {
  title: [{ required: true, message: '请输入作业标题', trigger: 'blur' }],
  dueDate: [{ required: true, message: '请选择截止日期', trigger: 'change' }],
  classIds: [{ type: 'array', required: true, message: '请选择发布班级', trigger: 'change' }]
}

// 文件上传相关
const fileList = ref<any[]>([])
const attachmentFile = ref<File | null>(null)
const imageUrl = ref<string>('')
const currentAssignmentId = ref<number | null>(null)

// 处理文件选择
const handleFileChange: UploadProps['onChange'] = (uploadFile, uploads) => {
  attachmentFile.value = uploadFile.raw || null;
  imageUrl.value = URL.createObjectURL(uploadFile.raw as UploadRawFile);
  fileList.value = [uploadFile]; // Keep only the latest file
}

// 处理文件上传前的校验
const beforeFileUpload: UploadProps['beforeUpload'] = (rawFile) => {
  // 可以在这里添加文件大小、类型等校验
  return true;
}

// 获取班级列表
const fetchClassOptions = async () => {
  try {
    const response = await getClassList()
    if (response.code === 200 && response.data) {
      classOptions.value = response.data
    } else {
      ElMessage.error(response.message || '获取班级列表失败')
    }
  } catch (error) {
    console.error('获取班级列表异常:', error)
    ElMessage.error('获取班级列表异常')
  }
}

// 加载作业详情（编辑模式）
const loadAssignmentDetail = async (id: number) => {
  loading.value = true
  try {
    const response = await getAssignmentDetail(id)
    if (response.code === 200 && response.data) {
      const data = response.data
      assignmentForm.value = {
        title: data.title,
        content: data.content || '',
        attachmentUrl: data.attachmentUrl || '',
        dueDate: new Date(data.dueDate).toISOString().slice(0, 16),
        status: data.status,
        classIds: data.classIds
      }
      if (data.attachmentUrl) {
        // If there's an attachment URL, display it
        imageUrl.value = data.attachmentUrl;
        // For existing files, you might want to pre-fill fileList with a mock file object
        fileList.value = [{ name: data.attachmentUrl.substring(data.attachmentUrl.lastIndexOf('/') + 1), url: data.attachmentUrl, status: 'success' }];
      }
    } else {
      ElMessage.error(response.message || '加载作业详情失败')
    }
  } catch (error) {
    console.error('加载作业详情异常:', error)
    ElMessage.error('加载作业详情异常')
  } finally {
    loading.value = false
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      const loadingInstance = ElLoading.service({ fullscreen: true, text: '提交中...' });
      try {
        let finalAttachmentUrl = assignmentForm.value.attachmentUrl; // Keep existing if no new file

        if (attachmentFile.value) {
          // Upload new file if selected
          const uploadResponse = await uploadFile(attachmentFile.value, 'assignment_attachments');
          const response = uploadResponse as any;
          if (response && response.code === 200 && response.data && response.data.url) {
            finalAttachmentUrl = response.data.url;
          } else {
            ElMessage.error(response?.message || '附件上传失败');
            return;
          }
        } else if (!imageUrl.value && assignmentForm.value.attachmentUrl) {
          // If imageUrl is cleared but attachmentUrl was present, means user removed it
          finalAttachmentUrl = '';
        }

        assignmentForm.value.attachmentUrl = finalAttachmentUrl;

        let response: any;
        if (props.assignmentId) {
          response = await updateAssignment(props.assignmentId, assignmentForm.value);
        } else {
          response = await createAssignment(assignmentForm.value);
        }

        if (response.code === 200) {
          ElMessage.success(props.assignmentId ? '作业更新成功' : '作业发布成功');
          emit('success');
        } else {
          ElMessage.error(response.message || '操作失败');
        }
      } catch (error) {
        console.error('作业操作异常:', error);
        ElMessage.error('作业操作异常');
      } finally {
        loadingInstance.close();
      }
    }
  });
}

// 取消表单
const handleCancel = () => {
  emit('cancel')
  resetForm()
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  assignmentForm.value = {
    title: '',
    content: '',
    attachmentUrl: '',
    dueDate: new Date().toISOString().slice(0, 16),
    status: AssignmentStatusEnum.DRAFT,
    classIds: []
  }
  fileList.value = [];
  attachmentFile.value = null;
  imageUrl.value = '';
  currentAssignmentId.value = null;
}

watch(() => props.assignmentId, (newVal) => {
  if (newVal) {
    dialogTitle.value = '编辑作业'
    loadAssignmentDetail(newVal)
  } else {
    dialogTitle.value = '发布新作业'
    resetForm()
  }
}, { immediate: true })

onMounted(() => {
  fetchClassOptions()
})
</script>

<template>
  <div class="assignment-form-container" v-loading="loading">
    <el-form
      ref="formRef"
      :model="assignmentForm"
      :rules="rules"
      label-width="120px"
      class="assignment-form"
      @submit.prevent="handleSubmit"
    >
      <el-form-item label="作业标题" prop="title">
        <el-input v-model="assignmentForm.title" placeholder="请输入作业标题"></el-input>
      </el-form-item>

      <el-form-item label="作业内容" prop="content">
        <el-input
          v-model="assignmentForm.content"
          type="textarea"
          :rows="4"
          placeholder="请输入作业内容描述"
        ></el-input>
      </el-form-item>

      <el-form-item label="截止日期" prop="dueDate">
        <el-date-picker
          v-model="assignmentForm.dueDate"
          type="datetime"
          placeholder="选择作业截止日期"
          value-format="YYYY-MM-DDTHH:mm:ss"
          style="width: 100%;"
        ></el-date-picker>
      </el-form-item>

      <el-form-item label="发布状态" prop="status">
        <el-select v-model="assignmentForm.status" placeholder="请选择发布状态" style="width: 100%;">
          <el-option label="草稿" :value="AssignmentStatusEnum.DRAFT"></el-option>
          <el-option label="已发布" :value="AssignmentStatusEnum.PUBLISHED"></el-option>
          <el-option label="已归档" :value="AssignmentStatusEnum.ARCHIVED"></el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="发布班级" prop="classIds">
        <el-select
          v-model="assignmentForm.classIds"
          multiple
          placeholder="请选择发布班级"
          style="width: 100%;"
        >
          <el-option
            v-for="item in classOptions"
            :key="item.id"
            :label="item.className"
            :value="item.id"
          ></el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="作业附件" prop="attachmentUrl">
        <el-upload
          class="avatar-uploader"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleFileChange"
          :before-upload="beforeFileUpload"
          :file-list="fileList"
          accept=".pdf,.doc,.docx,.zip,.rar,.7z,.txt,.png,.jpg,.jpeg"
        >
          <img v-if="imageUrl" :src="imageUrl" class="avatar" alt="Attachment Preview" />
          <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          <template #tip>
            <div class="el-upload__tip">
              可上传文档 (pdf/doc/docx/txt)、压缩包 (zip/rar/7z) 或图片 (png/jpg/jpeg) 文件。
            </div>
            <div v-if="assignmentForm.attachmentUrl && !attachmentFile" class="current-attachment">
              当前附件: <a :href="assignmentForm.attachmentUrl" target="_blank">{{ assignmentForm.attachmentUrl.substring(assignmentForm.attachmentUrl.lastIndexOf('/') + 1) }}</a>
              <el-button type="danger" link size="small" @click="assignmentForm.attachmentUrl = ''; imageUrl = ''; fileList = []">移除</el-button>
            </div>
          </template>
        </el-upload>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleSubmit">{{ props.assignmentId ? '更新' : '发布' }}</el-button>
        <el-button @click="handleCancel">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped>
.assignment-form-container {
  padding: 20px;
}
.avatar-uploader .avatar {
  width: 178px;
  height: 178px;
  display: block;
}
.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}
.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}
.el-icon.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
}
.current-attachment {
  margin-top: 10px;
  color: #606266;
  font-size: 14px;
}
.current-attachment a {
  color: #409eff;
  text-decoration: none;
}
</style> 