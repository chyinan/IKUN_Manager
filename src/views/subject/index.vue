<template>
  <div class="app-container">
    <el-card>
      <!-- 操作区域 -->
      <div class="action-bar">
        <el-input
          v-model="queryParams.keyword"
          placeholder="输入科目名称或代码搜索"
          clearable
          class="search-input"
          @keyup.enter="handleQuery"
        />
        <el-button type="primary" :icon="Search" @click="handleQuery">搜索</el-button>
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增科目</el-button>
      </div>

      <!-- 表格区域 -->
      <el-table :data="subjectList" v-loading="loading" style="width: 100%" border>
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="subject_name" label="科目名称" align="center" />
        <el-table-column prop="subject_code" label="科目代码" align="center" />
        <el-table-column prop="create_time" label="创建时间" align="center" width="180">
          <template #default="{ row }">
            <span>{{ formatDateTime(row.create_time) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="180">
          <template #default="{ row }">
            <el-button type="primary" link :icon="Edit" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link :icon="Delete" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="500px" @close="handleCancel">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
        <el-form-item label="科目名称" prop="subject_name">
          <el-input v-model="formData.subject_name" placeholder="请输入科目名称" />
        </el-form-item>
        <el-form-item label="科目代码" prop="subject_code">
          <el-input v-model="formData.subject_code" placeholder="请输入科目代码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Plus, Edit, Delete } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import { getSubjectList, addSubject, updateSubject, deleteSubject } from '@/api/subject';
import type { SubjectInfo } from '@/types/subject';
import { formatDateTime } from '@/utils/date';

const loading = ref(false);
const subjectList = ref<SubjectInfo[]>([]);
const originalSubjectList = ref<SubjectInfo[]>([]); // Store original list for client-side search

const queryParams = reactive({
  keyword: '',
});

const dialogVisible = ref(false);
const dialogTitle = ref('');
const formRef = ref<FormInstance>();
const formData = ref<Partial<SubjectInfo>>({
  subject_name: '',
  subject_code: '',
});
let currentSubjectId: number | null = null;

const formRules = reactive<FormRules>({
  subject_name: [{ required: true, message: '科目名称不能为空', trigger: 'blur' }],
});

// 获取列表
const fetchSubjectList = async () => {
  loading.value = true;
  try {
    const res = await getSubjectList();
    // Corrected: The data from the API is directly in res.data
    subjectList.value = res.data; 
    originalSubjectList.value = res.data;
  } catch (error) {
    console.error('获取科目列表失败:', error);
    ElMessage.error('获取科目列表失败');
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleQuery = () => {
  const keyword = queryParams.keyword.trim().toLowerCase();
  if (!keyword) {
    subjectList.value = originalSubjectList.value;
    return;
  }
  subjectList.value = originalSubjectList.value.filter(
    (subject) =>
      subject.subject_name.toLowerCase().includes(keyword) ||
      (subject.subject_code && subject.subject_code.toLowerCase().includes(keyword))
  );
};

// 新增
const handleAdd = () => {
  resetForm();
  dialogTitle.value = '新增科目';
  dialogVisible.value = true;
};

// 编辑
const handleEdit = (row: SubjectInfo) => {
  resetForm();
  dialogTitle.value = '编辑科目';
  currentSubjectId = row.id as number;
  formData.value = { ...row };
  dialogVisible.value = true;
};

// 删除
const handleDelete = (id: number) => {
  ElMessageBox.confirm('确定要删除该科目吗？此操作不可逆。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await deleteSubject(id);
      ElMessage.success('删除成功');
      fetchSubjectList(); // Refresh list
    } catch (error: any) {
      ElMessage.error(error.message || '删除失败');
    }
  }).catch(() => {
    // a user canceled
  });
};

// 提交
const handleSubmit = () => {
  formRef.value?.validate(async (valid) => {
    if (valid) {
      const payload = {
        subject_name: formData.value.subject_name!,
        subject_code: formData.value.subject_code,
      };

      try {
        if (currentSubjectId !== null) {
          // 更新
          await updateSubject(currentSubjectId, payload as { name: string; subject_code?: string });
          ElMessage.success('更新成功');
        } else {
          // 新增
          await addSubject(payload);
          ElMessage.success('新增成功');
        }
        dialogVisible.value = false;
        fetchSubjectList(); // Refresh list
      } catch (error: any) {
        ElMessage.error(error.message || '操作失败');
      }
    }
  });
};

// 取消与重置
const handleCancel = () => {
  dialogVisible.value = false;
  resetForm();
};

const resetForm = () => {
  currentSubjectId = null;
  formData.value = {
    subject_name: '',
    subject_code: '',
  };
  formRef.value?.resetFields();
};

onMounted(() => {
  fetchSubjectList();
});
</script>

<style scoped>
.action-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}
.search-input {
  max-width: 300px;
}
</style>
