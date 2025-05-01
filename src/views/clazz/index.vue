<template>
  <div class="class-container">
    <!-- 头部搜索和操作区 -->
    <div class="operation-header">
      <el-input
        v-model="searchKey"
        placeholder="搜索班级名称..."
        class="search-input"
        clearable>
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      
      <div class="operation-buttons">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>新增班级
        </el-button>
        <el-upload
          :action="''" 
          :show-file-list="false"
          :before-upload="beforeUpload"
          :http-request="handleImportRequest" 
          accept=".xlsx, .xls, .csv"
          style="margin: 0 10px;"> 
          <el-button type="warning">
            <el-icon><Upload /></el-icon>导入数据
          </el-button>
        </el-upload>
        <el-button type="success" @click="handleExport">
          <el-icon><Download /></el-icon>导出数据
        </el-button>
      </div>
    </div>

    <!-- 班级数据表格 -->
    <el-table
      :data="filteredTableData"
      stripe
      border
      highlight-current-row
      class="class-table"
      v-loading="loading">
      <el-table-column type="index" label="#" width="60" align="center" />
      <el-table-column prop="className" label="班级名称" min-width="150">
        <template #default="{ row }">
          <el-tag>{{ row.className }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="teacher" label="班主任" min-width="120" />
      <el-table-column prop="studentCount" label="学生人数" width="100" align="center">
        <template #default="{ row }">
          <el-badge :value="row.studentCount" :type="row.studentCount > 30 ? 'danger' : 'success'" />
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" min-width="180" />
      <el-table-column prop="description" label="班级描述" min-width="200" show-overflow-tooltip />
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button-group>
            <el-button type="primary" @click="handleEdit(row)" :icon="Edit" circle />
            <el-button type="danger" @click="handleDelete(row)" :icon="Delete" circle />
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页器 -->
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[10, 20, 30, 50]"
      layout="total, sizes, prev, pager, next, jumper"
      class="pagination" />

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增班级' : '编辑班级'"
      width="500px">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px">
        <el-form-item label="班级名称" prop="className">
          <el-input v-model="formData.className" />
        </el-form-item>
        <el-form-item label="班主任" prop="teacher">
          <el-input v-model="formData.teacher" />
        </el-form-item>
        <el-form-item label="班级描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 班级详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="班级详情"
      width="700px">
      <div v-if="currentClass" class="class-detail">
        <!-- 班级基本信息卡片 -->
        <el-card class="info-card">
          <template #header>
            <div class="card-header">
              <span>基本信息</span>
            </div>
          </template>
          <div class="info-content">
            <div class="info-item">
              <span class="info-label">班级名称：</span>
              <span class="info-value">{{ currentClass.className }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">班主任：</span>
              <span class="info-value">{{ currentClass.teacher }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">学生人数：</span>
              <span class="info-value">
                <el-tag :type="currentClass.studentCount > 30 ? 'danger' : 'success'">
                  {{ currentClass.studentCount }}人
                </el-tag>
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">创建时间：</span>
              <span class="info-value">{{ currentClass.createTime }}</span>
            </div>
            <div class="info-item" v-if="currentClass.description">
              <span class="info-label">描述：</span>
              <span class="info-value description">{{ currentClass.description }}</span>
            </div>
          </div>
        </el-card>
        
        <!-- 学生列表卡片 -->
        <el-card class="student-card">
          <template #header>
            <div class="card-header">
              <span>班级学生</span>
              <div>
                <el-input
                  v-model="studentSearchKey"
                  placeholder="搜索学生..."
                  prefix-icon="Search"
                  clearable
                  size="small"
                  style="width: 200px"
                />
              </div>
            </div>
          </template>
          <el-table
            :data="filteredStudents"
            stripe
            border
            style="width: 100%"
            max-height="300"
            v-loading="studentLoading"
          >
            <el-table-column type="index" label="#" width="60" align="center" />
            <el-table-column prop="name" label="姓名" width="120">
              <template #default="{ row }">
                <span :style="{ color: row.gender === '男' ? '#409EFF' : '#F56C6C' }">
                  {{ row.name }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="studentId" label="学号" width="120" />
            <el-table-column prop="gender" label="性别" width="80" align="center">
              <template #default="{ row }">
                <el-icon :color="row.gender === '男' ? '#409EFF' : '#F56C6C'">
                  <component :is="row.gender === '男' ? 'Male' : 'Female'" />
                </el-icon>
              </template>
            </el-table-column>
            <el-table-column prop="phone" label="联系电话" min-width="130" />
            <el-table-column prop="email" label="邮箱" min-width="180" />
          </el-table>
          <div v-if="!classStudents.length && !studentLoading" class="empty-data">
            暂无学生数据
          </div>
        </el-card>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import type { FormInstance, FormRules, UploadRequestOptions } from 'element-plus'
import { Delete, Edit, Plus, Search, View, Download, Male, Female, Upload } from '@element-plus/icons-vue'
import { getClassList, addClass, updateClass, deleteClass, importClasses } from '@/api/class'
import type { ClassItem, ApiResponse } from '@/types/common'
import { exportToExcel } from '@/utils/export'
import dayjs from 'dayjs'
import type { StudentItem } from '@/types/student'
import { getStudentList } from '@/api/student'

// 表单数据类型
interface ClassFormData {
  id?: number
  className: string
  teacher: string
  description?: string | null
}

// 后端返回的班级数据类型
interface ClassItemResponse {
  id: number
  className: string
  teacher: string
  studentCount: number
  description: string | null
  createTime: string
}

// 基础数据状态
const loading = ref(false)
const searchKey = ref('')
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance>()
const tableData = ref<ClassItem[]>([])

// 分页数据
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 表单数据
const formData = reactive<ClassFormData>({
  className: '',
  teacher: '',
  description: null
})

// 表单验证规则
const rules = reactive<FormRules>({
  className: [
    { required: true, message: '请输入班级名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  teacher: [
    { required: true, message: '请输入班主任', trigger: 'blur' }
  ]
})

// 数据转换方法
const mapResponseToClassItem = (item: ClassItemResponse): ClassItem => ({
  id: item.id,
  className: item.className || '',
  teacher: item.teacher || '',
  studentCount: item.studentCount || 0,
  description: item.description || '',
  createTime: item.createTime ? dayjs(item.createTime).format('YYYY-MM-DD HH:mm:ss') : 'N/A'
})

// 获取班级列表
const fetchData = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      className: searchKey.value,
      teacher: '',
    };
    const res = await getClassList(params);
    console.log('获取到的班级数据:', res); // 添加日志
    
    if (res && res.code === 200 && Array.isArray(res.data)) {
      tableData.value = res.data.map((item: any): ClassItem => {
        // 确保所有字段都有默认值
        return {
          id: item.id || 0,
          className: item.class_name || item.className || '',
          studentCount: item.student_count || item.studentCount || 0,
          teacher: item.teacher || '',
          createTime: item.create_time ? dayjs(item.create_time).format('YYYY-MM-DD HH:mm:ss') : 
                    item.createTime ? dayjs(item.createTime).format('YYYY-MM-DD HH:mm:ss') : 
                    'N/A',
          description: item.description || ''
        };
      });
      total.value = res.data.length;
    } else {
      ElMessage.warning(res?.message || '获取班级列表失败');
      tableData.value = [];
      total.value = 0;
    }
  } catch (error: any) {
    console.error('获取班级列表失败:', error);
    ElMessage.error(error.response?.data?.message || error.message || '获取班级列表失败');
    tableData.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

// 生成模拟数据
const generateMockData = () => {
  const mockData: ClassItem[] = [];
  const classTypes = ['计算机科学', '软件工程', '人工智能', '大数据', '网络安全'];
  const teacherNames = ['张老师', '李老师', '王老师', '赵老师', '刘老师'];
  
  for (let i = 0; i < 20; i++) {
    const classType = classTypes[Math.floor(Math.random() * classTypes.length)];
    const classNum = Math.floor(Math.random() * 10) + 1;
    const year = 2020 + Math.floor(Math.random() * 5);
    const createTime = new Date(year, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleString('zh-CN');
    
    mockData.push({
      id: i + 1,
      className: `${classType}${year}0${classNum}班`,
      studentCount: Math.floor(Math.random() * 20) + 20,
      teacher: teacherNames[Math.floor(Math.random() * teacherNames.length)],
      createTime,
      description: `${year}年${classType}专业${classNum}班`
    });
  }
  
  tableData.value = mockData;
  total.value = mockData.length;
  console.log('生成的模拟数据:', mockData);
};

// 筛选数据
const filteredTableData = computed(() => {
  if (!searchKey.value) return tableData.value;
  
  const searchText = searchKey.value.toLowerCase();
  
  return tableData.value.filter(item => {
    // 添加空值检查
    const classNameMatch = item.className && searchText ? 
      item.className.toString().toLowerCase().includes(searchText) : 
      false;
    
    const teacherMatch = item.teacher && searchText ? 
      item.teacher.toString().toLowerCase().includes(searchText) : 
      false;
    
    return classNameMatch || teacherMatch;
  });
})

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      // Define backend data structure inline
      const backendData: {
        class_name: string;
        teacher?: string;
        description?: string;
      } = {
        class_name: formData.className,
        teacher: formData.teacher || undefined,
        description: formData.description || undefined,
      };

      try {
        let res: ApiResponse<any>; // Define res type
        if (dialogType.value === 'add') {
          res = await addClass(backendData as any); // Use 'as any' if addClass expects ClassItem and conversion is complex
        } else {
          res = await updateClass(formData.id!, backendData as any); // Use 'as any' similarly
        }

        // 检查后端返回的 code
        // 后端添加成功返回 201, 更新成功返回 200
        const successAdd = dialogType.value === 'add' && res?.code === 201;
        const successUpdate = dialogType.value === 'edit' && res?.code === 200;

        if (successAdd || successUpdate) {
          // 确保使用 ElMessage.success
          ElMessage.success(dialogType.value === 'add' ? '添加成功' : '修改成功'); 
          dialogVisible.value = false;
          await fetchData(); // Refresh data
        } else {
          // 如果 code 不是预期的成功代码，也显示错误
          ElMessage.error(res?.message || '操作失败，返回码：' + res?.code);
        }
      } catch (error: any) {
        console.error('操作失败:', error);
        ElMessage.error(error.response?.data?.message || error.message || '操作失败');
      } finally {
        loading.value = false;
      }
    }
  });
};

// 处理新增
const handleAdd = () => {
  dialogType.value = 'add'
  dialogVisible.value = true
  if (formRef.value) {
    formRef.value.resetFields()
  }
  // 重置表单数据
  formData.className = ''
  formData.teacher = ''
  formData.description = null
}

// 处理编辑
const handleEdit = (row: ClassItem) => {
  dialogType.value = 'edit'
  dialogVisible.value = true
  // 使用类型安全的方式赋值
  Object.assign(formData, {
    id: row.id,
    className: row.className,
    teacher: row.teacher,
    studentCount: row.studentCount,
    description: row.description
  })
}

// 处理删除
const handleDelete = async (row: ClassItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除班级 ${row.className} 吗？`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    loading.value = true;
    // deleteClass returns Promise<ApiResponse<void>>
    const res = await deleteClass(row.id);
    // Check res.code directly (assuming structure { code: number, message?: string })
    if (res?.code === 200) {
      ElMessage.success('删除成功');
      await fetchData(); // Refresh data
    } else {
      ElMessage.error(res?.message || '删除失败');
    }
  } catch (error: any) {
    // Handle cancellation separately
    if (typeof error === 'string' && error.includes('cancel')) {
      ElMessage.info('已取消删除');
    } else {
      console.error('删除失败:', error);
      // Use error message from response if available
      ElMessage.error(error.response?.data?.message || error.message || '删除失败');
    }
  } finally {
    loading.value = false;
  }
};

// 导出数据
const handleExport = () => {
  const exportData = tableData.value.map(item => ({
    '班级名称': item.className,
    '班主任': item.teacher,
    '学生人数': item.studentCount,
    '班级描述': item.description,
    '创建时间': item.createTime
  }));
  
  exportToExcel(exportData, `班级数据_${new Date().toLocaleDateString()}`);
  ElMessage.success('导出成功');
};

// 班级详情相关
const detailDialogVisible = ref(false)
const currentClass = ref<ClassItem | null>(null)
const classStudents = ref<StudentItem[]>([])
const studentSearchKey = ref('')
const studentLoading = ref(false)

// Filtered students (ensure student has name/studentId)
const filteredStudents = computed(() => {
  if (!studentSearchKey.value) return classStudents.value;
  const searchText = studentSearchKey.value.toLowerCase();
  return classStudents.value.filter(student => 
    (student.name && student.name.toLowerCase().includes(searchText)) ||
    (student.studentId && String(student.studentId).toLowerCase().includes(searchText))
  );
});

// Handle detail view
const handleDetail = async (row: ClassItem) => {
  currentClass.value = row
  detailDialogVisible.value = true
  await fetchClassStudents(row.className); // Pass className for filtering
};

// Fetch students for the selected class
const fetchClassStudents = async (className: string) => {
  try {
    studentLoading.value = true;
    classStudents.value = [];
    
    // Call getStudentList with className filter
    // Pass a high limit or handle pagination if necessary
    const params = { className: className, page: 1, pageSize: 9999 }; 
    const res = await getStudentList(params);
    
    console.log(`Students API response for class ${className}:`, res);

    if (res.code === 200 && Array.isArray(res.data)) {
      // Assuming res.data is an array of StudentItemResponse
      // Map backend response (snake_case) to frontend (camelCase)
      classStudents.value = res.data.map((s: any): StudentItem => ({
        id: s.id,
        studentId: s.student_id,
        name: s.name,
        gender: s.gender,
        className: s.class_name, // Use class_name from student data
        phone: s.phone,
        email: s.email,
        joinDate: s.join_date ? dayjs(s.join_date).format('YYYY-MM-DD') : '',
        // Add other fields if available in StudentItemResponse and needed
      }));
    } else {
      ElMessage.warning(res.message || '获取班级学生列表失败');
    }
  } catch (error: any) { 
    console.error('获取班级学生失败:', error);
    ElMessage.error(error.response?.data?.message || error.message || '获取班级学生失败');
  } finally {
    studentLoading.value = false;
  }
};

// 导入文件上传处理
const beforeUpload = (file: File) => {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'application/vnd.ms-excel';
  const isCsv = file.type === 'text/csv';
  const isLt10M = file.size / 1024 / 1024 < 10;

  if (!isExcel && !isCsv) {
    ElMessage.error('上传文件只能是 Excel 或 CSV 格式!');
    return false;
  }
  if (!isLt10M) {
    ElMessage.error('上传文件大小不能超过 10MB!');
    return false;
  }
  loading.value = true; // 开始加载状态
  return true;
}

const handleImportRequest = async (options: UploadRequestOptions) => {
  try {
    const res = await importClasses(options.file);
    console.log("Class Import API Response:", res);
    if (res.code === 200) {
       let notificationMessage = `${res.message || '导入成功'}`;
       if (res.data && res.data.errors && res.data.errors.length > 0) {
           let errorDetails = res.data.errors.map((err: any) => `行 ${err.row}: ${err.error || err.errors?.join(', ') || '未知错误'}`).join('<br>');
           (ElNotification as any)({ // 使用 ElNotification 显示更详细信息
              title: '导入完成（部分成功）',
              dangerouslyUseHTMLString: true,
              message: `${notificationMessage}<br>以下行未成功导入或更新：<br>${errorDetails}`,
              type: 'warning',
              duration: 0 // 不自动关闭
            });
       } else {
           ElMessage.success(notificationMessage);
       }
       await fetchData(); // 成功后刷新列表
    } else {
        handleImportError(res); // 处理API返回的业务错误
    }
  } catch (error: any) {
      console.error('Class Import error caught:', error);
      handleImportError(error); // 处理网络或其他错误
  } finally {
    loading.value = false; // 结束加载状态
  }
}

// 统一处理导入错误
const handleImportError = (error: any) => {
  loading.value = false;
  let title = '导入失败';
  let message = '发生未知错误';

  // 尝试提取错误信息
  if (error && error.message) {
    message = error.message;
  } else if (error && error.response && error.response.data && error.response.data.message) {
    // 兼容 Axios 错误结构
    message = error.response.data.message;
  } else if (typeof error === 'string') {
    message = error;
  }
  
  // 检查是否有详细的行错误信息
  const validationErrors = error?.data?.errors || error?.response?.data?.data?.errors;
  if (validationErrors && Array.isArray(validationErrors) && validationErrors.length > 0) {
    title = '导入失败（数据校验错误）';
    message = `文件中有 ${validationErrors.length} 行数据格式错误，请修正后重试。`;
    let errorDetails = validationErrors.map((err: any) => `行 ${err.row}: ${err.error || err.errors?.join(', ') || '未知错误'}`).join('<br>');
      (ElNotification as any)({
        title: title,
        dangerouslyUseHTMLString: true,
        message: `${message}<br>错误详情:<br>${errorDetails}`,
        type: 'error',
        duration: 0
      });
      return; // 使用 Notification 后不再显示 Message
  }

  // 如果没有详细错误，显示通用错误消息
  ElMessage.error(`${title}: ${message}`);
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.class-container {
  padding: 20px;
  background-color: var(--el-bg-color-page);
  min-height: calc(100vh - 84px); /* Adjust based on layout */
  transition: background-color 0.3s;
}

.operation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap; /* Allow wrapping */
  gap: 10px;
}

.filter-items {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.search-input {
  width: 250px;
}

.operation-buttons {
  display: flex;
  align-items: center;
  gap: 10px;
}

.class-table {
  width: 100%;
  margin-bottom: 20px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  background-color: var(--el-bg-color-overlay); /* Light mode background */
  padding: 10px 15px;
  border-radius: 4px;
  margin-top: 20px;
  transition: background-color 0.3s;
}

/* Styles for Detail Dialog */
.class-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card,
.student-card {
  border: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-card-bg-color, var(--el-bg-color-overlay));
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.info-content {
  padding: 10px 0;
}

.info-item {
  margin-bottom: 10px;
  font-size: 14px;
}

.info-label {
  color: var(--el-text-color-secondary);
  display: inline-block;
  width: 80px; /* Adjust as needed */
  text-align: right;
  margin-right: 10px;
}

.info-value {
  color: var(--el-text-color-primary);
}

.info-value.description {
  white-space: pre-wrap; /* Keep formatting */
  line-height: 1.5;
}

.empty-data {
  text-align: center;
  color: var(--el-text-color-placeholder);
  padding: 20px;
}

/* Remove specific dark-component-bg rules */

.dark .class-table {
  /* Add specific table dark styles here if needed */
}

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
}

</style>