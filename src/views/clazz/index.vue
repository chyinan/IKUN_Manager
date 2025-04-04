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

    <!-- 班级详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="班级详情"
      width="700px">
      <div v-if="currentClass" class="class-detail">
        <!-- 班级基本信息卡片 -->
        <el-card class="info-card">
          <template #header>
            <div class="card-header">
              <span>基本信息</span>
            </div>
          </template>
          <div class="info-content">
            <div class="info-item">
              <span class="info-label">班级名称：</span>
              <span class="info-value">{{ currentClass.className }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">班主任：</span>
              <span class="info-value">{{ currentClass.teacher }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">学生人数：</span>
              <span class="info-value">
                <el-tag :type="currentClass.studentCount > 30 ? 'danger' : 'success'">
                  {{ currentClass.studentCount }}人
                </el-tag>
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">创建时间：</span>
              <span class="info-value">{{ currentClass.createTime }}</span>
            </div>
            <div class="info-item" v-if="currentClass.description">
              <span class="info-label">描述：</span>
              <span class="info-value description">{{ currentClass.description }}</span>
            </div>
          </div>
        </el-card>
        
        <!-- 学生列表卡片 -->
        <el-card class="student-card">
          <template #header>
            <div class="card-header">
              <span>班级学生</span>
              <div>
                <el-input
                  v-model="studentSearchKey"
                  placeholder="搜索学生..."
                  prefix-icon="Search"
                  clearable
                  size="small"
                  style="width: 200px"
                />
              </div>
            </div>
          </template>
          <el-table
            :data="filteredStudents"
            stripe
            border
            style="width: 100%"
            max-height="300"
            v-loading="studentLoading"
          >
            <el-table-column type="index" label="#" width="60" align="center" />
            <el-table-column prop="name" label="姓名" width="120">
              <template #default="{ row }">
                <span :style="{ color: row.gender === '男' ? '#409EFF' : '#F56C6C' }">
                  {{ row.name }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="studentId" label="学号" width="120" />
            <el-table-column prop="gender" label="性别" width="80" align="center">
              <template #default="{ row }">
                <el-icon :color="row.gender === '男' ? '#409EFF' : '#F56C6C'">
                  <component :is="row.gender === '男' ? 'Male' : 'Female'" />
                </el-icon>
              </template>
            </el-table-column>
            <el-table-column prop="phone" label="联系电话" min-width="130" />
            <el-table-column prop="email" label="邮箱" min-width="180" />
          </el-table>
          <div v-if="!classStudents.length && !studentLoading" class="empty-data">
            暂无学生数据
          </div>
        </el-card>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Delete, Edit, Plus, Search, View, Download, Male, Female } from '@element-plus/icons-vue'
import { getClassList, addClass, updateClass, deleteClass } from '@/api/class'
import type { ClassItem, ApiResponse } from '@/types/common'
import { exportToExcel } from '@/utils/export'
import type { Pagination } from '@/types/common'

// 表单数据类型
interface ClassFormData {
  id?: number
  className: string
  teacher: string
  studentCount: number
  description?: string
}

// 后端返回的班级数据类型
interface ClassItemResponse {
  id: number
  class_name: string
  teacher: string
  student_count: number
  description: string | null
  create_time: string
}

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
    console.log('班级列表API响应:', res)
    
    if (res && res.data && res.data.code === 200 && Array.isArray(res.data.data)) {
      // 处理API返回的数据
      const responseData = res.data.data as ClassItemResponse[];
      tableData.value = responseData.map((item: ClassItemResponse): ClassItem => {
        // 安全处理日期转换
        let createTimeDisplay;
        try {
          createTimeDisplay = item.create_time 
            ? new Date(item.create_time).toLocaleString('zh-CN')
            : new Date().toLocaleString('zh-CN');
        } catch (e) {
          createTimeDisplay = new Date().toLocaleString('zh-CN');
          console.error('日期转换错误:', e);
        }
        
        return {
          id: item.id,
          className: item.class_name || '',
          studentCount: item.student_count || 0,
          teacher: item.teacher || '',
          createTime: createTimeDisplay,
          description: item.description || ''
        };
      });
      
      // 更新分页数据
      pagination.total = tableData.value.length;
      console.log('成功获取班级数据:', tableData.value);
    } else {
      console.warn('班级列表API响应格式不正确或 code !== 200，使用模拟数据');
      generateMockData();
    }
  } catch (error) {
    console.error('获取班级列表失败:', error);
    ElMessage.warning('获取班级数据失败，使用模拟数据');
    generateMockData();
  } finally {
    loading.value = false;
  }
};

// 生成模拟数据
const generateMockData = () => {
  const mockData: ClassItem[] = [];
  const classTypes = ['计算机科学', '软件工程', '人工智能', '大数据', '网络安全'];
  const teacherNames = ['张老师', '李老师', '王老师', '赵老师', '刘老师'];
  
  for (let i = 0; i < 20; i++) {
    const classType = classTypes[Math.floor(Math.random() * classTypes.length)];
    const classNum = Math.floor(Math.random() * 10) + 1;
    const year = 2020 + Math.floor(Math.random() * 5);
    const createTime = new Date(year, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleString('zh-CN');
    
    mockData.push({
      id: i + 1,
      className: `${classType}${year}0${classNum}班`,
      studentCount: Math.floor(Math.random() * 20) + 20,
      teacher: teacherNames[Math.floor(Math.random() * teacherNames.length)],
      createTime,
      description: `${year}年${classType}专业${classNum}班`
    });
  }
  
  tableData.value = mockData;
  pagination.total = mockData.length;
  console.log('生成的模拟数据:', mockData);
};

// 筛选数据
const filteredTableData = computed(() => {
  if (!searchKey.value) return tableData.value;
  
  const searchText = searchKey.value.toLowerCase();
  
  return tableData.value.filter(item => {
    // 添加空值检查
    const classNameMatch = item.className && searchText ? 
      item.className.toString().toLowerCase().includes(searchText) : 
      false;
    
    const teacherMatch = item.teacher && searchText ? 
      item.teacher.toString().toLowerCase().includes(searchText) : 
      false;
    
    return classNameMatch || teacherMatch;
  });
})

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        loading.value = true
        
        // 创建一个符合后端 API 格式的数据对象
        const backendData: ClassItem = {
          id: formData.id || 0,
          className: formData.className,
          teacher: formData.teacher,
          studentCount: formData.studentCount || 0,
          description: formData.description || '',
          createTime: new Date().toLocaleString('zh-CN')
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
    if (res.data?.code === 200) {
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

// 班级详情相关
const detailDialogVisible = ref(false)
const currentClass = ref<ClassItem | null>(null)
const classStudents = ref<any[]>([])
const studentSearchKey = ref('')
const studentLoading = ref(false)

// 班级学生搜索过滤
const filteredStudents = computed(() => {
  if (!studentSearchKey.value) return classStudents.value
  
  const searchText = studentSearchKey.value.toLowerCase()
  return classStudents.value.filter(student => {
    return (
      (student.name && student.name.toLowerCase().includes(searchText)) ||
      (student.studentId && student.studentId.toString().includes(searchText))
    )
  })
})

// 处理查看详情
const handleDetail = async (row: ClassItem) => {
  currentClass.value = row
  detailDialogVisible.value = true
  
  // 获取班级学生数据
  await fetchClassStudents(row.id)
}

// 获取班级学生列表
const fetchClassStudents = async (classId: number) => {
  try {
    studentLoading.value = true
    classStudents.value = []
    
    // 实际项目中，这里应该调用API获取班级下的学生数据
    // 模拟API请求延时
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // 模拟生成学生数据
    const studentCount = currentClass.value?.studentCount || 0
    const mockStudents = []
    
    // 中国常见姓氏
    const surnames = ['张', '王', '李', '赵', '陈', '刘', '杨', '黄', '周', '吴', '郑', '孙', '马', '朱', '胡', '林', '何', '高', '梁', '郭']
    // 常见名字
    const boyNames = ['伟', '强', '磊', '浩', '杰', '鹏', '宇', '博', '文', '波', '昊', '天', '明', '建', '勇', '龙', '海']
    const girlNames = ['芳', '娜', '敏', '静', '婷', '玲', '华', '红', '娟', '秀', '英', '丽', '燕', '晶', '莉', '雪', '梅']
    
    for (let i = 0; i < studentCount; i++) {
      // 随机生成姓名
      const isMale = Math.random() > 0.5
      const surname = surnames[Math.floor(Math.random() * surnames.length)]
      const name = isMale 
        ? boyNames[Math.floor(Math.random() * boyNames.length)]
        : girlNames[Math.floor(Math.random() * girlNames.length)]
      const fullName = surname + name
      
      // 生成学号 (班级id + 序号, 保证6位)
      const studentIdPrefix = `${classId}`.padStart(2, '0')
      const studentIdSuffix = `${i + 1}`.padStart(4, '0')
      const studentId = `${studentIdPrefix}${studentIdSuffix}`
      
      // 生成手机号
      const phonePrefix = ['138', '139', '135', '136', '137', '150', '151', '152', '157', '158', '159', '182', '183', '187']
      const phone = phonePrefix[Math.floor(Math.random() * phonePrefix.length)] + 
                   Math.floor(Math.random() * 100000000).toString().padStart(8, '0')
      
      // 生成邮箱
      const emailDomains = ['qq.com', '163.com', 'gmail.com', 'outlook.com', 'hotmail.com']
      const email = `${surname.toLowerCase()}${name.toLowerCase()}${Math.floor(Math.random() * 1000)}@${emailDomains[Math.floor(Math.random() * emailDomains.length)]}`
      
      mockStudents.push({
        id: i + 1,
        name: fullName,
        studentId,
        gender: isMale ? '男' : '女',
        phone,
        email,
        className: currentClass.value?.className,
        address: '模拟地址',
        joinDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleDateString('zh-CN')
      })
    }
    
    classStudents.value = mockStudents
  } catch (error) {
    console.error('获取班级学生失败:', error)
    ElMessage.error('获取班级学生失败')
  } finally {
    studentLoading.value = false
  }
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

/* 班级详情样式 */
.class-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-content {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.info-item {
  display: flex;
  align-items: flex-start;
}

.info-label {
  font-weight: bold;
  width: 80px;
  flex-shrink: 0;
  color: #606266;
}

.info-value {
  color: #303133;
}

.info-value.description {
  grid-column: span 2;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.student-card {
  margin-bottom: 0;
}

.empty-data {
  text-align: center;
  color: #909399;
  padding: 20px 0;
  font-size: 14px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .info-content {
    grid-template-columns: 1fr;
  }
  
  .class-detail {
    gap: 15px;
  }
}
</style>