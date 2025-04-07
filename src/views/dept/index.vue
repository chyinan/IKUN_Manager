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
import { ref, computed, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Edit, Plus, Search, Download } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { getDeptList, addDept, updateDept, deleteDept } from '@/api/dept'
import type { DeptItem, DeptItemResponse, DeptBackendData } from '@/types/common'
import { exportToExcel } from '@/utils/export'
import dayjs from 'dayjs'
import type { ApiResponse } from '@/types/common'

// 修改表单数据
const formData = reactive<DeptItem>({
  id: 0,
  deptName: '',
  manager: '',
  description: '',
  memberCount: 0,
  createTime: ''
})

// 数据状态
const loading = ref(false)
const tableData = ref<DeptItem[]>([])
const total = ref(0)
const searchKey = ref('')

// 分页参数
const currentPage = ref(1)
const pageSize = ref(10)

// 搜索参数
const searchParams = reactive({
  deptName: '',
  manager: ''
})

// 获取部门列表
const fetchData = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      deptName: searchParams.deptName,
      manager: searchParams.manager,
    };
    console.log('Fetching dept data with params:', params);
    const res: ApiResponse<DeptItemResponse[]> = await getDeptList();
    console.log('Dept API Response:', res);

    if (res.code === 200 && Array.isArray(res.data)) {
      tableData.value = res.data.map(item => ({
        id: item.id,
        deptName: item.dept_name,
        manager: item.manager,
        memberCount: item.member_count || 0,
        description: item.description || '-',
        createTime: item.create_time ? dayjs(item.create_time).format('YYYY-MM-DD HH:mm:ss') : 'N/A'
      }));
      total.value = res.total || res.data.length;
    } else {
      ElMessage.warning(res.message || '获取部门数据失败');
      tableData.value = [];
      total.value = 0;
    }
  } catch (error: any) {
    console.error('获取部门数据失败:', error);
    ElMessage.error(error.message || '获取部门数据失败');
    tableData.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

// 页面初始化时获取数据
onMounted(() => {
  fetchData()
})

const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance>()

const rules = reactive<FormRules>({
  deptName: [
    { required: true, message: '请输入部门名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  manager: [
    { required: true, message: '请输入部门主管', trigger: 'blur' }
  ]
})

const filteredTableData = computed(() => {
  return tableData.value.filter(item => {
    if (!searchKey.value) return true
    
    const searchText = searchKey.value.toLowerCase()
    const deptNameMatch = item.deptName && searchText ? 
      item.deptName.toString().toLowerCase().includes(searchText) : 
      false
    
    const managerMatch = item.manager && searchText ? 
      item.manager.toString().toLowerCase().includes(searchText) : 
      false
    
    return deptNameMatch || managerMatch
  })
})

// 修改新增处理方法
const handleAdd = () => {
  dialogType.value = 'add'
  dialogVisible.value = true
  Object.assign(formData, {
    id: undefined,
    deptName: '',
    manager: '',
    description: '',
    memberCount: 0,
    createTime: ''
  })
  formRef.value?.clearValidate()
}

// 修改编辑处理方法
const handleEdit = (row: DeptItem) => {
  dialogType.value = 'edit'
  dialogVisible.value = true
  Object.assign(formData, {
    id: row.id,
    deptName: row.deptName,
    manager: row.manager,
    description: row.description || '',
    memberCount: row.memberCount,
    createTime: row.createTime
  })
  formRef.value?.clearValidate()
}

const handleDelete = async (row: DeptItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除部门 ${row.deptName} 吗？`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    loading.value = true
    const res = await deleteDept(row.id!)
    if (res && res.code === 200) {
      ElMessage.success('删除成功')
      await fetchData()
    } else {
      ElMessage.error(res?.message || '删除失败')
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

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      // Prepare data for backend, explicitly handling description
      const backendData = {
        dept_name: formData.deptName,
        manager: formData.manager,
        description: formData.description || undefined // 确保 description 是 string | undefined
      };

      try {
        let res: ApiResponse<any>;
        if (dialogType.value === 'add') {
          res = await addDept(backendData);
          ElMessage.success('添加成功');
        } else {
          res = await updateDept(formData.id!, backendData);
          ElMessage.success('修改成功');
        }
        dialogVisible.value = false;
        await fetchData();
      } catch (error: any) {
        console.error('操作失败:', error);
        ElMessage.error(`操作失败: ${error.response?.data?.message || error.message}`);
      } finally {
        loading.value = false;
      }
    }
  });
};

const handleExport = () => {
  const data = tableData.value.map(item => ({
    '部门名称': item.deptName,
    '部门主管': item.manager,
    '部门人数': item.memberCount,
    '创建时间': item.createTime,
    '部门描述': item.description || ''
  }))
  
  exportToExcel(data, '部门数据')
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