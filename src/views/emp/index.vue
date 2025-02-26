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
import { ref, computed, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Edit, Plus, Search, Download } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { getEmployeeList, addEmployee, updateEmployee, deleteEmployee } from '@/api/employee'
import { getDeptList } from '@/api/dept'
import type { EmployeeItem, EmployeeFormData, DeptItem } from '@/types/employee'
import { exportToExcel } from '@/utils/export'

// 基础数据状态 
const loading = ref(false)
const searchKey = ref('')
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const tableData = ref<EmployeeItem[]>([])
const formRef = ref<FormInstance>()
const deptFilter = ref('')
const deptOptions = ref<string[]>([])

// 表单数据
const formData = reactive<EmployeeFormData>({
  empId: '',
  name: '',
  gender: '男',
  age: 18,
  position: '',
  deptName: '',
  salary: 0,
  status: '在职',
  phone: '',
  email: '',
  joinDate: ''
})

// 表单验证规则
const rules = reactive<FormRules>({
  empId: [
    { required: true, message: '请输入工号', trigger: 'blur' },
    { pattern: /^\d{6}$/, message: '工号必须为6位数字', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  deptName: [
    { required: true, message: '请选择部门', trigger: 'change' }
  ],
  position: [
    { required: true, message: '请输入职位', trigger: 'blur' }
  ],
  salary: [
    { required: true, message: '请输入薪资', trigger: 'blur' },
    { type: 'number', min: 0, message: '薪资不能小于0', trigger: 'blur' }
  ]
})

// 格式化薪资
const formatSalary = (salary: number) => {
  return `¥ ${salary.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
}

// 数据处理函数
const handleAdd = () => {
  dialogType.value = 'add'
  dialogVisible.value = true
  Object.assign(formData, {
    empId: '',
    name: '',
    gender: '男',
    age: 18,
    position: '',
    deptName: '',
    salary: 0,
    status: '在职',
    phone: '',
    email: '',
    joinDate: ''
  })
}

const handleEdit = (row: EmployeeItem) => {
  dialogType.value = 'edit'
  dialogVisible.value = true
  Object.assign(formData, row)
}

const handleDelete = async (row: EmployeeItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除员工 ${row.name} 吗？`, 
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    loading.value = true
    await deleteEmployee(row.id!)
    ElMessage.success('删除成功')
    fetchData()
    
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

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate(async (valid) => {
      if (valid) {
        loading.value = true
        
        // 格式化提交数据
        const submitData = {
          ...formData,
          joinDate: formData.joinDate ? new Date(formData.joinDate).toISOString().split('T')[0] : ''
        }
        
        console.log('提交的数据:', submitData)
        
        if (dialogType.value === 'add') {
          await addEmployee(submitData)
          ElMessage.success('添加成功')
        } else {
          await updateEmployee(submitData)
          ElMessage.success('修改成功')
        }
        
        dialogVisible.value = false
        await fetchData() // 刷新数据
      }
    })
  } catch (error: any) {
    console.error('操作失败:', error)
    ElMessage.error(`操作失败: ${error.response?.data?.message || error.message}`)
  } finally {
    loading.value = false
  }
}

const handleExport = () => {
  const exportData = tableData.value.map(item => ({
    '工号': item.empId,
    '姓名': item.name,
    '部门': item.deptName,
    '职位': item.position,
    '薪资': formatSalary(item.salary),
    '状态': item.status
  }))
  exportToExcel(exportData, `员工数据_${new Date().toLocaleDateString()}`)
}

// 获取部门列表
const fetchDeptList = async () => {
  try {
    const res = await getDeptList()
    deptOptions.value = res.data.map(item => item.dept_name)
  } catch (error) {
    console.error('获取部门列表失败:', error)
  }
}

// 筛选数据
const filteredTableData = computed(() => {
  return tableData.value.filter(item =>
    (item.empId.toLowerCase().includes(searchKey.value.toLowerCase()) ||
     item.name.toLowerCase().includes(searchKey.value.toLowerCase())) &&
    (!deptFilter.value || item.deptName === deptFilter.value)
  )
})

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const res = await getEmployeeList()
    console.log('员工数据:', res)
    if (res.code === 200 && res.data) {
      tableData.value = res.data.map(item => ({
        id: item.id,
        empId: item.emp_id,
        name: item.name,
        gender: item.gender,
        age: item.age,
        position: item.position,
        deptName: item.dept_name,
        salary: Number(item.salary),
        status: item.status,
        phone: item.phone || '',
        email: item.email || '',
        joinDate: new Date(item.join_date).toLocaleDateString('zh-CN')
      }))
      total.value = res.data.length
    }
  } catch (error) {
    console.error('获取失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 初始化
onMounted(() => {
  fetchData()
  fetchDeptList()
})
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