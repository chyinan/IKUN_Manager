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
      v-model:current-page="pagination.currentPage"
      v-model:page-size="pagination.pageSize"
      :total="pagination.total"
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
import type { FormInstance, FormRules } from 'element-plus'
import { Delete, Edit, Plus, Search, View, Download } from '@element-plus/icons-vue'
import { getClassList, addClass, updateClass, deleteClass } from '@/api/class'
import type { ClassItem, ClassFormData, ClassItemResponse, ClassBackendData } from '@/types/class'
import { exportToExcel } from '@/utils/export'
import type { Pagination } from '@/types/common'

// 基础数据状态
const loading = ref(false)
const searchKey = ref('')
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance>()
const tableData = ref<ClassItem[]>([])

// 分页数据
const pagination = reactive<Pagination>({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 表单数据
const formData = reactive<ClassFormData>({
  className: '',
  teacher: '',
  studentCount: 0,
  description: ''
})

// 表单验证规则
const rules = reactive<FormRules>({
  className: [
    { required: true, message: '请输入班级名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  teacher: [
    { required: true, message: '请输入班主任姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ]
})

// 数据转换方法
const convertResponse = (item: ClassItemResponse): ClassItem => ({
  id: item.id,
  className: item.class_name,
  studentCount: item.student_count,
  teacher: item.teacher,
  createTime: new Date(item.create_time).toLocaleString('zh-CN'),
  description: item.description || undefined
})

// 获取班级列表
const fetchData = async () => {
  try {
    loading.value = true
    const res = await getClassList()
    if (res.code === 200 && res.data) {
      tableData.value = res.data.map(convertResponse)
      pagination.total = res.data.length
    }
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 搜索过滤
const filteredTableData = computed(() => {
  const searchText = searchKey.value.toLowerCase()
  return tableData.value.filter(item =>
    item.className.toLowerCase().includes(searchText) ||
    item.teacher.toLowerCase().includes(searchText)
  )
})

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        loading.value = true
        
        // 创建一个符合后端 API 格式的数据对象
        const backendData: ClassBackendData = {
          class_name: formData.className,
          teacher: formData.teacher,
          student_count: formData.studentCount || 0,
          description: formData.description
        }

        if (dialogType.value === 'add') {
          await addClass(backendData)
          ElMessage.success('新增成功')
        } else if (formData.id) {
          await updateClass(formData.id, backendData)
          ElMessage.success('修改成功')
        }
        
        dialogVisible.value = false
        await fetchData()
      } catch (error: any) {
        console.error('操作失败:', error)
        ElMessage.error(error.response?.data?.message || '操作失败')
      } finally {
        loading.value = false
      }
    }
  })
}

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
  formData.studentCount = 0
  formData.description = ''
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
        type: 'warning'
      }
    )

    loading.value = true
    const res = await deleteClass(row.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      await fetchData()
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  } finally {
    loading.value = false
  }
}

// 导出数据
const handleExport = () => {
  const exportData = tableData.value.map(item => ({
    '班级名称': item.className,
    '班主任': item.teacher,
    '学生人数': item.studentCount,
    '创建时间': item.createTime
  }))
  
  exportToExcel(exportData, `班级数据_${new Date().toLocaleDateString()}`)
  ElMessage.success('导出成功')
}

// 处理查看详情
const handleDetail = (row: ClassItem) => {
  // TODO: 实现查看详情的逻辑
  console.log('查看班级详情:', row)
}

onMounted(() => {
  fetchData()
})
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