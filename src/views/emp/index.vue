<template>
  <div class="emp-container">
    <!-- 头部搜索和操作区 -->
    <div class="operation-header">
      <div class="search-group">
        <el-input
          v-model="searchKey"
          placeholder="搜索工号/姓名..."
          class="search-input"
          clearable>
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="deptFilter" placeholder="部门筛选" clearable>
          <el-option
            v-for="dept in deptOptions"
            :key="dept"
            :label="dept"
            :value="dept"
          />
        </el-select>
      </div>
      
      <div class="operation-buttons">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>新增员工
        </el-button>
        <el-button type="success" @click="handleExport">
          <el-icon><Download /></el-icon>导出数据
        </el-button>
      </div>
    </div>

    <!-- 员工数据表格 -->
    <el-table
      :data="filteredTableData"
      stripe
      border
      highlight-current-row
      class="emp-table"
      v-loading="loading">
      <el-table-column type="index" label="#" width="60" align="center" />
      <el-table-column prop="empId" label="工号" width="100" align="center" />
      <el-table-column prop="name" label="姓名" min-width="100">
        <template #default="{ row }">
          <el-tag :type="row.gender === '男' ? 'primary' : 'success'">
            {{ row.name }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="gender" label="性别" width="80" align="center">
        <template #default="{ row }">
          <el-icon :color="row.gender === '男' ? '#409EFF' : '#67C23A'">
            <Male v-if="row.gender === '男'" />
            <Female v-else />
          </el-icon>
          {{ row.gender }}
        </template>
      </el-table-column>
      <el-table-column prop="position" label="职位" min-width="120" />
      <el-table-column prop="age" label="年龄" width="80" align="center" />
      <el-table-column prop="department" label="所属部门" min-width="120" />
      <el-table-column prop="joinDate" label="入职时间" min-width="180" />
      <el-table-column prop="salary" label="薪资" min-width="120" align="right">
        <template #default="{ row }">
          {{ formatSalary(row.salary) }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === '在职' ? 'success' : 'danger'">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
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
      :title="dialogType === 'add' ? '新增员工' : '编辑员工'"
      width="600px">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px">
        <el-form-item label="工号" prop="empId">
          <el-input v-model="formData.empId" :disabled="dialogType === 'edit'" />
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
        <el-form-item label="职位" prop="position">
          <el-input v-model="formData.position" />
        </el-form-item>
        <el-form-item label="年龄" prop="age">
          <el-input-number v-model="formData.age" :min="18" :max="60" />
        </el-form-item>
        <el-form-item label="所属部门" prop="department">
          <el-select v-model="formData.department">
            <el-option
              v-for="dept in deptOptions"
              :key="dept"
              :label="dept"
              :value="dept"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="入职时间" prop="joinDate">
          <el-date-picker
            v-model="formData.joinDate"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="薪资" prop="salary">
          <el-input-number 
            v-model="formData.salary"
            :min="0"
            :step="1000"
            :precision="2"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status">
            <el-option label="在职" value="在职" />
            <el-option label="离职" value="离职" />
          </el-select>
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
interface EmpData {
  id?: number
  empId: string
  name: string
  gender: '男' | '女'
  position: string
  age: number
  department: string
  joinDate: string
  salary: number
  status: '在职' | '离职'
}

// 基础数据
const loading = ref(false)
const searchKey = ref('')
const deptFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance>()

// 部门选项
const deptOptions = ['技术部', '市场部', '销售部', '人事部', '财务部']

// 表单数据
const formData = reactive<EmpData>({
  empId: '',
  name: '',
  gender: '男',
  position: '',
  age: 25,
  department: '',
  joinDate: '',
  salary: 0,
  status: '在职'
})

// 表单验证规则
const rules = reactive<FormRules>({
  empId: [
    { required: true, message: '请输入工号', trigger: 'blur' },
    { pattern: /^\d{6}$/, message: '工号必须为6位数字', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 10, message: '长度在 2 到 10 个字符', trigger: 'blur' }
  ],
  position: [
    { required: true, message: '请输入职位', trigger: 'blur' }
  ],
  department: [
    { required: true, message: '请选择部门', trigger: 'change' }
  ],
  joinDate: [
    { required: true, message: '请选择入职时间', trigger: 'change' }
  ]
})

// 工具函数
const formatSalary = (salary: number) => {
  return `￥${salary.toLocaleString()}`
}

// 模拟数据
const tableData = ref<EmpData[]>([
  {
    id: 1,
    empId: '100001',
    name: '张三',
    gender: '男',
    position: '开发工程师',
    age: 28,
    department: '技术部',
    joinDate: '2024-01-01',
    salary: 15000,
    status: '在职'
  }
])

// 数据过滤计算属性
const filteredTableData = computed(() => {
  return tableData.value.filter(item =>
    (item.empId.includes(searchKey.value) ||
    item.name.toLowerCase().includes(searchKey.value.toLowerCase())) &&
    (!deptFilter.value || item.department === deptFilter.value)
  )
})

// 新增员工
const handleAdd = () => {
  dialogType.value = 'add'
  dialogVisible.value = true
  // 重置表单数据
  formData.empId = ''
  formData.name = ''
  formData.gender = '男'
  formData.position = ''
  formData.age = 25
  formData.department = ''
  formData.joinDate = ''
  formData.salary = 0
  formData.status = '在职'
}

// 编辑员工
const handleEdit = (row: EmpData) => {
  dialogType.value = 'edit'
  dialogVisible.value = true
  Object.assign(formData, row)
}

// 删除员工
const handleDelete = (row: EmpData) => {
  ElMessageBox.confirm(
    `确定要删除员工 ${row.name} 的信息吗？`,
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

// 查看详情
const handleDetail = (row: EmpData) => {
  ElMessage.info(`查看员工：${row.name}`)
}

// 导出数据
const handleExport = () => {
  ElMessage.success('导出成功')
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate((valid) => {
    if (valid) {
      dialogVisible.value = false
      ElMessage.success(dialogType.value === 'add' ? '新增成功' : '修改成功')
    }
  })
}
</script>

<style scoped>
.emp-container {
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

.search-group {
  display: flex;
  gap: 15px;
}

.search-input {
  width: 300px;
}

.operation-buttons {
  display: flex;
  gap: 10px;
}

.emp-table {
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
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