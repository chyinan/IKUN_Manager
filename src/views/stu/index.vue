<template>
  <div class="student-container">
    <!-- 头部搜索和操作区 -->
    <div class="operation-header">
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
        <el-button type="success" @click="handleExport">
          <el-icon><Download /></el-icon>导出数据
        </el-button>
      </div>
    </div>

    <!-- 学生数据表格 -->
    <el-table
      :data="filteredTableData"
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
      class="pagination" />

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
import { ref, computed, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getStudentList, addStudent, updateStudent, deleteStudent, getMaxStudentId } from '@/api/student'
import { Delete, Edit, Plus, Search, Download, Male, Female } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { exportToExcel } from '@/utils/export'
import { getClassList } from '@/api/class'
import type { StudentItem, StudentItemResponse, StudentSubmitData } from '@/types/common'
import type { Pagination } from '@/types/response'
import dayjs from 'dayjs'

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
    { required: true, message: '请输入学号', trigger: 'blur' },
    { pattern: /^\d{7}$/, message: '学号必须为7位数字', trigger: 'blur' }  // 改为7位以匹配2024001格式
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

// 获取学生列表
const fetchData = async () => {
  try {
    loading.value = true
    console.log('开始获取学生列表...')
    const res = await getStudentList()
    console.log('学生列表API响应:', res)
    
    if (res && res.data && res.data.code === 200 && Array.isArray(res.data.data)) {
      // 处理API返回的数据
      tableData.value = res.data.data.map((item: StudentItemResponse): StudentItem => {
        // 处理入学时间格式
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
        }
      })
      
      // 更新分页数据
      pagination.total = tableData.value.length
      console.log('成功获取学生数据:', tableData.value)
    } else {
      console.warn('学生列表API响应格式不正确或 code !== 200，使用模拟数据')
      generateMockData()
    }
  } catch (error) {
    console.error('获取学生列表失败:', error)
    ElMessage.warning('获取学生数据失败，使用模拟数据')
    generateMockData()
  } finally {
    loading.value = false
  }
}

// 筛选数据
const filteredTableData = computed(() => {
  return tableData.value.filter(item => {
    // 添加空值检查
    const studentIdMatch = item.studentId && searchKey.value ? 
      item.studentId.toString().toLowerCase().includes(searchKey.value.toLowerCase()) : 
      !searchKey.value;
    
    const nameMatch = item.name && searchKey.value ? 
      item.name.toString().toLowerCase().includes(searchKey.value.toLowerCase()) : 
      !searchKey.value;
    
    return studentIdMatch || nameMatch;
  });
})

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
        
        if (response.code === 200) {
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
    '班级': item.className,
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
    const classes = await getClassList()
    if (Array.isArray(classes)) {
      classList.value = classes.map(item => item.className)
    }
  } catch (error) {
    console.error('获取班级列表失败:', error)
    ElMessage.error('获取班级列表失败')
  }
}

// 分页数据
const pagination = reactive<Pagination>({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 添加模拟学生数据生成函数
const generateMockData = () => {
  // 使用班级列表，如果为空则创建默认班级
  const classNames = classList.value.length > 0 ? 
    classList.value : 
    ['计算机科学2401班', '软件工程2402班', '人工智能2403班', '大数据分析2404班', '网络安全2405班']
  
  // 创建模拟学生数据
  const mockStudents = [];
  for (let i = 0; i < 30; i++) {
    const gender = Math.random() > 0.5 ? '男' : '女'
    const className = classNames[Math.floor(Math.random() * classNames.length)]
    
    mockStudents.push({
      id: i + 1,
      studentId: `2024${String(i + 1).padStart(3, '0')}`,
      name: `${gender === '男' ? '张' : '李'}同学${i + 1}`,
      className: className,
      gender: gender,
      phone: `1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
      email: `student${i + 1}@example.com`,
      joinDate: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleDateString('zh-CN')
    })
  }
  
  tableData.value = mockStudents
  pagination.total = mockStudents.length
  console.log('生成的模拟学生数据:', tableData.value)
}

// 新增：获取班级选项列表
const fetchClassOptions = async () => {
  try {
    console.log('开始获取班级选项...');
    // 使用从 @/api/class 导入的 getClassList
    const res = await getClassList(); 
    console.log('班级选项API响应:', res);

    // 检查响应和数据结构
    if (res && res.data && res.data.code === 200 && Array.isArray(res.data.data)) {
      // 提取班级名称列表
      // 后端返回的是 ClassItemResponse[], 需要取 class_name
      classList.value = res.data.data.map((item: any) => item.class_name).filter(Boolean);
      console.log('成功获取班级选项:', classList.value);
    } else {
      console.warn('获取班级选项失败或响应格式不正确:', res);
      ElMessage.warning(res?.data?.message || '获取班级选项失败');
      classList.value = []; // 清空列表
    }
  } catch (error) {
    console.error('获取班级选项失败 (catch):', error);
    ElMessage.error('获取班级选项时出错');
    classList.value = []; // 清空列表
  }
};

// 页面初始化时获取数据
onMounted(async () => {
  await fetchData() // Fetch student list
  await fetchClassOptions() // Fetch class options for the dropdown
})
</script>

<style scoped>
.student-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 84px);
}

.operation-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
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
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}
</style>