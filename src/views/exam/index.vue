<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>考试管理</span>
          <el-button type="primary" @click="handleOpenDialog()">
            <el-icon class="el-icon--left"><Plus /></el-icon>
            新建考试
          </el-button>
        </div>
      </template>

      <!-- 搜索和筛选 -->
      <div class="filter-container">
        <el-input
          v-model="searchKeyword"
          placeholder="按考试名称搜索"
          class="filter-item"
          style="width: 200px;"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="filterExamType"
          placeholder="按考试类型筛选"
          class="filter-item"
          style="width: 150px;"
          clearable
          @change="handleFilter"
        >
          <el-option v-for="item in examTypeOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select
          v-model="filterStatus"
          placeholder="按状态筛选"
          class="filter-item"
          style="width: 130px;"
          clearable
          @change="handleFilter"
        >
          <el-option label="未发布" :value="0" />
          <el-option label="已发布" :value="1" />
          <el-option label="已结束" :value="2" />
        </el-select>
        <el-button class="filter-item" type="primary" icon="Search" @click="handleFilter">筛选</el-button>
      </div>

      <!-- 考试列表 -->
      <el-table :data="paginatedExams" v-loading="loading" style="width: 100%">
        <el-table-column prop="examName" label="考试名称" min-width="180" />
        <el-table-column prop="examType" label="考试类型" width="120" />
        <el-table-column prop="examDate" label="考试日期" width="120" />
        <el-table-column prop="startTime" label="开始时间" width="120" />
        <el-table-column prop="duration" label="时长(分钟)" width="110" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="220">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleOpenDialog(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row.id)">删除</el-button>
            <el-button
              v-if="row.status === 0"
              type="success"
              link
              @click="handlePublish(row.id, true)"
            >
              发布
            </el-button>
            <el-button
              v-if="row.status === 1"
              type="warning"
              link
              @click="handlePublish(row.id, false)"
            >
              取消发布
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <el-pagination
        background
        layout="prev, pager, next, total"
        :total="totalExams"
        :page-size="pageSize"
        :current-page="currentPage"
        @current-change="handlePageChange"
        class="pagination-container"
      />
    </el-card>

    <!-- 新建/编辑考试对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="60%" :close-on-click-modal="false">
      <el-form ref="examFormRef" :model="examForm" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="考试名称" prop="exam_name">
              <el-input v-model="examForm.exam_name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="考试类型" prop="exam_type">
              <el-input v-model="examForm.exam_type" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="考试日期" prop="exam_date">
              <el-date-picker v-model="examForm.exam_date" type="date" placeholder="选择日期" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="开始时间" prop="start_time">
              <el-time-picker v-model="examForm.start_time" placeholder="选择时间" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="考试时长" prop="duration">
          <el-input-number v-model="examForm.duration" :min="1" /> 分钟
        </el-form-item>
        <el-form-item label="考试描述" prop="description">
          <el-input v-model="examForm.description" type="textarea" />
        </el-form-item>
        <el-form-item label="关联班级" prop="classIds">
          <el-select v-model="examForm.classIds" multiple placeholder="选择班级" style="width: 100%;">
            <el-option
              v-for="cls in allClassList"
              :key="cls.id"
              :label="cls.className"
              :value="cls.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="考试科目" prop="subjectIds">
          <el-select v-model="examForm.subjectIds" multiple placeholder="选择科目" style="width: 100%;">
            <el-option
              v-for="sub in allSubjects"
              :key="sub.id"
              :label="sub.subject_name"
              :value="sub.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import {
  getExamList, addExam, updateExam, deleteExam, publishExam, unpublishExam,
  getExamTypeOptions, getExamSubjects
} from '@/api/exam';
import { getClassList } from '@/api/class';
import type { Exam as ExamType, ExamFormData, ExamItemResponse, ClassItemResponse, Subject as SubjectType } from '@/types/common';
import dayjs from 'dayjs';

// --- State ---
const loading = ref(false);
const submitLoading = ref(false);
const allExams = ref<ExamType[]>([]);
const filteredExams = ref<ExamType[]>([]);
const searchKeyword = ref('');
const filterExamType = ref('');
const filterStatus = ref<number | ''>('');
const currentPage = ref(1);
const pageSize = ref(10);
const dialogVisible = ref(false);
const dialogTitle = ref('');
const examFormRef = ref<FormInstance>();
const examForm = ref<Partial<ExamFormData>>({});
const allClassList = ref<{ id: number; className: string }[]>([]);
const allSubjects = ref<SubjectType[]>([]);
const examTypeOptions = ref<string[]>([]);

// --- Computed Properties ---
const totalExams = computed(() => filteredExams.value.length);
const paginatedExams = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredExams.value.slice(start, end);
});

// --- Mappers ---
const mapExamItemResponseToExamType = (item: ExamItemResponse): ExamType => ({
  id: item.id,
  examName: item.exam_name,
  examType: item.exam_type,
  examDate: item.exam_date,
  startTime: item.start_time,
  duration: item.duration,
  status: item.status,
  description: item.description,
  createTime: item.create_time,
  subjects: item.subjects ? item.subjects.split(',') : [],
  subjectIds: item.subject_ids ? item.subject_ids.split(',').map(Number) : [],
  classNames: item.class_names ? item.class_names.split(',') : [],
  classIds: item.class_ids ? item.class_ids.split(',').map(Number) : [],
});

const mapClassItemResponseToClassOption = (item: ClassItemResponse) => ({
  id: item.id,
  className: item.class_name,
});

// --- Data Fetching ---
const fetchExams = async () => {
  loading.value = true;
  try {
    const res = await getExamList({ page: 1, pageSize: 9999 });
    if (res.code === 200) {
      allExams.value = res.data.list.map(mapExamItemResponseToExamType);
      handleFilter(); // Apply initial filter
    } else {
      ElMessage.error(res.message || '获取考试列表失败');
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取考试列表失败');
  } finally {
    loading.value = false;
  }
};

const fetchDependencies = async () => {
  try {
    const [classRes, subjectRes, typeRes] = await Promise.all([
      getClassList({ page: 1, pageSize: 9999 }),
      getExamSubjects(),
      getExamTypeOptions()
    ]);

    if (classRes.code === 200) {
      allClassList.value = classRes.data.map(mapClassItemResponseToClassOption);
    } else {
      ElMessage.error(classRes.message || '获取班级列表失败');
    }

    if (subjectRes.code === 200) {
      allSubjects.value = subjectRes.data;
    } else {
      ElMessage.error(subjectRes.message || '获取科目列表失败');
    }

    if (typeRes.code === 200) {
      examTypeOptions.value = typeRes.data;
    } else {
      ElMessage.error(typeRes.message || '获取考试类型失败');
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取依赖数据失败');
  }
};

onMounted(() => {
  fetchExams();
  fetchDependencies();
});

// --- Filtering and Pagination ---
const handleFilter = () => {
  currentPage.value = 1;
  let filtered = allExams.value;

  if (searchKeyword.value) {
    filtered = filtered.filter(exam => exam.examName.includes(searchKeyword.value));
  }
  if (filterExamType.value) {
    filtered = filtered.filter(exam => exam.examType === filterExamType.value);
  }
  if (filterStatus.value !== '') {
    filtered = filtered.filter(exam => exam.status === filterStatus.value);
  }
  
  filteredExams.value = filtered;
};

const handleSearch = () => {
  handleFilter();
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
};

// --- Dialog and Form Handling ---
const rules = reactive<FormRules>({
  exam_name: [{ required: true, message: '请输入考试名称', trigger: 'blur' }],
  exam_type: [{ required: true, message: '请输入考试类型', trigger: 'blur' }],
  exam_date: [{ required: true, message: '请选择考试日期', trigger: 'change' }],
  start_time: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  duration: [{ required: true, type: 'number', message: '请输入考试时长', trigger: 'blur' }],
  classIds: [{ required: true, type: 'array', message: '请选择关联班级', trigger: 'change' }],
  subjectIds: [{ required: true, type: 'array', message: '请选择考试科目', trigger: 'change' }],
});

const resetForm = () => {
  examForm.value = {
    exam_name: '',
    exam_type: '',
    exam_date: null,
    start_time: null,
    duration: 120,
    description: '',
    classIds: [],
    subjectIds: [],
  };
  examFormRef.value?.resetFields();
};

const handleOpenDialog = (row?: ExamType) => {
  if (row) {
    dialogTitle.value = '编辑考试';
    examForm.value = {
      id: row.id,
      exam_name: row.examName,
      exam_type: row.examType,
      exam_date: row.examDate ? dayjs(row.examDate).toDate() : null,
      start_time: row.startTime ? dayjs(`${row.examDate} ${row.startTime}`).toDate() : null,
      duration: row.duration,
      description: row.description || '',
      classIds: row.classIds,
      subjectIds: row.subjectIds,
    };
  } else {
    dialogTitle.value = '新建考试';
    resetForm();
  }
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  if (!examFormRef.value) return;
  await examFormRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true;
      try {
        const formData: Partial<ExamFormData> = {
          ...examForm.value,
          exam_date: examForm.value.exam_date,
          start_time: examForm.value.start_time,
        };
        
        if (examForm.value.id) {
          await updateExam(examForm.value.id, formData);
          ElMessage.success('更新成功');
        } else {
          await addExam(formData);
          ElMessage.success('添加成功');
        }
        dialogVisible.value = false;
        fetchExams();
      } catch (error: any) {
        ElMessage.error(error.message || '操作失败');
      } finally {
        submitLoading.value = false;
      }
    }
  });
};

// --- Actions ---
const handleDelete = (id: number) => {
  ElMessageBox.confirm('确定要删除这个考试吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await deleteExam(id);
      ElMessage.success('删除成功');
      fetchExams();
    } catch (error: any) {
      ElMessage.error(error.message || '删除失败');
    }
  });
};

const handlePublish = async (id: number, publish: boolean) => {
  try {
    if (publish) {
      await publishExam(id);
      ElMessage.success('发布成功');
    } else {
      await unpublishExam(id);
      ElMessage.success('取消发布成功');
    }
    fetchExams();
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败');
  }
};

// --- UI Helpers ---
const getStatusText = (status: number): string => {
  switch (status) {
    case 0: return '未发布';
    case 1: return '已发布';
    case 2: return '已结束';
    default: return '未知';
  }
};

const getStatusTagType = (status: number) => {
  switch (status) {
    case 0: return 'info';
    case 1: return 'success';
    case 2: return 'danger';
    default: return 'warning';
  }
};
</script>

<style scoped>
.app-container {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.filter-container {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}
.filter-item {
  margin-right: 10px;
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style> 