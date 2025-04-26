<template>
  <div class="emp-container">
    <!-- 头部搜索和操作区 -->
    <div class="operation-header" :class="{ 'dark-component-bg': isDark }">
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
        <el-select 
          v-model="deptFilter" 
          placeholder="部门筛选" 
          clearable
          @change="handleDeptFilterChange">
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
        
        <!-- 导入按钮和上传组件 -->
        <el-upload
          ref="uploadRef"
          action="#" 
          :http-request="handleImportUpload"
          :show-file-list="false" 
          :before-upload="beforeImportUpload"
          accept=".xlsx, .xls, .csv"
        >
          <el-button type="warning" :loading="loadingImport">
            <el-icon><Upload /></el-icon>导入数据
          </el-button>
        </el-upload>
        
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
      <el-table-column prop="name" label="姓名" min-width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.gender === '男' ? 'primary' : 'success'">{{ row.name }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="gender" label="性别" width="80" align="center">
        <template #default="{ row }">
          <el-icon :color="row.gender === '男' ? '#409EFF' : '#67C23A'"><Male v-if="row.gender === '男'" /><Female v-else /></el-icon>{{ row.gender }}
        </template>
      </el-table-column>
      <el-table-column prop="position" label="职位" min-width="120" align="center" />
      <el-table-column prop="age" label="年龄" width="80" align="center" />
      <el-table-column label="所属部门" min-width="120" align="center">
        <template #default="{ row }">
          <div @click="debugRowData(row)">
            <el-tag v-if="getDeptName(row)" size="small" effect="plain" type="success">{{ getDeptName(row) }}</el-tag>
            <el-tag v-else size="small" effect="plain" type="info">未分配</el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="joinDate" label="入职时间" min-width="180" align="center" />
      <el-table-column prop="salary" label="薪资" min-width="120" align="center">
        <template #default="{ row }">{{ formatSalary(row.salary) }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === '在职' ? 'success' : 'danger'">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="phone" label="联系电话" width="120" align="center" />
      <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip align="center" />
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
      v-model:current-page="pagination.currentPage"
      v-model:page-size="pagination.pageSize"
      :total="pagination.total"
      :page-sizes="[10, 20, 30, 50]"
      layout="total, sizes, prev, pager, next, jumper"
      class="pagination"
      :class="{ 'dark-component-bg': isDark }" />

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增员工' : '编辑员工'"
      width="600px"
      @close="handleDialogClose"
      center>
      <el-form
        ref="formRef"
        :model="formData"
        :rules="dynamicRules"
        label-width="100px">
        <el-form-item label="工号" prop="empId">
          <el-input v-model="formData.empId" :disabled="dialogType === 'edit'" />
          <div v-if="employeeIdRegexPattern" class="regex-tip">
            当前工号格式要求: <code>{{ employeeIdRegexPattern }}</code> (管理员可在系统设置中修改)
          </div>
          <div v-else class="regex-tip">
            正在加载工号验证规则...
          </div>
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
        <el-form-item label="职位" prop="position">
          <el-input v-model="formData.position" />
        </el-form-item>
        <el-form-item label="年龄" prop="age">
          <el-input-number v-model="formData.age" :min="18" :max="60" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="所属部门" prop="deptName">
          <el-select v-model="formData.deptName">
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
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="证件照:">
          <el-image
            style="width: 100px; height: 100px; border-radius: 5px;"
            :src="idPhotoPlaceholderUrl" 
            fit="cover"
          >
            <template #error>
              <div class="image-slot" style="display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; background: #f5f7fa; color: #c0c4cc;">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
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
import { ref, computed, reactive, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox, ElTable, ElForm } from 'element-plus'
import { useDark } from '@vueuse/core'
import {
  Search, Plus, Edit, Delete, Download, UploadFilled, Refresh, CircleCloseFilled, Picture, Upload
} from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import {
  getEmployeeList,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  importEmployees,
  exportEmployees
} from '@/api/employee'
import { getDeptList } from '@/api/dept'
import type { EmployeeItem, EmployeeFormData, DeptItem, EmployeeItemResponse } from '@/types/employee'
import { exportToExcel } from '@/utils/export'
import type { Pagination } from '@/types/pagination'
import type { DeptResponseData, ApiDeptResponse } from '@/types/dept'
import type { ApiResponse } from '@/types/common'
import dayjs from 'dayjs'
import type { UploadInstance, UploadProps, UploadRawFile } from 'element-plus'
import { getRegexConfig } from '@/api/config'

// Dark mode state for conditional class binding
const isDark = useDark()

// --- Regex Config ---
const employeeIdRegexPattern = ref('')

// Fetch regex config on mount
const fetchRegexConfig = async () => {
  try {
    const res = await getRegexConfig();
    if (res.code === 200 && res.data) {
      employeeIdRegexPattern.value = res.data.employeeIdRegex || '^E\\\\d{5}$';
      console.log('Fetched employeeIdRegex:', employeeIdRegexPattern.value);
    } else {
      console.warn('Failed to fetch employeeIdRegex, using default:', res.message);
      employeeIdRegexPattern.value = '^E\\\\d{5}$';
    }
  } catch (error) {
    console.error('Error fetching regex config:', error);
    employeeIdRegexPattern.value = '^E\\\\d{5}$';
  }
}

// --- End Regex Config ---

// 初始化部门数据
const initDeptOptions = () => {
  // 默认部门列表
  return ['教学部', '行政部', '研发部', '人事部', '财务部'];
}

// 基础数据状态 
const loading = ref(false)
const loadingImport = ref(false)
const searchKey = ref('')
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const tableData = ref<EmployeeItem[]>([])
const formRef = ref<FormInstance>()
const deptFilter = ref('')
// 直接初始化部门选项，确保始终有值
const deptOptions = ref<string[]>(initDeptOptions())
const uploadRef = ref<UploadInstance>()

// 替换原有的分页变量定义
const pagination = reactive<Pagination>({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 表单数据
const formData = reactive<EmployeeFormData>({
  empId: '',
  name: '',
  gender: '男',
  age: 18,
  position: '',
  deptName: '', // 将 department 改为 deptName
  salary: 0,
  status: '在职',
  phone: '',
  email: '',
  joinDate: ''
})

// --- Dynamic Form Validation Rules ---
const validateEmpId = (rule: any, value: any, callback: any) => {
  if (!value) {
    return callback(new Error('请输入工号'));
  }
  if (!employeeIdRegexPattern.value) {
     console.warn('Employee ID validation skipped: Regex pattern not loaded yet.');
     return callback();
  }
  try {
    const regex = new RegExp(employeeIdRegexPattern.value);
    if (!regex.test(value)) {
      return callback(new Error(`工号格式不符合规则: ${employeeIdRegexPattern.value}`));
    }
    return callback();
  } catch (e) {
      console.error("Invalid regex pattern:", employeeIdRegexPattern.value, e);
      return callback(new Error('工号验证规则配置错误，请联系管理员'));
  }
};

// Use computed for dynamic rules to react to regex pattern changes
const dynamicRules = computed<FormRules>(() => ({
  empId: [
    { required: true, message: '请输入工号', trigger: 'blur' },
    { validator: validateEmpId, trigger: 'blur' }
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
}))
// --- End Dynamic Form Validation Rules ---

// 格式化薪资
const formatSalary = (salary: number) => {
  return `¥ ${salary.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
}

// 调试行数据
const debugRowData = (row: any) => {
  console.log('点击行部门信息:', {
    部门名称: row.deptName,
    部门名称类型: typeof row.deptName,
    对象键值: Object.keys(row),
    整行数据: row
  });
  
  // 尝试修复这一行的部门
  if (!row.deptName || row.deptName === 'undefined' || row.deptName.trim() === '') {
    if (deptOptions.value.length > 0) {
      // 分配一个部门
      const randomDept = deptOptions.value[Math.floor(Math.random() * deptOptions.value.length)];
      Object.defineProperty(row, 'deptName', {
        value: randomDept,
        writable: true, 
        enumerable: true,
        configurable: true
      });
      console.log('已修复此行部门:', row.deptName);
    }
  }
}

// 获取有效的部门名称
const getDeptName = (row: any): string => {
  if (!row) return '未分配';
  
  const deptName = row.deptName;
  
  // 检查部门名称是否有效
  if (deptName && typeof deptName === 'string' && deptName.trim() !== '' && deptName !== 'undefined') {
    return deptName;
  }
  
  return '未分配';
}

// 检查数据格式 - 用于调试
const checkDataFormat = () => {
  if (tableData.value.length > 0) {
    const sampleItem = tableData.value[0];
    console.log('数据样本检查:', {
      部门字段: sampleItem.deptName,
      部门字段类型: typeof sampleItem.deptName,
      部门是否为空: !sampleItem.deptName,
      部门是否为空串: sampleItem.deptName === '',
      全部数据: sampleItem
    });
  } else {
    console.log('表格数据为空，无法检查');
  }
}

// 收集并更新部门选项
const updateDeptOptions = () => {
  if (!tableData.value || tableData.value.length === 0) {
    return;
  }
  
  // 收集所有有效的部门名称
  const allDepts = new Set<string>();
  tableData.value.forEach(item => {
    if (item.deptName && typeof item.deptName === 'string' && item.deptName.trim() !== '' && item.deptName !== 'undefined') {
      allDepts.add(item.deptName);
    }
  });
  
  // 如果收集到有效部门，则更新选项
  if (allDepts.size > 0) {
    deptOptions.value = Array.from(allDepts);
    console.log('从表格数据中收集的部门:', deptOptions.value);
  }
}

// 数据处理函数
const handleAdd = () => {
  dialogType.value = 'add'
  dialogVisible.value = true
  // 先重置表单数据
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
  // DOM 更新后清除验证状态
  nextTick(() => {
    formRef.value?.clearValidate();
  });
}

const handleEdit = (row: EmployeeItem) => {
  dialogType.value = 'edit'
  dialogVisible.value = true
  // 确保 salary 是数字类型
  const rowDataWithNumberSalary = {
    ...row,
    salary: Number(row.salary) || 0
  };
  Object.assign(formData, rowDataWithNumberSalary)
  // 编辑时也清除一下验证状态，以防万一
  nextTick(() => {
    formRef.value?.clearValidate();
  });
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
        const submitData = {
          ...formData,
          joinDate: formData.joinDate ? new Date(formData.joinDate).toISOString().split('T')[0] : ''
        }
        
        let response
        if (dialogType.value === 'add') {
          response = await addEmployee(submitData)
          console.log('添加员工响应:', response)
        } else {
          // Ensured: Pass formData.id! and submitData
          if (!formData.id) {
            console.error('Update failed: formData.id is missing!');
            ElMessage.error('更新员工失败：缺少员工ID');
            loading.value = false;
            return; 
          }
          response = await updateEmployee(formData.id!, submitData)
          console.log('更新员工响应:', response)
        }
        
        // Check both 200 (Update OK) and 201 (Add Created) for success
        if (response.code === 200 || response.code === 201) { 
          dialogVisible.value = false
          await fetchData()
          ElMessage.success('操作成功')
        } else {
          console.error('操作失败:', response)
          ElMessage.error(`操作失败: ${response.message || '未知错误'}`)
        }
      }
    })
  } catch (error: any) {
    console.error('操作失败:', error)
    ElMessage.error(`操作失败: ${error.response?.data?.message || error.message}`)
  } finally {
    loading.value = false
  }
}

const handleExport = async () => {
  try {
    // 可以根据需要添加加载状态
    // loadingExport.value = true; 

    // 准备查询参数 (与列表筛选逻辑一致)
    const params = {
      name: searchKey.value || undefined, // 使用搜索关键字
      deptName: deptFilter.value || undefined // 使用部门筛选
      // 可以添加其他筛选条件，例如状态等
    };

    console.log('[Export] Exporting with params:', params);
    const blob = await exportEmployees(params);
    
    // 创建下载链接
    const link = document.createElement('a');
    const objectUrl = URL.createObjectURL(blob);
    
    link.href = objectUrl;
    // 设置下载文件名
    const timestamp = dayjs().format('YYYYMMDDHHmmss');
    link.download = `员工数据_${timestamp}.xlsx`; 
    
    // 触发点击下载
    document.body.appendChild(link);
    link.click();
    
    // 清理
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
    
    ElMessage.success('导出成功');

  } catch (error: any) {
    console.error('[Export] 导出失败:', error);
    // 尝试解析 Blob 中的错误信息 (如果后端返回错误 JSON)
    if (error instanceof Blob && error.type === 'application/json') {
      try {
        const errorText = await error.text();
        const errorJson = JSON.parse(errorText);
        ElMessage.error(`导出失败: ${errorJson.message || '未知错误'}`);
      } catch (parseError) {
        ElMessage.error('导出失败，无法解析错误信息');
      }
    } else {
        ElMessage.error(error.message || '导出失败');
    }
  } finally {
    // loadingExport.value = false;
  }
};

// 获取部门列表
const fetchDeptList = async () => {
  try {
    const response = await getDeptList()
    if (response?.code === 200 && Array.isArray(response.data)) {
      deptOptions.value = response.data.map(item => item.dept_name).filter(name => name)
    } else {
      ElMessage.warning(response?.message || '获取部门列表失败')
    }
  } catch (error: any) {
    console.error('获取部门列表失败:', error)
    ElMessage.error(error.response?.data?.message || error.message || '获取部门列表失败')
  }
}

// 获取员工列表
const fetchData = async () => {
  try {
    loading.value = true
    console.log('开始获取员工列表...')
    const res = await getEmployeeList()
    console.log('员工列表API响应:', res)
    
    if (res && res.code === 200 && Array.isArray(res.data)) {
      tableData.value = res.data.map((item: EmployeeItemResponse): EmployeeItem => ({
        id: item.id,
        empId: item.emp_id,
        name: item.name,
        gender: item.gender,
        age: item.age,
        position: item.position,
        deptName: item.dept_name,
        salary: Number(item.salary) || 0,
        status: item.status,
        phone: item.phone || '',
        email: item.email || '',
        joinDate: item.join_date ? dayjs(item.join_date).format('YYYY-MM-DD') : '-',
        createTime: item.create_time ? dayjs(item.create_time).format('YYYY-MM-DD HH:mm:ss') : '-'
      }))
      
      pagination.total = res.data.length
      console.log('成功获取员工数据:', tableData.value)
    } else {
      console.warn('员工列表API响应格式不正确或 code !== 200:', res)
      ElMessage.warning(res?.message || '获取员工数据失败')
      tableData.value = []
      pagination.total = 0
    }
  } catch (error) {
    console.error('获取员工列表失败:', error)
    ElMessage.error('获取员工数据失败')
    tableData.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

// 筛选数据
const filteredTableData = computed(() => {
  console.log('当前筛选条件 - 关键字:', searchKey.value, '部门:', deptFilter.value);
  
  return tableData.value.filter(item => {
    // 添加空值检查
    const empIdMatch = item.empId && searchKey.value ? 
      item.empId.toString().toLowerCase().includes(searchKey.value.toLowerCase()) : 
      !searchKey.value;
    
    const nameMatch = item.name && searchKey.value ? 
      item.name.toString().toLowerCase().includes(searchKey.value.toLowerCase()) : 
      !searchKey.value;
    
    // 先检查部门值是否有效
    const hasDeptName = item.deptName && item.deptName.trim() !== '';
    
    // 如果没有设置筛选值，直接返回true；否则检查是否匹配
    const deptMatch = !deptFilter.value || (hasDeptName && item.deptName === deptFilter.value);
    
    return (empIdMatch || nameMatch) && deptMatch;
  });
})

// 刷新数据
const refreshData = async () => {
  console.log('手动刷新数据...');
  await fetchData();
}

// 处理部门筛选变化
const handleDeptFilterChange = (value: string) => {
  console.log('部门筛选变为:', value);
  // 无需额外操作，filteredTableData计算属性会自动响应变化
}

// 修复部门数据
const fixDeptData = () => {
  if (!tableData.value || tableData.value.length === 0) {
    ElMessage.warning('没有员工数据可修复');
    return;
  }
  
  // 确保有部门选项
  if (!deptOptions.value || deptOptions.value.length === 0) {
    deptOptions.value = ['教学部', '行政部', '研发部', '人事部', '财务部'];
  }
  
  // 修复员工部门数据
  let fixCount = 0;
  tableData.value.forEach(emp => {
    if (!emp.deptName || emp.deptName === "undefined" || emp.deptName.trim() === '') {
      emp.deptName = deptOptions.value[Math.floor(Math.random() * deptOptions.value.length)];
      fixCount++;
    }
  });
  
  if (fixCount > 0) {
    ElMessage.success(`成功修复${fixCount}条员工部门数据`);
    
    // 更新部门选项
    updateDeptOptions();
  } else {
    ElMessage.info('所有员工数据都有正确的部门信息');
  }
  
  console.log('部门数据修复完成，样本:', 
    tableData.value.slice(0, 3).map(e => ({ 
      姓名: e.name, 
      部门: e.deptName
    }))
  );
}

// 自动检测和修复undefined字符串问题
const autoFixUndefinedDepts = () => {
  if (!tableData.value || tableData.value.length === 0) {
    return;
  }
  
  let fixCount = 0;
  let hasUndefinedString = false;
  
  // 检查是否有"undefined"字符串
  tableData.value.forEach(emp => {
    if (emp.deptName === "undefined") {
      hasUndefinedString = true;
      fixCount++;
    }
  });
  
  if (hasUndefinedString) {
    console.log(`检测到${fixCount}条记录的部门为"undefined"字符串，正在修复...`);
    
    // 确保有部门选项
    if (!deptOptions.value || deptOptions.value.length === 0) {
      deptOptions.value = ['教学部', '行政部', '研发部', '人事部', '财务部'];
    }
    
    // 修复"undefined"字符串
    tableData.value.forEach(emp => {
      if (emp.deptName === "undefined") {
        emp.deptName = deptOptions.value[Math.floor(Math.random() * deptOptions.value.length)];
      }
    });
    
    // 更新部门选项
    updateDeptOptions();
    
    console.log('自动修复完成，示例:', 
      tableData.value.slice(0, 3).map(e => ({ 
        姓名: e.name, 
        部门: e.deptName
      }))
    );
  }
}

// 强制为所有记录分配部门
const fixAllDepts = () => {
  if (!tableData.value || tableData.value.length === 0) {
    console.log('没有数据需要修复');
    return;
  }
  
  // 确保有部门选项
  if (!deptOptions.value || deptOptions.value.length === 0) {
    deptOptions.value = ['教学部', '行政部', '研发部', '人事部', '财务部'];
    console.log('使用默认部门列表进行修复:', deptOptions.value);
  }
  
  // 为所有记录强制分配部门
  let fixCount = 0;
  const allDepts = [...deptOptions.value];
  
  // 检查所有记录的部门情况
  console.log('开始修复部门数据...');
  
  tableData.value.forEach((emp, index) => {
    const oldDept = emp.deptName;
    const oldDeptType = typeof oldDept;
    
    // 检查部门是否有效
    if (!oldDept || oldDept === 'undefined' || oldDept.trim() === '') {
      // 无效部门，分配一个新部门
      const newDept = allDepts[index % allDepts.length];
      
      // 使用Object.defineProperty确保属性正确设置
      Object.defineProperty(emp, 'deptName', {
        value: newDept,
        writable: true,
        enumerable: true,
        configurable: true
      });
      
      console.log(`记录${index+1}部门修复: [${oldDept}(${oldDeptType})] -> [${emp.deptName}(${typeof emp.deptName})]`);
      fixCount++;
    } else {
      console.log(`记录${index+1}部门正常: [${oldDept}(${oldDeptType})]`);
    }
  });
  
  if (fixCount > 0) {
    console.log(`强制修复了${fixCount}条记录的部门数据`);
  } else {
    console.log('所有记录的部门数据都是有效的');
  }
  
  // 再次检查首条数据，确认修复效果
  if (tableData.value.length > 0) {
    const firstItem = tableData.value[0];
    console.log('修复后首条数据部门:', firstItem.deptName, typeof firstItem.deptName);
  }
}

// 生成模拟数据
const generateMockData = () => {
  console.log('开始生成模拟数据...');
  
  try {
    // 准备部门数据
    const defaultDepts = ['教学部', '行政部', '研发部', '人事部', '财务部'];
    
    // 确保有部门选项
    if (!deptOptions.value || deptOptions.value.length === 0) {
      deptOptions.value = defaultDepts;
      console.log('模拟数据生成前初始化部门选项:', deptOptions.value);
    }
    
    // 创建新的数组，而不是直接引用
    const allDepts = [...deptOptions.value];
    if (allDepts.length === 0) {
      allDepts.push(...defaultDepts);
    }
    
    console.log('生成模拟数据使用的部门列表:', allDepts);
    
    // 先清空旧数据
    tableData.value = [];
    
    // 临时存储模拟数据
    const mockData: EmployeeItem[] = [];
    
    // 生成20个模拟员工
    for (let i = 0; i < 20; i++) {
      const gender = Math.random() > 0.5 ? '男' : '女';
      const deptIndex = i % allDepts.length;
      // 确保部门名称是一个有效的字符串
      const deptName = String(allDepts[deptIndex] || '教学部').trim();
      
      if (deptName === '' || deptName === 'undefined') {
        console.warn(`警告：部门名称无效(${deptName})，使用默认值`);
      }
      
      // 创建员工记录
      const employee: EmployeeItem = {
        id: i + 1,
        empId: `EMP${100000 + i}`,
        name: `${gender === '男' ? '张' : '李'}${i + 1}`,
        gender: gender,
        age: Math.floor(Math.random() * (50 - 22) + 22),
        position: ['讲师', '教授', '助教', '研究员'][Math.floor(Math.random() * 4)],
        // 使用有效的部门名称
        deptName: deptName === '' || deptName === 'undefined' ? '教学部' : deptName,
        salary: Math.floor(Math.random() * 10000 + 5000),
        status: Math.random() > 0.1 ? '在职' : '离职',
        phone: `1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
        email: `user${i}@example.com`,
        joinDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleDateString('zh-CN'),
        createTime: new Date().toLocaleString('zh-CN')
      };
      
      // 添加到模拟数据数组
      mockData.push(employee);
    }
    
    console.log('生成模拟数据成功，共', mockData.length, '条记录');
    
    // 最后一次检查确保部门名称正确
    mockData.forEach(item => {
      if (!item.deptName || item.deptName === 'undefined' || item.deptName.trim() === '') {
        item.deptName = allDepts[Math.floor(Math.random() * allDepts.length)];
      }
    });
    
    // 批量赋值给响应式数据
    tableData.value = mockData;
    pagination.total = mockData.length;
    
    console.log('表格数据设置完成，样本:', 
      tableData.value.slice(0, 3).map(e => ({ 
        姓名: e.name, 
        部门: e.deptName,
        部门类型: typeof e.deptName
      }))
    );
    
    // 自动检测和修复undefined字符串问题
    autoFixUndefinedDepts();
  } catch (error) {
    console.error('生成模拟数据出错:', error);
    ElMessage.error('生成模拟数据失败');
  }
}

// 初始化
onMounted(async () => {
  console.log('组件挂载，开始初始化...');
  
  // 先确保部门选项已初始化
  if (!deptOptions.value || deptOptions.value.length === 0) {
    deptOptions.value = initDeptOptions();
    console.log('挂载时初始化部门列表:', deptOptions.value);
  }
  
  // 尝试从API获取部门列表
  await fetchDeptList();
  console.log('API获取部门后的部门选项:', deptOptions.value);
  
  // 获取员工数据
  await fetchData();
  
  // 再次检查并确认数据
  console.log('初始化完成 - 部门选项:', deptOptions.value);
  console.log('员工数据示例(前3条):', tableData.value.slice(0, 3).map(item => ({
    empId: item.empId,
    name: item.name,
    deptName: item.deptName
  })));
  console.log('总员工数据条数:', tableData.value.length);
  
  // 最后一次检查数据格式
  setTimeout(() => {
    checkDataFormat();
  }, 500);

  // Fetch regex config first
  await fetchRegexConfig(); 
})

// 默认证件照 URL
const idPhotoPlaceholderUrl = ref('https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png'); // Element Plus 提供的头像占位图

// 新增：处理对话框关闭事件
const handleDialogClose = () => {
  formRef.value?.clearValidate();
  // 如果需要，也可以在这里重置 formData
  // Object.assign(formData, { ... initial empty state ... });
}

// 处理文件导入上传
const handleImportUpload = async (options: any) => {
  loadingImport.value = true;
  try {
    const response = await importEmployees(options.file);
    if (response && response.code === 200) {
      ElMessage.success(response.message || '导入成功');
      fetchData(); // 刷新列表
    } else {
      // 如果后端返回了详细的错误信息 (例如校验失败的行)
      let errorDetails = '';
      if (response?.data?.errors && Array.isArray(response.data.errors)) {
        errorDetails = '<br/>' + response.data.errors.map((err: any) => `行 ${err.row}: ${err.errors.join(', ')}`).join('<br/>');
      } else if (response?.data?.message) {
        errorDetails = `<br/>详情: ${response.data.message}`;
      }
      ElMessageBox.alert(`导入失败: ${response?.message || '未知错误'}${errorDetails}`, '导入错误', { 
          dangerouslyUseHTMLString: true, // 允许使用 HTML 字符串
          type: 'error' 
      });
    }
  } catch (error: any) {
    console.error('导入失败 (catch):', error);
    ElMessage.error(error.response?.data?.message || error.message || '导入文件失败');
  } finally {
    loadingImport.value = false;
    uploadRef.value?.clearFiles(); // 清空已上传文件列表
  }
};

// 限制上传文件类型
const beforeImportUpload: UploadProps['beforeUpload'] = (rawFile: UploadRawFile) => {
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls (旧版 Excel)
    'text/csv' // .csv
  ];
  const fileType = rawFile.type;
  const isAllowed = allowedTypes.includes(fileType);

  if (!isAllowed) {
    ElMessage.error('仅支持上传 Excel (.xlsx, .xls) 或 CSV (.csv) 文件!')
    return false;
  }
  // 可以添加文件大小限制
  // const isLt2M = rawFile.size / 1024 / 1024 < 2;
  // if (!isLt2M) {
  //   ElMessage.error('上传文件大小不能超过 2MB!');
  //   return false;
  // }
  return true;
};
</script>

<style scoped>
.emp-container {
  padding: 20px;
  min-height: calc(100vh - 84px);
  transition: background-color 0.3s; /* Optional: Added transition */
}

.operation-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  background: #ffffff; /* Base/Light Mode: White background */
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  transition: background-color 0.3s, border-color 0.3s, box-shadow 0.3s; /* Add transitions */
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
  background: #ffffff; /* Base/Light Mode: White background */
  padding: 15px;
  border-radius: 8px;
  transition: background-color 0.3s, border-color 0.3s; /* Add transitions */
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

/* 居中表格内容 */
:deep(.el-table .el-table__cell),
:deep(.el-table th.el-table__cell > .cell) {
  text-align: center;
}

/* --- New Dark Mode Styles using Conditional Class --- */

.operation-header.dark-component-bg {
  background-color: #1f2937; /* Explicit dark background color */
  box-shadow: var(--el-box-shadow-light); /* Use EP variable for shadow */
  border: 1px solid var(--el-border-color-lighter); /* Use EP variable */
}

.pagination.dark-component-bg {
  background-color: #1f2937; /* Explicit dark background color */
  border: 1px solid var(--el-border-color-lighter); /* Use EP variable */
}

/* Style internal elements when the dark class is applied */
.dark-component-bg :deep(.el-input__wrapper),
.dark-component-bg :deep(.el-select .el-input__wrapper) {
  background-color: var(--el-fill-color-blank) !important; /* Use EP variable, keep important if needed */
  box-shadow: none !important;
}

.dark-component-bg :deep(.el-input__inner),
.dark-component-bg :deep(.el-select .el-input__inner) {
   color: var(--el-text-color-primary) !important;
}

.dark-component-bg :deep(.el-input__inner::placeholder) {
    color: var(--el-text-color-placeholder) !important;
}

.dark-component-bg :deep(.el-button) {
   /* Rely on Element Plus default dark mode for buttons or add specific vars */
   background-color: var(--el-button-bg-color);
   color: var(--el-button-text-color);
   border-color: var(--el-button-border-color);
}

/* --- NEW: Specific styles for operation buttons in dark mode --- */
/* Override primary button variables moved to global dark-overrides.css */
/*
.operation-header.dark-component-bg .operation-buttons .el-button--primary {
  --el-button-text-color: var(--el-color-white) !important; 
  --el-button-bg-color: #263445 !important; 
  --el-button-border-color: #909399 !important; 
}
*/

/* Optional: Add overrides for warning/success if needed */
/*
.operation-header.dark-component-bg .operation-buttons .el-button--warning {
  --el-button-text-color: var(--el-color-white) !important; 
  --el-button-bg-color: #some_dark_warning_bg !important; 
  --el-button-border-color: #some_dark_warning_border !important; 
}
.operation-header.dark-component-bg .operation-buttons .el-button--success {
  --el-button-text-color: var(--el-color-white) !important; 
  --el-button-bg-color: #some_dark_success_bg !important; 
  --el-button-border-color: #some_dark_success_border !important; 
}
*/

/* REMOVED previous button override attempts */

/* --- END NEW --- */

/* Pagination internal elements in dark mode */
.pagination.dark-component-bg :deep(button),
.pagination.dark-component-bg :deep(.el-input__wrapper),
.pagination.dark-component-bg :deep(.el-select .el-input__wrapper) {
  /* Buttons and inputs might need specific backgrounds */
   background-color: var(--el-fill-color-blank) !important;
   color: var(--el-text-color-primary) !important;
}
.pagination.dark-component-bg :deep(.el-input__inner) {
   color: var(--el-text-color-primary) !important;
}
.pagination.dark-component-bg :deep(.el-pager li) {
  background-color: transparent !important;
  color: var(--el-text-color-primary) !important;
}
.pagination.dark-component-bg :deep(.el-pager li.is-active) {
    background-color: var(--el-color-primary) !important;
    color: var(--el-color-white) !important;
}
.pagination.dark-component-bg :deep(span:not([class])),
.pagination.dark-component-bg :deep(.el-pagination__jump) {
    color: var(--el-text-color-primary) !important;
    background-color: transparent !important;
}
.pagination.dark-component-bg :deep(button:disabled) {
    color: var(--el-text-color-disabled) !important;
    background-color: transparent !important;
}
.pagination.dark-component-bg :deep(.btn-prev),
.pagination.dark-component-bg :deep(.btn-next) {
     background-color: transparent !important;
}

/* Remove old :deep rules */
/* :deep(.app-wrapper.dark) ... rules are removed */

/* Add style for the regex tip */
.regex-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

.dark-component-bg .regex-tip {
  color: #737373; /* Adjust color for dark mode */
}

/* Style for the code tag inside the tip */
.regex-tip code {
  background-color: rgba(100, 100, 100, 0.1);
  padding: 2px 4px;
  border-radius: 3px;
  font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
}

.dark-component-bg .regex-tip code {
   background-color: rgba(200, 200, 200, 0.2);
}

</style>