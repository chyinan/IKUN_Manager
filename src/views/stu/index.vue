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
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button-group>
            <el-button type="primary" @click="handleEdit(row)" :icon="Edit" circle />
            <el-button type="danger" @click="handleDelete(row)" :icon="Delete" circle />
            <el-button type="success" @click="handleDetail(row)" :icon="View" circle />
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
      :title="dialogType === 'add' ? '新增学生' : '编辑学生'"
      width="600px">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px">
        <el-form-item label="学号" prop="studentId">
          <el-input v-model="formData.studentId" :disabled="dialogType === 'edit'" />
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
            placeholder="选择日期"
            value-format="YYYY-MM-DD" />
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
import { ref, computed, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Edit, Plus, Search, View, Download, Male, Female } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'

// 数据接口定义
interface StudentData {
  id?: number
  studentId: string
  name: string
  gender: '男' | '女'
  className: string
  phone: string
  email: string
  joinDate: string
}

// 状态定义
const loading = ref(false)
const searchKey = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance>()

// 模拟班级列表
const classList = ['高三一班', '高三二班', '高三三班', '高三四班']

// 表单数据
const formData = reactive<StudentData>({
  studentId: '',
  name: '',
  gender: '男',
  className: '',
  phone: '',
  email: '',
  joinDate: ''
})

// 表单验证规则
const rules = reactive<FormRules>({
  studentId: [
    { required: true, message: '请输入学号', trigger: 'blur' },
    { pattern: /^\d{8}$/, message: '学号必须为8位数字', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 10, message: '长度在 2 到 10 个字符', trigger: 'blur' }
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

// 模拟数据
const tableData = ref<StudentData[]>([
  {
    id: 1,
    studentId: '20240001',
    name: '张三',
    gender: '男',
    className: '高三一班',
    phone: '13800138000',
    email: 'zhangsan@example.com',
    joinDate: '2024-01-01'
  }
])

// 搜索过滤
const filteredTableData = computed(() => {
  return tableData.value.filter(item =>
    item.studentId.includes(searchKey.value) ||
    item.name.toLowerCase().includes(searchKey.value.toLowerCase())
  )
})

// CRUD 操作处理函数
const handleAdd = () => {
  dialogType.value = 'add'
  dialogVisible.value = true
  formData.studentId = ''
  formData.name = ''
  formData.gender = '男'
  formData.className = ''
  formData.phone = ''
  formData.email = ''
  formData.joinDate = ''
}

const handleEdit = (row: StudentData) => {
  dialogType.value = 'edit'
  dialogVisible.value = true
  Object.assign(formData, row)
}

const handleDelete = (row: StudentData) => {
  ElMessageBox.confirm(
    `确定要删除学生 ${row.name} 的信息吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success('删除成功')
  })
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate((valid) => {
    if (valid) {
      dialogVisible.value = false
      ElMessage.success(dialogType.value === 'add' ? '新增成功' : '修改成功')
    }
  })
}

const handleExport = () => {
  ElMessage.success('导出成功')
}

const handleDetail = (row: StudentData) => {
  ElMessage.info(`查看学生：${row.name}`)
}
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