<template>
  <div class="exam-container">
    <!-- 页面标题区域 -->
    <div class="page-header-area">
      <div class="page-header">
        <el-icon :size="24"><Calendar /></el-icon>
        <div class="header-content">
          <h2 class="header-title">考试管理</h2>
          <div class="header-desc">管理学校各类考试信息</div>
        </div>
      </div>
      
      <div class="header-actions">
        <el-button type="primary" @click="handleAddExam" :icon="Plus">新增考试</el-button>
      </div>
    </div>
    
    <!-- 搜索和筛选区域 -->
    <el-card class="filter-card">
      <template #header>
        <div class="filter-header">
          <span>搜索与筛选</span>
          <el-button 
            text
            @click="clearFilters" 
            type="primary" 
            :disabled="!hasActiveFilters"
          >
            清除筛选
          </el-button>
        </div>
      </template>
      
      <div class="filter-content">
        <!-- 搜索区域 -->
        <div class="search-section">
          <div class="section-title">
            <el-icon><Search /></el-icon>
            <span>关键词搜索</span>
          </div>
          <el-input
            v-model="searchKeyword"
            placeholder="输入考试名称搜索"
            clearable
            class="filter-item keyword-search-input"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
          </el-input>
        </div>
        
        <!-- 筛选条件 -->
        <div class="filter-section">
          <div class="section-title">
            <el-icon><Filter /></el-icon>
            <span>筛选条件</span>
          </div>
          <!-- 使用嵌套 div 进行布局 -->
          <div class="filter-layout">
            <!-- 第一行：考试类型和状态 -->
            <div class="filter-row">
              <el-select
                v-model="filterExamType"
                placeholder="考试类型"
                clearable
                @change="handleFilterChange"
                class="filter-item"
              >
                <el-option
                  v-for="item in dynamicExamTypeOptions"
                  :key="item"
                  :label="item"
                  :value="item"
                />
              </el-select>
              
              <el-select
                v-model="statusFilter"
                placeholder="考试状态"
                clearable
                @change="handleFilterChange"
                class="filter-item"
              >
                <el-option label="未开始" :value="0" />
                <el-option label="进行中" :value="1" />
                <el-option label="已结束" :value="2" />
              </el-select>
            </div>
            
            <!-- 第二行：日期范围 -->
            <div class="filter-row">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                format="YYYY/MM/DD"
                value-format="YYYY-MM-DD"
                @change="handleFilterChange"
                class="filter-item date-picker-full-width"
              />
            </div>
          </div>
        </div>
      </div>
      
      <!-- 筛选结果显示 -->
      <div class="filter-results" v-if="hasActiveFilters">
        <div class="results-info">
          <el-icon><InfoFilled /></el-icon>
          <span>当前筛选条件下共有 <strong>{{ filteredExamList.length }}</strong> 条数据</span>
        </div>
        
        <div class="active-filters">
          <el-tag 
            v-if="searchKeyword" 
            closable 
            @close="searchKeyword = ''; handleSearch()"
            class="filter-tag"
          >
            关键词: {{ searchKeyword }}
          </el-tag>
          
          <el-tag 
            v-if="filterExamType" 
            closable 
            @close="filterExamType = ''; handleFilterChange()"
            type="success"
            class="filter-tag"
          >
            考试类型: {{ filterExamType }}
          </el-tag>
          
          <el-tag 
            v-if="dateRange" 
            closable 
            @close="dateRange = null; handleFilterChange()"
            type="warning"
            class="filter-tag"
          >
            日期范围: {{ formatDateRangeDisplay(dateRange) }}
          </el-tag>
          
          <el-tag 
            v-if="statusFilter !== null && statusFilter !== undefined" 
            closable 
            @close="statusFilter = null; handleFilterChange()"
            type="danger"
            class="filter-tag"
          >
            考试状态: {{ getStatusText(statusFilter) }}
          </el-tag>
        </div>
      </div>
    </el-card>
    
    <!-- 考试列表 -->
    <el-card class="exam-list-card">
      <template #header>
        <div class="list-header">
          <span>考试列表</span>
          <span class="data-count">共 {{ filteredExamList.length }} 条数据</span>
        </div>
      </template>
      
      <el-table
        :data="paginatedExamList"
        style="width: 100%"
        border
        stripe
        highlight-current-row
        :row-style="{cursor: 'pointer'}"
        v-loading="loading"
        :empty-text="emptyText"
      >
        <!-- 序号列 -->
        <el-table-column type="index" width="60" align="center" label="#" />
        
        <!-- 考试名称列 -->
        <el-table-column label="考试名称" min-width="180">
          <template #default="{row}">
            <div class="exam-name">
              <el-tag :type="getExamTypeTag(row.examType)" effect="plain" size="small">
                {{ row.examType }}
              </el-tag>
              <span>{{ row.examName }}</span>
            </div>
          </template>
        </el-table-column>
        
        <!-- 考试日期列 -->
        <el-table-column label="考试日期" width="120" align="center">
          <template #default="{row}">
            {{ formatDate(row.startTime) }}
          </template>
        </el-table-column>
        
        <!-- 考试时长列 -->
        <el-table-column label="考试时长" width="100" align="center">
          <template #default="{row}">
            {{ row.duration }} 分钟
          </template>
        </el-table-column>
        
        <!-- 考试科目列 -->
        <el-table-column prop="subjects" label="关联科目" min-width="150">
          <template #default="{ row }">
            <span v-if="Array.isArray(row.subjects) && row.subjects.length > 0">
              {{ row.subjects.join(', ') }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        
        <!-- 状态列 -->
        <el-table-column label="状态" width="100" align="center">
          <template #default="{row}">
            <el-tag :type="getStatusType(row.status)" effect="dark" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <!-- 创建时间列 -->
        <el-table-column label="创建时间" width="180" align="center">
          <template #default="{row}">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        
        <!-- 操作列 -->
        <el-table-column label="操作" width="200" align="center">
          <template #default="{row}">
            <div class="operation-buttons">
              <el-button-group>
                <el-button size="small" type="primary" @click="handleEditExam(row)" :icon="Edit">
                  编辑
                </el-button>
                <el-button 
                  size="small" 
                  type="danger" 
                  @click="handleDeleteExam(row)" 
                  :icon="Delete"
                  :disabled="row.status === 2"
                >
                  删除
                </el-button>
              </el-button-group>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页器 -->
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="filteredExamList.length"
        :page-sizes="[10, 20, 30, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        class="pagination"
      />
    </el-card>
    
    <!-- 新增/编辑考试对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditMode ? '编辑考试' : '新增考试'"
      width="800px"
      top="5vh" 
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="examForm"
        :rules="formRules"
        label-width="100px"
        label-position="right"
      >
        <el-form-item label="考试名称" prop="examName">
          <el-input v-model="examForm.examName" placeholder="请输入考试名称" />
        </el-form-item>
        
        <el-form-item label="考试类型" prop="examType">
          <el-select v-model="examForm.examType" placeholder="请选择考试类型" style="width: 100%">
            <el-option
              v-for="item in dynamicExamTypeOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker
            v-model="examForm.startTime"
            type="datetime"
            placeholder="选择开始日期时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        
        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker
            v-model="examForm.endTime"
            type="datetime"
            placeholder="选择结束日期时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        
        <el-form-item label="考试状态">
          <el-radio-group v-model="examForm.status">
            <el-radio :value="0">未开始</el-radio>
            <el-radio :value="1">进行中</el-radio>
            <el-radio :value="2">已结束</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="examForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入考试描述信息"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitExamForm" :loading="submitLoading">
            {{ isEditMode ? '保存' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { Plus, Calendar, Search, Edit, Delete, Filter, InfoFilled } from '@element-plus/icons-vue'
import { 
  getExamList, 
  addExam, 
  updateExam, 
  deleteExam, 
  updateExamStatus,
  publishExam,
  unpublishExam,
  getExamTypeOptions,
  getExamTypes,
  getExamSubjects
} from '@/api/exam'
import type { ExamInfo, ExamQueryParams } from '@/types/exam'
import type { ExamItem, ExamItemResponse, Subject, ApiResponse } from '@/types/common'
import { exportToExcel } from '@/utils/export'
import dayjs from 'dayjs'

// 考试类型选项
const dynamicExamTypeOptions = ref<string[]>([])
const examTypeLoading = ref(false)

// 科目选项
const subjectOptions = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治']

// 状态和数据
const loading = ref(false)
const submitLoading = ref(false)
const examList = ref<ExamItem[]>([])
const statusFilter = ref<number | null>(null)

// 检查是否有激活的筛选条件
const hasActiveFilters = computed(() => {
  return !!searchKeyword.value || !!filterExamType.value || !!dateRange.value || statusFilter.value !== null;
})

// 格式化日期范围显示
const formatDateRangeDisplay = (range: [string, string] | null) => {
  if (!range) return '';
  return `${range[0]} 至 ${range[1]}`;
}

// 清除所有筛选条件
const clearFilters = () => {
  searchKeyword.value = '';
  filterExamType.value = '';
  dateRange.value = null;
  statusFilter.value = null;
  currentPage.value = 1;
  fetchExamList();
}

// 筛选数据计算属性
const filteredExamList = computed(() => {
  // 如果没有筛选条件，直接返回所有数据
  if (!searchKeyword.value.trim() && !filterExamType.value && !dateRange.value && statusFilter.value === null) {
    return examList.value;
  }
  
  // 应用筛选逻辑
  return examList.value.filter(exam => {
    let matchType = true;
    let matchDate = true;
    let matchKeyword = true;
    let matchStatus = true;
    
    // 考试类型筛选
    if (filterExamType.value) {
      matchType = exam.examType === filterExamType.value;
    }
    
    // 日期范围筛选
    if (dateRange.value && dateRange.value.length === 2) {
      const examDate = new Date(exam.startTime);
      const startDate = new Date(dateRange.value[0]);
      const endDate = new Date(dateRange.value[1]);
      
      // 设置结束日期为当天的23:59:59，确保包含当天
      endDate.setHours(23, 59, 59);
      
      matchDate = examDate >= startDate && examDate <= endDate;
    }
    
    // 关键词筛选
    if (searchKeyword.value.trim()) {
      matchKeyword = exam.examName.toLowerCase().includes(searchKeyword.value.toLowerCase());
    }
    
    // 状态筛选
    if (statusFilter.value !== null) {
      matchStatus = exam.status === statusFilter.value;
    }
    
    return matchType && matchDate && matchKeyword && matchStatus;
  });
});

// 分页后的数据显示
const paginatedExamList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredExamList.value.slice(start, end);
});

const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchKeyword = ref('')
const filterExamType = ref('')
const dateRange = ref<[string, string] | null>(null)
const emptyText = ref('暂无考试数据')

// 对话框相关
const dialogVisible = ref(false)
const isEditMode = ref(false)
const formRef = ref<FormInstance>()

// 考试表单
const examForm = ref<ExamItem>({
  id: 0,
  examName: '',
  examType: '',
  startTime: '',
  endTime: '',
  status: 0,
  description: null,
  createTime: ''
})

// 表单验证规则
const formRules = {
  examName: [
    { required: true, message: '请输入考试名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  examType: [
    { required: true, message: '请选择考试类型', trigger: 'change' }
  ],
  startTime: [
    { required: true, message: '请选择开始日期时间', trigger: 'change' }
  ],
  endTime: [
    { required: true, message: '请选择结束日期时间', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择考试状态', trigger: 'change' }
  ]
}

// 格式化日期
const formatDate = (dateStr: string | null | Date) => {
  if (!dateStr) return 'N/A';
  return dayjs(dateStr).format('YYYY-MM-DD');
}

// 格式化日期时间
const formatDateTime = (dateTimeStr: string | null | Date) => {
  if (!dateTimeStr) return 'N/A';
  return dayjs(dateTimeStr).format('YYYY-MM-DD HH:mm:ss');
}

// 获取考试类型标签样式
const getExamTypeTag = (type: string | null | undefined): '' | 'success' | 'info' | 'warning' | 'danger' => {
  if (!type) return 'info';
  if (type.includes('期末')) return 'danger';
  if (type.includes('期中')) return 'warning';
  if (type.includes('月考')) return 'success';
  return 'info';
}

// 获取状态类型
const getStatusType = (status: number | null | undefined): 'info' | 'primary' | 'success' | 'warning' | 'danger' => {
  switch (status) {
    case 0: return 'info';
    case 1: return 'primary';
    case 2: return 'success';
    default: return 'info';
  }
}

// 获取状态文本
const getStatusText = (status: number | null | undefined) => {
  switch (status) {
    case 0: return '未开始';
    case 1: return '进行中';
    case 2: return '已结束';
    default: return '未知';
  }
}

// 筛选变化处理
const handleFilterChange = () => {
  currentPage.value = 1;
  fetchExamList();
}

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1;
  fetchExamList();
}

// 获取考试列表
const fetchExamList = async () => {
  loading.value = true;
  try {
    const params: ExamQueryParams = {
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value,
      examType: filterExamType.value,
      startDate: dateRange.value ? dateRange.value[0] : undefined,
      endDate: dateRange.value ? dateRange.value[1] : undefined,
      status: statusFilter.value || undefined
    };
    
    const res = await getExamList(params);
    console.log('考试列表API响应:', res);
    
    if (res.code === 200 && res.data && Array.isArray(res.data.list)) {
      examList.value = res.data.list.map(item => ({
        id: item.id,
        examName: item.exam_name,
        examType: item.exam_type,
        startTime: item.exam_date,
        endTime: item.end_time || '',
        status: item.status || 0,
        description: item.description || null,
        createTime: item.create_time ? dayjs(item.create_time).format('YYYY-MM-DD HH:mm:ss') : '',
        duration: item.duration || 0,
        subjects: item.subjects ? (Array.isArray(item.subjects) ? item.subjects : item.subjects.split(',')) : []
      }));
      total.value = res.data.total || res.data.list.length;
    } else {
      ElMessage.warning(res.message || '获取考试列表失败');
      examList.value = [];
      total.value = 0;
    }
  } catch (error: any) {
    console.error('获取考试列表失败:', error);
    ElMessage.error(error.message || '获取考试列表失败');
    examList.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

// 获取动态考试类型选项
const fetchExamTypes = async () => {
  examTypeLoading.value = true;
  try {
    const res = await getExamTypes();
    if (res.code === 200 && Array.isArray(res.data)) {
      // 将从后端获取的类型列表赋值给 ref
      dynamicExamTypeOptions.value = res.data;
      console.log('成功获取动态考试类型:', dynamicExamTypeOptions.value);
    } else {
      ElMessage.warning(res.message || '获取考试类型选项失败');
      dynamicExamTypeOptions.value = []; // 清空以防万一
    }
  } catch (error: any) {
    console.error('获取考试类型选项失败 (catch):', error);
    ElMessage.error(error.message || '获取考试类型选项失败');
    dynamicExamTypeOptions.value = []; // 清空
  } finally {
    examTypeLoading.value = false;
  }
};

// 新增考试
const handleAddExam = () => {
  isEditMode.value = false
  resetForm()
  dialogVisible.value = true
}

// 编辑考试
const handleEditExam = (row: ExamItem) => {
  isEditMode.value = true
  dialogVisible.value = true
  
  // 将 ExamItem 数据填充到 examForm
  examForm.value = {
    id: row.id,
    examName: row.examName,
    examType: row.examType,
    startTime: row.startTime, // 使用 startTime
    endTime: row.endTime, // 使用 endTime
    status: row.status,
    description: row.description, // 使用 description
    createTime: row.createTime // 填充 createTime
    // 移除 examDate, duration, subjects, remark
  }
  console.log('编辑考试, 表单数据:', examForm.value)
}

// 删除考试
const handleDeleteExam = async (row: ExamItem) => {
  if (!row.id) {
    ElMessage.warning('无效的考试ID')
    return
  }
  
  ElMessageBox.confirm(
    `确定要删除考试 "${row.examName}" 吗？此操作不可恢复。`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res = await deleteExam(row.id!)
      
      if (res.code === 200) {
        ElMessage.success('删除成功')
        
        // 从列表中移除
        examList.value = examList.value.filter(item => item.id !== row.id)
        
        // 如果当前页没有数据了，且不是第一页，则回到上一页
        if (examList.value.length === 0 && currentPage.value > 1) {
          currentPage.value--
          fetchExamList()
        }
      } else {
        ElMessage.error(res.message || '删除失败')
      }
    } catch (error) {
      console.error('删除考试失败:', error)
      ElMessage.error('删除考试失败')
      
      // 开发环境下模拟成功
      if (import.meta.env.DEV) {
        ElMessage.success('模拟删除成功')
        examList.value = examList.value.filter(item => item.id !== row.id)
      }
    }
  }).catch(() => {
    // 用户取消操作
  })
}

// 重置表单
const resetForm = () => {
  examForm.value = {
    id: 0,
    examName: '',
    examType: '',
    startTime: '',
    endTime: '',
    status: 0,
    description: null,
    createTime: ''
  }
}

// 处理对话框关闭 - 添加这个函数
const handleDialogClose = () => {
  console.log('Exam dialog closed');
  // Add any cleanup logic here if needed, like resetting validation
  formRef.value?.clearValidate(); // Example: clear validation on close
};

// 提交表单
const submitExamForm = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitLoading.value = true

    // 准备提交的数据
    const backendData = {
      id: examForm.value.id || undefined,
      exam_name: examForm.value.examName,
      exam_type: examForm.value.examType,
      start_time: examForm.value.startTime,
      end_time: examForm.value.endTime,
      status: examForm.value.status,
      description: examForm.value.description
    }

    let res: ApiResponse<any>;
    if (isEditMode.value) {
      // Add check for valid ID before calling updateExam
      if (typeof backendData.id !== 'number' || backendData.id <= 0) {
        ElMessage.error('无效的考试ID，无法更新');
        submitLoading.value = false;
        return;
      }
      res = await updateExam(backendData.id, backendData)
    } else {
      const addData = { ...backendData };
      delete addData.id;
      res = await addExam(addData)
    }

    if (res?.code === 200 || res?.code === 201) {
      ElMessage.success(isEditMode.value ? '更新成功' : '创建成功')
      dialogVisible.value = false
      fetchExamList()
    } else {
      ElMessage.error(res?.message || (isEditMode.value ? '更新失败' : '创建失败'))
    }
  } catch (error: any) {
    console.error(isEditMode.value ? '更新考试失败:' : '创建考试失败:', error)
    const errorMsg = error.response?.data?.message || error.message || (isEditMode.value ? '更新失败' : '创建失败')
    ElMessage.error(errorMsg)
  } finally {
    submitLoading.value = false
  }
}

// 发布/取消发布考试
const handlePublish = async (id: number, status: number) => {
  try {
    console.log(`${status === 1 ? '发布' : '取消发布'}考试, ID:`, id);
    
    const response = status === 1 
      ? await publishExam(id)
      : await unpublishExam(id);
    
    console.log('发布/取消发布响应:', response);
    
    if (response.code === 200) {
      ElMessage.success(status === 1 ? '发布成功' : '取消发布成功');
      await fetchExamList();
    } else {
      ElMessage.error(response.message || (status === 1 ? '发布失败' : '取消发布失败'));
    }
  } catch (error) {
    console.error('发布/取消发布异常:', error);
    ElMessage.error(status === 1 ? '发布考试失败' : '取消发布考试失败');
  }
}

// 修改考试状态
const handleStatusChange = async (exam: ExamItem) => {
  try {
    const examDate = new Date(exam.startTime);
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    if (examDate < now) {
      ElMessage.warning('考试已结束，无法修改状态');
      return;
    }

    if (examDate <= threeDaysFromNow) {
      await ElMessageBox.confirm(
        '考试即将开始，确定要修改状态吗？',
        '警告',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      );
    }

    const newStatus = exam.status === 0 ? 1 : 0;
    const res = await updateExamStatus(exam.id, newStatus);
    
    if (res.code === 200) {
      ElMessage.success('状态更新成功');
      await fetchExamList();
    } else {
      ElMessage.error(res.message || '状态更新失败');
    }
  } catch (error: any) {
    if (error?.toString().includes('cancel')) {
      return;
    }
    console.error('状态更新失败:', error);
    ElMessage.error('状态更新失败');
  }
}

// 页面初始化
onMounted(async () => {
  await fetchExamList();
  await fetchExamTypes();
  console.log('考试管理页面初始化完成，已启用筛选功能');
})
</script>

<style lang="scss" scoped>
/* Dark mode overrides for exam management page */
html.dark .exam-container {
  /* background is likely handled by dark-overrides.css for .exam-container */
}

/* Specific rule for .page-header-area in dark mode */
html.dark .page-header-area {
  background-color: #263445 !important;
  border: 1px solid #263445 !important; /* Border color matches background */
  color: #d1d5db !important;
}

/* General card rules */
html.dark .filter-card,
html.dark .table-card,
html.dark .exam-list-card { /* .exam-list-card was added for consistency */
  background-color: #263445 !important; /* Card background */
  border: 1px solid #263445 !important; /* Border color matches background */
  color: #d1d5db !important; /* Default text color for card content */
}

html.dark .page-header-area .header-title, /* Target title within .page-header-area */
html.dark .page-header-area .header-desc, /* Target description within .page-header-area */
html.dark .filter-card .card-header span,
html.dark .table-card .card-header span,
html.dark .exam-list-card .list-header span { /* Added for .exam-list-card title */
  color: #f3f4f6 !important; /* Lighter text for titles */
}

/* Page Header specific styles for light mode */
.page-header-area {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: var(--el-card-bg-color, var(--el-bg-color-overlay));
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid var(--el-border-color-lighter);
  transition: background-color 0.3s, border-color 0.3s;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-title {
  font-size: 22px;
  font-weight: bold;
  color: var(--el-text-color-primary);
  margin: 0;
}

.header-desc {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

/* Filter Card */
.filter-card {
  margin-bottom: 20px;
  background-color: var(--el-card-bg-color, var(--el-bg-color-overlay));
  border: 1px solid var(--el-border-color-lighter);
  transition: background-color 0.3s, border-color 0.3s;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.filter-content {
  display: grid;
  grid-template-columns: 1fr 1fr; /* Adjust based on content */
  gap: 30px;
  padding: 10px 0;
}

.search-section, .filter-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  margin-bottom: 5px;
}

.filter-layout {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.filter-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.filter-item {
  width: 100%;
}

.date-picker-full-width {
  width: 100%;
}

/* Adjust grid for single column on smaller screens if needed */
@media (max-width: 992px) {
  .filter-content {
    grid-template-columns: 1fr;
  }
  .filter-row {
    grid-template-columns: 1fr; /* Stack filters on smaller screens */
  }
}

.filter-results {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px dashed var(--el-border-color-lighter);
}

.results-info {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-bottom: 10px;
}
.results-info strong {
  color: var(--el-color-primary);
}

.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

/* Exam List Card */
.exam-list-card {
  background-color: var(--el-card-bg-color, var(--el-bg-color-overlay));
  border: 1px solid var(--el-border-color-lighter);
  transition: background-color 0.3s, border-color 0.3s;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  color: var(--el-text-color-primary);
}
.data-count {
  font-size: 14px;
  font-weight: normal;
  color: var(--el-text-color-secondary);
}

/* Exam table specific styles */
.exam-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.operation-buttons {
  display: flex;
  justify-content: center; /* Center buttons in the cell */
  gap: 10px;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  background-color: var(--el-bg-color-overlay);
  padding: 10px 15px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

/* Dialog Styles */
.dark :deep(.el-dialog) {
  background-color: #263445;
}
.dark :deep(.el-dialog__header) {
  color: #E0E0E0;
}
.dark :deep(.el-dialog__title) {
   color: #E0E0E0;
}
.dark :deep(.el-dialog__body) {
  color: var(--el-text-color-primary); 
  background-color: #2c3e50; /* Darker background for body */
}
.dark :deep(.el-dialog__footer) {
  background-color: #2c3e50; /* Darker background for footer */
}

.dark :deep(.el-form-item__label) {
  color: #C0C0C0;
}

.dark :deep(.el-transfer-panel) {
  background-color: #374151;
  border-color: var(--el-border-color-darker);
}
.dark :deep(.el-transfer-panel__header) {
   background-color: #4b5563;
   color: #E0E0E0;
}

.dark :deep(.el-transfer-panel .el-checkbox__label) {
   color: #C0C0C0;
}
.dark :deep(.el-transfer-panel .el-checkbox__input.is-checked .el-checkbox__inner) {
   background-color: var(--el-color-primary);
   border-color: var(--el-color-primary);
}

/* Remove specific dark-component-bg rules */

.operation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap; /* Allow wrapping on smaller screens */
  gap: 10px; /* Add gap between items */

  .filter-items {
    display: flex;
    flex-wrap: wrap; /* Allow filter items to wrap */
    gap: 10px;
    align-items: center;
  }
}
</style> 