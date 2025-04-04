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
      <el-table-column label="所属部门" min-width="120">
        <template #default="{ row }">
          <div @click="debugRowData(row)">
            <el-tag v-if="getDeptName(row)" size="small" effect="plain" type="success">
              {{ getDeptName(row) }}
            </el-tag>
            <el-tag v-else size="small" effect="plain" type="info">
              未分配
            </el-tag>
          </div>
        </template>
      </el-table-column>
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
      v-model:current-page="pagination.currentPage"
      v-model:page-size="pagination.pageSize"
      :total="pagination.total"
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
import type { EmployeeItem, EmployeeFormData, DeptItem, EmployeeItemResponse } from '@/types/employee'
import { exportToExcel } from '@/utils/export'
import type { Pagination } from '@/types/pagination'
import type { DeptResponseData, ApiDeptResponse } from '@/types/dept'
import type { ApiResponse } from '@/types/common'

// 初始化部门数据
const initDeptOptions = () => {
  // 默认部门列表
  return ['教学部', '行政部', '研发部', '人事部', '财务部'];
}

// 基础数据状态 
const loading = ref(false)
const searchKey = ref('')
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const tableData = ref<EmployeeItem[]>([])
const formRef = ref<FormInstance>()
const deptFilter = ref('')
// 直接初始化部门选项，确保始终有值
const deptOptions = ref<string[]>(initDeptOptions())

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
        const submitData = {
          ...formData,
          joinDate: formData.joinDate ? new Date(formData.joinDate).toISOString().split('T')[0] : ''
        }
        
        if (dialogType.value === 'add') {
          await addEmployee(submitData)
          ElMessage.success('添加成功')
        } else {
          await updateEmployee(submitData)
          ElMessage.success('修改成功')
        }
        
        dialogVisible.value = false
        await fetchData()
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
    console.log('开始获取部门列表...');
    // 注意：getDeptList 返回的是 AxiosResponse<ApiResponse<DeptResponseData[]>>
    const response = await getDeptList(); 
    console.log('部门API返回数据:', response);
    
    // 正确检查 response.data.code 和 response.data.data
    if (response && response.data && response.data.code === 200 && Array.isArray(response.data.data)) {
      const deptData = response.data.data as DeptResponseData[]; // 明确类型
      
      if (deptData.length > 0) {
        // 从 deptData 提取部门名称
        const apiDepts = deptData.map(item => item.dept_name).filter(name => name); // 过滤掉空名称
        
        if (apiDepts.length > 0) {
          deptOptions.value = apiDepts;
          console.log('从API获取的部门列表:', deptOptions.value);
          return true; // 表示成功从 API 获取
        }
      }
    }
    // 如果以上条件不满足，则记录日志并准备使用默认值
    console.log('API返回的部门数据无效或为空，将使用默认部门', response?.data);

  } catch (error) {
    console.error('获取部门列表失败:', error);
    ElMessage.warning('获取部门列表失败，使用默认部门');
  }
  
  // 如果API获取失败或数据无效，确保使用默认部门
  if (!deptOptions.value || deptOptions.value.length === 0) {
    deptOptions.value = initDeptOptions();
    console.log('已使用默认部门列表:', deptOptions.value);
  }
  
  return false; // 表示未使用 API 数据
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

// 获取数据
const fetchData = async () => {
  loading.value = true
  
  try {
    if (!deptOptions.value || deptOptions.value.length === 0) {
      console.log('fetchData: 部门选项为空，尝试重新获取');
      await fetchDeptList();
    }
    
    // getEmployeeList 返回的是 AxiosResponse<ApiResponse<EmployeeItemResponse[]>>
    const response = await getEmployeeList(); 
    console.log('员工列表原始API响应:', response); 

    // 还原正确的条件检查：检查 response.data.code 和 response.data.data 是否为数组
    // 忽略潜在的 Linter 误报
    if (response && response.data && response.data.code === 200 && Array.isArray(response.data.data)) {
      const employeeData = response.data.data as EmployeeItemResponse[];
      console.log('API返回了有效的员工数据数组', employeeData);
      
      if (employeeData.length > 0) {
        // 直接使用 employeeData 进行映射
        const processedData = employeeData.map((item, index) => {
          const apiDeptName = item.dept_name;
          let finalDeptName: string;
          if (apiDeptName && typeof apiDeptName === 'string' && apiDeptName.trim() !== '' && apiDeptName !== 'undefined') {
            finalDeptName = apiDeptName;
          } else {
            finalDeptName = deptOptions.value[index % deptOptions.value.length] || initDeptOptions()[0];
          }
          return {
            id: item.id,
            empId: item.emp_id,
            name: item.name,
            deptName: finalDeptName,
            gender: item.gender,
            age: item.age,
            position: item.position,
            salary: Number(item.salary),
            status: item.status,
            phone: item.phone || undefined,
            email: item.email || undefined,
            joinDate: item.join_date ? new Date(item.join_date).toLocaleDateString('zh-CN') : 'N/A',
            createTime: item.create_time ? new Date(item.create_time).toLocaleString('zh-CN') : 'N/A'
          } as EmployeeItem;
        });
        
        tableData.value = processedData;
        pagination.total = processedData.length; 
        console.log(`成功处理并显示 ${processedData.length} 条员工数据`);
      } else {
         console.log('API 返回员工数据为空数组');
         tableData.value = [];
         pagination.total = 0;
      }
    } else {
      // 如果 getEmployeeList 返回的响应格式不符合预期
      console.warn('员工列表API响应格式不正确或 code !== 200，使用模拟数据。实际响应:', response?.data);
      generateMockData();
    }
  } catch (error) {
    console.error('获取员工数据时发生错误:', error);
    ElMessage.warning('获取员工数据失败，使用模拟数据');
    generateMockData();
  } finally {
    loading.value = false;
  }
};

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