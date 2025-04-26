<template>
  <div class="student-container">
    <!-- 头部搜索和操作区 -->
    <div class="operation-header" :class="{ 'dark-component-bg': isDark }">
      <el-input
        v-model="searchKey"
        placeholder="搜索学号/姓名..."
        class="search-input"
        clearable>
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      
      <div class="operation-buttons">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>新增学生
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

    <!-- 学生数据表格 -->
    <el-table
      :data="paginatedStudentList"
      stripe
      border
      highlight-current-row
      class="student-table"
      v-loading="loading">
      <el-table-column type="index" label="#" width="60" align="center" />
      <el-table-column prop="studentId" label="学号" width="120" align="center" />
      <el-table-column prop="name" label="姓名" min-width="120">
        <template #default="{ row }">
          <el-tag :type="row.gender === '男' ? 'primary' : 'success'" class="name-tag">
            {{ row.name }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="className" label="所属班级" min-width="150" />
      <el-table-column prop="gender" label="性别" width="80" align="center">
        <template #default="{ row }">
          <el-icon :color="row.gender === '男' ? '#409EFF' : '#67C23A'">
            <Male v-if="row.gender === '男'" />
            <Female v-else />
          </el-icon>
          {{ row.gender }}
        </template>
      </el-table-column>
      <el-table-column prop="phone" label="联系电话" min-width="130" />
      <el-table-column prop="email" label="邮箱" min-width="200" />
      <el-table-column prop="joinDate" label="入学时间" min-width="180" />
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
      v-model:current-page="pagination.currentPage"
      v-model:page-size="pagination.pageSize"
      :total="pagination.total"
      :page-sizes="[10, 20, 30, 50]"
      layout="total, sizes, prev, pager, next, jumper"
      class="pagination"
      :class="{ 'dark-component-bg': isDark }" />

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增学生' : '编辑学生'"
      width="600px">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px">
        <el-form-item label="学号" prop="studentId">
          <el-input 
            v-model="formData.studentId" 
            :disabled="isEdit"
            placeholder="系统自动生成" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="formData.name" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="formData.gender">
            <el-radio value="男">男</el-radio>
            <el-radio value="女">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="所属班级" prop="className">
          <el-select v-model="formData.className" placeholder="请选择班级">
            <el-option v-for="item in classList" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="formData.phone" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" />
        </el-form-item>
        <el-form-item label="入学时间" prop="joinDate">
          <el-date-picker
            v-model="formData.joinDate"
            type="date"
            value-format="YYYY-MM-DD"
            format="YYYY-MM-DD"
            placeholder="选择日期" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { useDark } from '@vueuse/core'
import { getStudentList, addStudent, updateStudent, deleteStudent, getMaxStudentId, importStudents } from '@/api/student'
import { Delete, Edit, Plus, Search, Download, Male, Female, Upload } from '@element-plus/icons-vue'
import type { FormInstance, FormRules, UploadRequestOptions } from 'element-plus'
import { exportToExcel } from '@/utils/export'
import { getClassList } from '@/api/class'
import type { StudentItem, StudentItemResponse, StudentSubmitData, ClassItemResponse, ApiResponse } from '@/types/common'
import type { Pagination } from '@/types/response'
import dayjs from 'dayjs'

// Dark mode state for conditional class binding
const isDark = useDark()

// 新增：班级选项列表
const classList = ref<string[]>([])

// 表单数据类型
interface StudentFormData {
  id?: number
  studentId: string
  name: string
  gender: string
  className: string
  phone: string
  email: string
  joinDate: string
}

// 表单验证规则
const rules = reactive<FormRules>({
  studentId: [
    { required: true, message: '请输入学号', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 10, message: '长度在 2 到 10 个字符', trigger: 'blur' }
  ],
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ],
  className: [
    { required: true, message: '请选择班级', trigger: 'change' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  joinDate: [
    { required: true, message: '请选择入学时间', trigger: 'change' }
  ]
})

// 表单数据初始化
const formData = reactive<StudentFormData>({
  studentId: '',
  name: '',
  gender: '男',
  className: '',
  phone: '',
  email: '',
  joinDate: ''
})

// 数据状态
const loading = ref(false)
const searchKey = ref('')
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const tableData = ref<StudentItem[]>([])
const formRef = ref<FormInstance>()

// 分页数据
const pagination = reactive<Pagination>({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 获取学生列表
const fetchData = async () => {
  try {
    loading.value = true
    console.log('开始获取学生列表...')
    const res = await getStudentList()
    console.log('学生列表API响应:', res)
    
    if (res && res.code === 200 && Array.isArray(res.data)) {
      // Handle API response data (res.data is the array)
      tableData.value = res.data.map((item: StudentItemResponse): StudentItem => {
        // Process join date format
        let joinDateDisplay = item.join_date;
        try {
          if (item.join_date) {
            // 使用 dayjs 处理日期，保持原始日期不变
            joinDateDisplay = dayjs(item.join_date).format('YYYY-MM-DD');
          }
        } catch (e) {
          console.error('日期转换错误:', e);
          joinDateDisplay = item.join_date;
        }

        return {
        id: item.id,
        studentId: item.student_id,
        name: item.name,
        gender: item.gender,
          className: item.class_name,
        phone: item.phone || '',
        email: item.email || '',
          joinDate: joinDateDisplay,
          createTime: item.create_time ? dayjs(item.create_time).format('YYYY-MM-DD HH:mm:ss') : '未知'
        }
      })
      
      // Update pagination total based on the actual data length
      pagination.total = res.data.length // Use res.data.length
      console.log('成功获取学生数据:', tableData.value)
    } else {
      // Log the actual response if the structure is unexpected
      console.warn('学生列表API响应格式不正确或 code !== 200:', res)
      // Removed generateMockData() call to avoid confusion
      // generateMockData()
      ElMessage.warning(res?.message || '获取学生数据失败'); // Show API message or default
      tableData.value = []; // Clear table data on error
      pagination.total = 0;
    }
  } catch (error) {
    console.error('获取学生列表失败:', error)
    ElMessage.warning('获取学生数据失败，使用模拟数据')
    generateMockData()
  } finally {
    loading.value = false
  }
}

// 1. Renamed computed property for filtering
const filteredStudentList = computed(() => {
  return tableData.value.filter(item => {
    // Add null/undefined checks for robustness
    const searchLower = searchKey.value?.toLowerCase() || '';
    if (!searchLower) return true; // No search key, show all

    const studentIdMatch = item.studentId?.toString().toLowerCase().includes(searchLower);
    const nameMatch = item.name?.toLowerCase().includes(searchLower);
    
    return studentIdMatch || nameMatch;
  });
})

// 2. New computed property for pagination
const paginatedStudentList = computed(() => {
  const start = (pagination.currentPage - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  // Slice the *filtered* list
  return filteredStudentList.value.slice(start, end); 
});

// Watch filtered list to update total for pagination
watch(filteredStudentList, (newList) => {
  pagination.total = newList.length;
  // Optional: Reset to page 1 if filters change and current page becomes invalid
  if (pagination.currentPage > Math.ceil(newList.length / pagination.pageSize)) {
    pagination.currentPage = 1;
  }
});

// 生成下一个学号
const generateNextStudentId = async () => {
  try {
    console.log('获取最大学生ID...')
    const response = await getMaxStudentId()
    console.log('最大学生ID响应:', response)
    
    if (response.code === 200 && response.data) {
      // 确保取到的是字符串类型
      const maxIdStr = response.data.toString()
      const nextId = (parseInt(maxIdStr) + 1).toString()
      // 确保是7位数字
      formData.studentId = nextId.padStart(7, '0')
      console.log('生成的下一个学号:', formData.studentId)
    } else {
      // 如果获取失败，使用默认值
      formData.studentId = '2024001'
      console.log('使用默认学号:', formData.studentId)
    }
  } catch (error) {
    console.error('获取最大学号失败:', error)
    // 默认值
    formData.studentId = '2024001'
    console.log('获取失败，使用默认学号:', formData.studentId)
  }
}

// 处理新增
const handleAdd = async () => {
  dialogType.value = 'add'
  dialogVisible.value = true
  if (formRef.value) {
    formRef.value.resetFields()
    await generateNextStudentId()
  }
}

// 处理编辑
const handleEdit = (row: StudentFormData) => {
  dialogType.value = 'edit'
  dialogVisible.value = true
  Object.assign(formData, row)
}

// 处理删除
const handleDelete = async (row: StudentFormData) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除学生 ${row.name} 吗？`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    loading.value = true
    console.log(`开始删除学生，ID: ${row.id}`)
    const response = await deleteStudent(row.id!)
    console.log('删除学生响应:', response)
    
    if (response.code === 200) {
      ElMessage.success('删除成功')
      await fetchData() // 重新获取数据
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error: any) {
    if (error?.toString().includes('cancel')) {
      ElMessage.info('已取消删除')
    } else {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  } finally {
    loading.value = false
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        loading.value = true
        
        // 准备提交数据
        const submitData: StudentSubmitData = {
          id: formData.id,
          studentId: formData.studentId,
          name: formData.name,
          gender: formData.gender,
          className: formData.className,
          phone: formData.phone || '',
          email: formData.email || '',
          joinDate: formData.joinDate
        }
        
        console.log(`开始${dialogType.value === 'add' ? '添加' : '更新'}学生，数据:`, submitData)
        
        let response
        if (dialogType.value === 'add') {
          response = await addStudent(submitData)
          console.log('添加学生响应:', response)
        } else {
          response = await updateStudent(formData.id!, submitData)
          console.log('更新学生响应:', response)
        }
        
        if (response.code === 200 || response.code === 201) {
          ElMessage.success(dialogType.value === 'add' ? '新增成功' : '修改成功')
          dialogVisible.value = false
          await fetchData() // 重新获取数据
        } else {
          ElMessage.error(response.message || (dialogType.value === 'add' ? '新增失败' : '修改失败'))
        }
      } catch (error: any) {
        console.error(`${dialogType.value === 'add' ? '新增' : '修改'}失败:`, error)
        ElMessage.error(error.message || (dialogType.value === 'add' ? '新增失败' : '修改失败'))
      } finally {
        loading.value = false
      }
    }
  })
}

// 编辑时禁用学号修改
const isEdit = computed(() => dialogType.value === 'edit')

// 处理导出
const handleExport = () => {
  const exportData = tableData.value.map(item => ({
    '学号': item.studentId,
    '姓名': item.name,
    '性别': item.gender,
    '所属班级': item.className,
    '手机号': item.phone || '',
    '邮箱': item.email || '',
    '入学时间': item.joinDate
  }))
  
  exportToExcel(exportData, `学生数据_${new Date().toLocaleDateString()}`)
  ElMessage.success('导出成功')
}

// 获取班级列表
const fetchClassList = async () => {
  try {
    const res = await getClassList(); // 假设返回 ApiResponse<ClassItemResponse[]>
    console.log('Fetch class list response:', res);
    // 直接检查 res.code 和 res.data
    if (res && res.code === 200 && Array.isArray(res.data)) {
       // 确保使用 common.ts 的类型
      classList.value = res.data.map((item: ClassItemResponse) => item.class_name).filter(Boolean);
       console.log('Class list loaded:', classList.value);
    } else {
       // 直接访问 res.message
      ElMessage.warning(res?.message || '获取班级选项失败');
       classList.value = [];
    }
  } catch (error) {
    console.error('获取班级选项失败:', error);
    classList.value = [];
  }
};

// 数据转换函数
const convertToStudentItem = (item: StudentItemResponse): StudentItem => {
  const joinDateDisplay = item.join_date ? dayjs(item.join_date).format('YYYY-MM-DD') : '-';
  return {
    id: item.id,
    studentId: item.student_id,
    name: item.name,
    gender: item.gender,
    className: item.class_name,
    phone: item.phone || '',
    email: item.email || '',
    joinDate: joinDateDisplay,
    createTime: item.create_time ? dayjs(item.create_time).format('YYYY-MM-DD HH:mm:ss') : '-'
  }
}

// 生成模拟数据
const generateMockData = () => {
  const mockStudents: StudentItem[] = [];
  const genders = ['男', '女'];
  const classOptions = classList.value.length > 0 ? classList.value : ['计算机科学2401班', '软件工程2402班']; // Fallback classes

  for (let i = 0; i < 20; i++) {
    const gender = genders[i % 2];
    const className = classOptions[i % classOptions.length];
    const joinDate = dayjs().subtract(Math.floor(Math.random() * 365), 'day').format('YYYY-MM-DD');
    const createTime = dayjs().subtract(Math.floor(Math.random() * 10), 'day').format('YYYY-MM-DD HH:mm:ss');
    
    mockStudents.push({
      id: 1000 + i,
      studentId: `S${2024000 + i}`,
      name: `学生${i + 1}`,
      gender: gender,
      className: className,
      phone: `13${Math.floor(Math.random() * 1000000000)}`,
      email: `student${i}@example.com`,
      joinDate: joinDate,
      createTime: createTime // Add createTime field
    });
  }
  tableData.value = mockStudents;
  pagination.total = mockStudents.length;
};

// 新增：获取班级选项列表
const fetchClassOptions = async () => {
  try {
    const res = await getClassList(); // 假设返回 ApiResponse<ClassItemResponse[]>
    console.log('Class options response:', res);
    // 直接检查 res.code 和 res.data
    if (res && res.code === 200 && Array.isArray(res.data)) {
      // 确保使用 common.ts 的类型
      classList.value = res.data.map((item: ClassItemResponse) => item.class_name).filter(Boolean as any);
      console.log('Class options loaded:', classList.value);
    } else {
      // 直接访问 res.message
      ElMessage.warning(res?.message || '获取班级选项失败');
      classList.value = [];
    }
  } catch (error: any) {
    console.error('获取班级选项失败:', error);
    ElMessage.error(error.message || '获取班级选项失败');
    classList.value = [];
  }
};

// 导入文件上传前校验
const beforeUpload = (file: File) => {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'application/vnd.ms-excel';
  const isCsv = file.type === 'text/csv';
  const isLt20M = file.size / 1024 / 1024 < 20; // 限制 20MB

  if (!isExcel && !isCsv) {
    ElMessage.error('上传文件只能是 Excel 或 CSV 格式!');
    return false;
  }
  if (!isLt20M) {
    ElMessage.error('上传文件大小不能超过 20MB!');
    return false;
  }
  loading.value = true; // 开始加载状态
  return true;
}

// 处理导入请求
const handleImportRequest = async (options: UploadRequestOptions) => {
  loading.value = true; // Start loading early
  try {
    console.log('[Student Import] handleImportRequest called with file:', options.file.name);
    // Assuming importStudents returns the data object directly due to interceptor
    const res = await importStudents(options.file);
    console.log('[Student Import] API Response:', res);

    // Corrected Check: Check if the response object itself has the 'code' property
    if (res && res.hasOwnProperty('code')) {
        // Access data directly from res and res.data
        const responseCode = res.code; // Use res.code
        const processedCount = res.data?.processedCount ?? 0; // Use res.data.processedCount
        const errors = res.data?.errors ?? [];               // Use res.data.errors
        const messageFromServer = res.message || '';          // Use res.message

        // Now use responseCode for the check
        if (responseCode === 200) {
            // --- Backend returned 200 OK ---
            console.log('[Student Import DEBUG] Extracted errors variable before check:', JSON.stringify(errors));
            console.log('[Student Import DEBUG] Extracted errors.length before check:', errors ? errors.length : 'errors is null/undefined');

            if (errors && errors.length > 0) {
                // Case 1: Code 200, but there were validation/DB errors (Partial Success/Failure)
                console.log('[Student Import DEBUG] Condition (errors.length > 0) is TRUE. Showing ElNotification.');
                const errorCount = errors.length;
                const notificationMessage = `导入完成，尝试处理 ${processedCount + errorCount} 行，成功 ${processedCount} 行，失败/跳过 ${errorCount} 行。`;
                let errorDetails = errors.map((err: any) => `行 ${err.row}: ${err.error || err.errors?.join(', ') || '未知错误'}`).join('<br>');

                (ElNotification as any)({
                  title: '导入完成（部分成功或有错误）',
                  dangerouslyUseHTMLString: true,
                  message: `${notificationMessage}<br>以下行未成功导入或更新：<br>${errorDetails}`,
                  type: 'warning',
                  duration: 0 // Do not close automatically
                });

            } else if (processedCount > 0) {
                // Case 2: Code 200, processed > 0, no errors -> Full Success
                console.log('[Student Import DEBUG] Condition (processedCount > 0) is TRUE. Showing ElMessage success.');
                const successMessage = messageFromServer || `成功导入/更新 ${processedCount} 条学生记录。`;
                ElMessage.success(successMessage);

            } else {
                // Case 3: Code 200, processed = 0, no errors -> Nothing to import/all duplicates/empty file
                console.log('[Student Import DEBUG] Condition (else block) is TRUE. Showing ElMessage warning.');
                ElMessage.warning(messageFromServer || '未导入任何新记录（文件可能为空或数据已存在）。');
            }

            // Refresh list only if there's a chance data changed
            if (processedCount > 0 || (errors && errors.length > 0)) {
                 await fetchData();
            }
        } else {
            // --- Backend returned non-200 code in res.code ---
             console.log(`[Student Import DEBUG] Non-200 code (${responseCode}). Passing to handleImportError.`);
            // Pass the whole 'res' object to error handler as it contains code, message, and potentially data.errors
            handleImportError(res);
        }
    } else {
        // --- Response object is malformed or missing res.code ---
        console.error('[Student Import] Invalid API response structure:', res);
        // Pass the problematic response or a generic error
        handleImportError(res || new Error('收到了无效的服务器响应'));
    }
  } catch (error: any) { // Catches network errors or promise rejections from importStudents
      console.error('[Student Import] Error caught in handleImportRequest catch block:', error);
      handleImportError(error); // Pass the caught error (likely AxiosError)
  } finally {
    loading.value = false; // Ensure loading is always stopped
  }
}

// 统一处理导入错误
const handleImportError = (error: any) => {
  loading.value = false; // Ensure loading indicator is turned off
  let title = '导入失败';
  let message = '发生未知错误';
  let errorDetails = '';
  let errorType: 'error' | 'warning' = 'error';

  // Try to extract information from different error structures
  const responseData = error?.response?.data || error?.data; // Prioritize Axios error response data, fallback to direct data if `error` is the response itself
  const backendMessage = responseData?.message || error?.message; // Get message from response data OR error object
  const backendCode = responseData?.code || error?.code;       // Get code from response data OR error object
  const validationErrors = responseData?.errors;             // Get validation errors from response data

  if (backendMessage) {
      message = backendMessage;
  }

  // Check for detailed validation errors from the backend (even if code != 200)
  if (validationErrors && Array.isArray(validationErrors) && validationErrors.length > 0) {
    title = '导入失败（数据校验错误）';
    const processedCount = responseData?.processedCount || 0; // Get count if available
    // Adjust message based on whether it was a partial success or complete validation failure
    if (backendCode === 200) { // Came from the code === 200 block but had errors
         message = `尝试处理 ${processedCount + validationErrors.length} 条记录，成功 ${processedCount} 条，失败/跳过 ${validationErrors.length} 行。`;
    } else { // Came from code !== 200 block (e.g., 400)
         message = backendMessage || `导入文件中存在 ${validationErrors.length} 条数据错误`;
    }
    errorDetails = validationErrors.map((err: any) => `行 ${err.row}: ${err.error || err.errors?.join(', ') || '未知错误'}`).join('<br>');
    errorType = 'warning'; // Use warning type, as it's usually data format issues
  } else if (backendCode === 400) {
      // Handle 400 Bad Request (e.g., file type error, missing headers, general validation fail without specific row errors)
      title = '导入请求错误';
  } else if (backendCode === 401 || backendCode === 403) {
      title = '认证失败';
  } else if (backendCode === 500) {
      // Handle 500 Internal Server Error
      title = '服务器内部错误';
  } else if (error?.name === 'AxiosError' && !error.response) {
      // Handle network errors (request never reached server or no response)
       title = '网络错误';
       message = '无法连接到服务器，请检查网络连接。';
  }

  // Use ElNotification to display errors, especially when details are available
  if (errorDetails) {
     (ElNotification as any)({
        title: title,
        dangerouslyUseHTMLString: true,
        message: `${message}<br>错误详情:<br>${errorDetails}`,
        type: errorType,
        duration: 0 // Don't auto-close detailed errors
      });
  } else {
      // For simple errors without detailed lists, use ElMessage
      ElMessage.error(`${title}: ${message}`);
  }
}

// 页面初始化时获取数据
onMounted(async () => {
  await fetchData() // Fetch student list
  await fetchClassOptions() // Fetch class options for the dropdown
})
</script>

<style scoped>
.student-container {
  padding: 20px;
  min-height: calc(100vh - 84px);
  transition: background-color 0.3s;
}

.operation-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  transition: background-color 0.3s, border-color 0.3s, box-shadow 0.3s;
}

.search-input {
  width: 300px;
}

.operation-buttons {
  display: flex;
  gap: 10px;
}

.student-table {
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
}

.name-tag {
  font-weight: bold;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  background: white;
  padding: 15px;
  border-radius: 8px;
  transition: background-color 0.3s, border-color 0.3s;
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

/* 居中表格内容 */
:deep(.el-table .el-table__cell),
:deep(.el-table th.el-table__cell > .cell) {
  text-align: center;
}

/* --- Dark Mode Styles using Conditional Class --- */

.operation-header.dark-component-bg {
  background-color: #1f2937;
  box-shadow: var(--el-box-shadow-light);
  border: 1px solid var(--el-border-color-lighter);
}

.pagination.dark-component-bg {
  background-color: #1f2937;
  border: 1px solid var(--el-border-color-lighter);
}

/* Style internal elements when the dark class is applied */
.dark-component-bg :deep(.el-input__wrapper) {
  background-color: var(--el-fill-color-blank) !important;
  box-shadow: none !important;
}

.dark-component-bg :deep(.el-input__inner) {
   color: var(--el-text-color-primary) !important;
}

.dark-component-bg :deep(.el-input__inner::placeholder) {
    color: var(--el-text-color-placeholder) !important;
}

.dark-component-bg :deep(.el-button) {
   background-color: var(--el-button-bg-color);
   color: var(--el-button-text-color);
   border-color: var(--el-button-border-color);
}
.dark-component-bg :deep(.el-button:hover),
.dark-component-bg :deep(.el-button:focus) {
   background-color: var(--el-button-hover-bg-color);
   color: var(--el-button-hover-text-color);
   border-color: var(--el-button-hover-border-color);
}

/* Pagination internal elements in dark mode */
.pagination.dark-component-bg :deep(button),
.pagination.dark-component-bg :deep(.el-input__wrapper) {
   background-color: var(--el-fill-color-blank) !important;
   color: var(--el-text-color-primary) !important;
}
.pagination.dark-component-bg :deep(.el-input__inner) {
   color: var(--el-text-color-primary) !important;
}
.pagination.dark-component-bg :deep(.el-pager li) {
  background-color: transparent !important;
  color: var(--el-text-color-primary) !important;
}
.pagination.dark-component-bg :deep(.el-pager li.is-active) {
    background-color: var(--el-color-primary) !important;
    color: var(--el-color-white) !important;
}
.pagination.dark-component-bg :deep(span:not([class])),
.pagination.dark-component-bg :deep(.el-pagination__jump) {
    color: var(--el-text-color-primary) !important;
    background-color: transparent !important;
}
.pagination.dark-component-bg :deep(button:disabled) {
    color: var(--el-text-color-disabled) !important;
    background-color: transparent !important;
}
.pagination.dark-component-bg :deep(.btn-prev),
.pagination.dark-component-bg :deep(.btn-next) {
     background-color: transparent !important;
}

:deep(.app-wrapper.dark) .student-container {
   background-color: var(--el-bg-color-page);
}

</style>