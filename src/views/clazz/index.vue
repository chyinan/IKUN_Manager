<template>
  <div class="class-container">
    <!-- 头部搜索和操作区 -->
    <div class="operation-header">
      <el-input
        v-model="searchKey"
        placeholder="搜索班级..."
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
          <span class="class-name">{{ row.className }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="studentCount" label="班级人数" width="120" align="center">
        <template #default="{ row }">
          <el-tag :type="row.studentCount > 30 ? 'danger' : 'success'">
            {{ row.studentCount }}人
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="teacher" label="班主任" min-width="120" />
      <el-table-column prop="createTime" label="创建时间" min-width="180" />
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
        <el-form-item label="班级人数" prop="studentCount">
          <el-input-number v-model="formData.studentCount" :min="0" :max="50" />
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
import { Delete, Edit, Plus, Search, View, Download } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'

// 数据接口定义
interface ClassData {
  id?: number
  className: string
  studentCount: number
  teacher: string
  createTime: string
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

// 表单数据
const formData = reactive<ClassData>({
  className: '',
  studentCount: 0,
  teacher: '',
  createTime: ''
})

// 表单验证规则
const rules = reactive<FormRules>({
  className: [
    { required: true, message: '请输入班级名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  teacher: [
    { required: true, message: '请输入班主任姓名', trigger: 'blur' }
  ],
  studentCount: [
    { required: true, message: '请输入班级人数', trigger: 'blur' }
  ]
})

// 模拟数据
const tableData = ref<ClassData[]>([
  {
    id: 1,
    className: '高三一班',
    studentCount: 45,
    teacher: '张老师',
    createTime: '2024-01-01'
  },
  // ...更多数据
])

// 搜索过滤
const filteredTableData = computed(() => {
  return tableData.value.filter(item =>
    item.className.toLowerCase().includes(searchKey.value.toLowerCase()) ||
    item.teacher.toLowerCase().includes(searchKey.value.toLowerCase())
  )
})

// 处理新增
const handleAdd = () => {
  dialogType.value = 'add'
  dialogVisible.value = true
  formData.className = ''
  formData.studentCount = 0
  formData.teacher = ''
}

// 处理编辑
const handleEdit = (row: ClassData) => {
  dialogType.value = 'edit'
  dialogVisible.value = true
  Object.assign(formData, row)
}

// 处理删除
const handleDelete = (row: ClassData) => {
  ElMessageBox.confirm(
    `确定要删除班级 ${row.className} 吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // TODO: 调用删除API
    ElMessage.success('删除成功')
  })
}

// 处理表单提交
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate((valid) => {
    if (valid) {
      // TODO: 调用保存API
      dialogVisible.value = false
      ElMessage.success(dialogType.value === 'add' ? '新增成功' : '修改成功')
    }
  })
}

// 导出数据
const handleExport = () => {
  ElMessage.success('导出成功')
}

// 查看详情
const handleDetail = (row: ClassData) => {
  ElMessage.info(`查看班级：${row.className}`)
}
</script>

<style scoped>
.class-container {
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

.class-table {
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
}

.class-name {
  font-weight: bold;
  color: #409eff;
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