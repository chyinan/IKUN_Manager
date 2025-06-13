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
        <!-- <el-upload
          :action="''" 
          :show-file-list="false"
          :before-upload="beforeUpload"
          :http-request="handleImportRequest" 
          accept=".xlsx, .xls, .csv"
          style="margin: 0 10px;"> 
          <el-button type="warning">
            <el-icon><Upload /></el-icon>导入数据
          </el-button>
        </el-upload> -->
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
      <el-table-column prop="manager" label="部门主管" min-width="120" align="center" />
      <el-table-column prop="memberCount" label="部门人数" width="100" align="center">
        <template #default="{ row }">
          <el-badge :value="row.memberCount" type="primary" />
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" min-width="180" align="center" />
      <el-table-column prop="description" label="部门描述" min-width="200" show-overflow-tooltip />
      <el-table-column label="操作" width="180" fixed="right" align="center">
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
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { Delete, Edit, Plus, Search, Download } from '@element-plus/icons-vue'
import type { FormInstance, FormRules, /* UploadRequestOptions */ } from 'element-plus'
import { getDeptList, addDept, updateDept, deleteDept, /* importDepartments */ } from '@/api/dept'
import type { DeptItem, DeptResponseData } from '@/types/dept'
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

// 获取部门列表
const fetchData = async () => {
  loading.value = true;
  try {
    console.log('Fetching dept data...');
    const res: ApiResponse<DeptResponseData[]> = await getDeptList();
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
      total.value = tableData.value.length;
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
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  const filtered = tableData.value.filter(item => {
    if (!searchKey.value) return true
    const searchText = searchKey.value.toLowerCase()
    const deptNameMatch = item.deptName?.toLowerCase().includes(searchText)
    const managerMatch = item.manager?.toLowerCase().includes(searchText)
    return deptNameMatch || managerMatch
  })
  total.value = filtered.length
  return filtered.slice(start, end)
})

const handleAdd = () => {
  dialogType.value = 'add'
  dialogVisible.value = true
  Object.assign(formData, {
    id: 0,
    deptName: '',
    manager: '',
    description: '',
    memberCount: 0,
    createTime: ''
  })
  setTimeout(() => {
    formRef.value?.clearValidate()
  }, 0);
}

const handleEdit = (row: DeptItem) => {
  dialogType.value = 'edit'
  dialogVisible.value = true
  Object.assign(formData, JSON.parse(JSON.stringify(row)))
  if (formData.description === '-') {
    formData.description = ''
  }
  setTimeout(() => {
    formRef.value?.clearValidate()
  }, 0);
}

const handleDelete = async (row: DeptItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除部门 ${row.deptName} 吗？ 该部门下的员工将无法关联！`,
      '警告',
      {
        confirmButtonText: '确定删除',
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
    if (error === 'cancel') {
      ElMessage.info('已取消删除')
    } else {
      console.error('删除失败:', error)
      ElMessage.error(error?.message || '删除部门失败')
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
      const backendData = {
        dept_name: formData.deptName,
        manager: formData.manager,
        description: formData.description || undefined
      };

      try {
        let res: ApiResponse<any>;
        if (dialogType.value === 'add') {
          res = await addDept(backendData);
          ElMessage.success('添加成功');
        } else {
          if (!formData.id) {
              ElMessage.error('无法更新：部门ID无效');
              loading.value = false;
              return;
          }
          res = await updateDept(formData.id, backendData);
          ElMessage.success('修改成功');
        }
        if (res && res.code === 200 || res.code === 201) {
            dialogVisible.value = false;
            await fetchData();
        } else {
            ElMessage.error(res?.message || '操作失败');
        }
      } catch (error: any) {
        console.error('操作失败:', error);
        ElMessage.error(`操作失败: ${error.response?.data?.message || error.message || '未知错误'}`);
      } finally {
        loading.value = false;
      }
    }
  });
};

const handleExport = () => {
  const dataToExport = filteredTableData.value.map(item => ({
    '部门名称': item.deptName,
    '部门主管': item.manager,
    '部门人数': item.memberCount,
    '创建时间': item.createTime,
    '部门描述': item.description === '-' ? '' : item.description
  }))
  if (dataToExport.length === 0) {
    ElMessage.warning('没有可导出的数据');
    return;
  }
  exportToExcel(dataToExport, '部门数据')
}

// const beforeUpload = (file: File) => {
//   const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'application/vnd.ms-excel';
//   const isCsv = file.type === 'text/csv';
//   const isLt10M = file.size / 1024 / 1024 < 10;

//   if (!isExcel && !isCsv) {
//     ElMessage.error('上传文件只能是 Excel 或 CSV 格式!');
//     return false;
//   }
//   if (!isLt10M) {
//     ElMessage.error('上传文件大小不能超过 10MB!');
//     return false;
//   }
//   loading.value = true;
//   return true;
// }

// const handleImportRequest = async (options: UploadRequestOptions) => {
//   try {
//     const res = await importDepartments(options.file);
//     console.log("Import API Response:", res);
//     if (res.code === 200) {
//        let notificationMessage = `${res.message || '导入成功'}`;
//        if (res.data && res.data.errors && res.data.errors.length > 0) {
//            let errorDetails = res.data.errors.map((err: any) => `行 ${err.row}: ${err.error || err.errors.join(', ')}`).join('<br>');
//            ElNotification({
//               title: '导入完成（有错误）',
//               dangerouslyUseHTMLString: true,
//               message: `${notificationMessage}<br>以下行未成功导入：<br>${errorDetails}`,
//               type: 'warning',
//               duration: 0
//             });
//        } else {
//            ElMessage.success(notificationMessage);
//        }
//        await fetchData();
//     } else {
//         handleImportError(res); 
//     }
//   } catch (error: any) {
//       console.error('Import error caught:', error);
//       handleImportError(error);
//   } finally {
//     loading.value = false;
//   }
// }

// const handleImportError = (error: any) => {
//   loading.value = false;
//   let title = '导入失败';
//   let message = '发生未知错误';

//   if (error && error.message) {
//     message = error.message;
//   } else if (error && error.response && error.response.data && error.response.data.message) {
//     message = error.response.data.message;
//   } else if (typeof error === 'string') {
//     message = error;
//   }
  
//   const validationErrors = error?.data?.errors || error?.response?.data?.data?.errors;
//   if (validationErrors && Array.isArray(validationErrors) && validationErrors.length > 0) {
//     title = '导入失败（数据错误）';
//     message = `文件中有 ${validationErrors.length} 行数据格式错误，请修正后重试。`;
//     let errorDetails = validationErrors.map((err: any) => `行 ${err.row}: ${err.error || err.errors.join(', ')}`).join('<br>');
//       ElNotification({
//         title: title,
//         dangerouslyUseHTMLString: true,
//         message: `${message}<br>错误详情:<br>${errorDetails}`,
//         type: 'error',
//         duration: 0
//       });
//       return;
//   }

//   ElMessage.error(`${title}: ${message}`);
// }
</script>

<style lang="scss" scoped>
.dept-container {
  padding: 20px;
  background-color: var(--el-bg-color-page);
  min-height: calc(100vh - 84px); /* Adjust based on layout */
  transition: background-color 0.3s;
}

.operation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap; /* Allow wrapping */
  gap: 10px;
}

.filter-items {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.search-input {
  width: 250px;
}

.operation-buttons {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dept-table {
  width: 100%;
  margin-bottom: 20px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  background-color: var(--el-bg-color-overlay); /* Light mode background */
  padding: 10px 15px;
  border-radius: 4px;
  margin-top: 20px;
  transition: background-color 0.3s;
}

/* Style adjustments for buttons inside upload (if needed) */
.operation-buttons .el-upload {
  margin: 0; /* Reset margin if default causes layout issues */
}

/* Remove specific dark-component-bg rules */


</style>