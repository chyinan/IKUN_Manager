<template>
  <div class="dept-container">
    <!-- 头部搜索和操作区 -->
    <div class="operation-header">
      <el-input
        v-model="searchKey"
        placeholder="搜索部门名称..."
        class="search-input"
        clearable>
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      
      <div class="operation-buttons">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>新增部门
        </el-button>
        <el-button type="success" @click="handleExport">
          <el-icon><Download /></el-icon>导出数据
        </el-button>
      </div>
    </div>

    <!-- 部门数据表格 -->
    <el-table
      :data="filteredTableData"
      stripe
      border
      highlight-current-row
      class="dept-table"
      v-loading="loading">
      <el-table-column type="index" label="#" width="60" align="center" />
      <el-table-column prop="deptName" label="部门名称" min-width="150">
        <template #default="{ row }">
          <el-tag>{{ row.deptName }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="manager" label="部门主管" min-width="120" />
      <el-table-column prop="memberCount" label="部门人数" width="100" align="center">
        <template #default="{ row }">
          <el-badge :value="row.memberCount" type="primary" />
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" min-width="180" />
      <el-table-column prop="description" label="部门描述" min-width="200" show-overflow-tooltip />
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
      :title="dialogType === 'add' ? '新增部门' : '编辑部门'"
      width="500px">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px">
        <el-form-item label="部门名称" prop="deptName">
          <el-input v-model="formData.deptName" />
        </el-form-item>
        <el-form-item label="部门主管" prop="manager">
          <el-input v-model="formData.manager" />
        </el-form-item>
        <el-form-item label="部门描述" prop="description">
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Edit, Plus, Search, Download } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'

interface DeptData {
  id?: number
  deptName: string
  manager: string
  memberCount: number
  description: string
  createTime: string
}

const loading = ref(false)
const searchKey = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance>()

const formData = reactive<DeptData>({
  deptName: '',
  manager: '',
  memberCount: 0,
  description: '',
  createTime: ''
})

const rules = reactive<FormRules>({
  deptName: [
    { required: true, message: '请输入部门名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  manager: [
    { required: true, message: '请输入部门主管', trigger: 'blur' }
  ]
})

const tableData = ref<DeptData[]>([
  {
    id: 1,
    deptName: '技术部',
    manager: '张三',
    memberCount: 15,
    description: '负责公司技术研发工作',
    createTime: '2024-01-01'
  }
])

const filteredTableData = computed(() => {
  return tableData.value.filter(item =>
    item.deptName.toLowerCase().includes(searchKey.value.toLowerCase()) ||
    item.manager.toLowerCase().includes(searchKey.value.toLowerCase())
  )
})

const handleAdd = () => {
  dialogType.value = 'add'
  dialogVisible.value = true
  formData.deptName = ''
  formData.manager = ''
  formData.description = ''
}

const handleEdit = (row: DeptData) => {
  dialogType.value = 'edit'
  dialogVisible.value = true
  Object.assign(formData, row)
}

const handleDelete = (row: DeptData) => {
  ElMessageBox.confirm(
    `确定要删除部门 ${row.deptName} 吗？`,
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
</script>

<style scoped>
.dept-container {
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

.dept-table {
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