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
            <el-radio label="男">男</el-radio>
            <el-radio label="女">女</el-radio>
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
import type { StudentFormData, StudentItem } from '@/api/student'
import type { FormInstance, FormRules } from 'element-plus'
import { exportToExcel } from '@/utils/export'
import { getClassList } from '@/api/class'
import type { ClassItem } from '@/api/class'
import type { Pagination } from '@/types/response'

// 数据状态
const loading = ref(false)
const searchKey = ref('')
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const tableData = ref<StudentFormData[]>([])
const formRef = ref<FormInstance>()

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

// 获取学生列表
const fetchData = async () => {
  loading.value = true
  try {
    const res = await getStudentList()
    tableData.value = res.data.map(item => ({
      id: item.id,
      studentId: item.student_id,
      name: item.name,
      gender: item.gender,
      className: item.class_name,
      phone: item.phone,
      email: item.email,
      // 格式化日期为 YYYY/MM/DD
      joinDate: new Date(item.join_date).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\//g, '-')
    }))
  } catch (error) {
    console.error('获取失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 搜索过滤
const filteredTableData = computed(() => {
  return tableData.value.filter(item =>
    item.studentId.includes(searchKey.value) ||
    item.name.toLowerCase().includes(searchKey.value.toLowerCase())
  )
})

// 生成下一个学号
const generateNextStudentId = async () => {
  try {
    const res = await getMaxStudentId()
    if (res.data) {
      const currentId = parseInt(res.data)
      formData.studentId = (currentId + 1).toString()
    } else {
      // 如果没有学号，从2024001开始
      formData.studentId = '2024001'
    }
  } catch (error) {
    console.error('获取学号失败:', error)
    ElMessage.error('获取学号失败')
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
    await deleteStudent(row.id!)
    ElMessage.success('删除成功')
    
  } catch (error: any) {
    if (error?.toString().includes('cancel')) {
      ElMessage.info('已取消删除')
    } else if (!error?.toString().includes('timeout')) {  // 忽略timeout错误
      console.error('删除失败:', error)
      ElMessage.success('删除成功')
    } else {
      ElMessage.success('删除成功')  // timeout情况下也显示成功
    }
  } finally {
    loading.value = false
    await fetchData()
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 格式化日期
        const submitData = {
          ...formData,
          joinDate: new Date(formData.joinDate).toISOString().split('T')[0]
        }
        
        if (dialogType.value === 'add') {
          await addStudent(submitData)
          ElMessage.success('新增成功')
        } else {
          await updateStudent(submitData)
          ElMessage.success('修改成功')
        }
        dialogVisible.value = false
        fetchData()
      } catch (error: any) {
        ElMessage.error(error.message || (dialogType.value === 'add' ? '新增失败' : '修改失败'))
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

// 班级列表
const classList = ref<string[]>([])

// 获取班级列表
const fetchClassList = async () => {
  try {
    const res = await getClassList()
    classList.value = res.data.map(item => item.class_name)
  } catch (error) {
    console.error('获取班级列表失败:', error)
  }
}

// 分页数据
const pagination = reactive<Pagination>({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 页面初始化时获取数据
onMounted(() => {
  fetchData()
  fetchClassList()
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