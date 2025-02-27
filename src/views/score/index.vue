<template>
  <div class="score-container">
    <!-- 学生选择区域 -->
    <div class="student-select-area">
      <el-form :inline="true">
        <el-form-item label="选择班级">
          <el-select 
            v-model="selectedClass" 
            placeholder="请选择班级" 
            @change="handleClassChange"
            style="width: 200px">  <!-- 添加固定宽度 -->
            <el-option
              v-for="item in classList"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="选择学生">
          <el-select 
            v-model="selectedStudent" 
            placeholder="请选择学生"
            :disabled="!selectedClass"
            @change="handleStudentSelect"
            style="width: 200px">  <!-- 添加固定宽度 -->
            <el-option
              v-for="item in filteredStudents"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <!-- 修改考试类型选择 -->
        <el-form-item label="考试类型">
          <el-select 
            v-model="selectedExamType" 
            placeholder="请选择考试类型"
            :disabled="!selectedStudent"
            @change="handleExamTypeChange"
            style="width: 200px">
            <el-option
              v-for="item in examTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <!-- 成绩编辑表单 -->
    <el-card v-if="selectedStudent && selectedExamType" class="score-form">
      <template #header>
        <div class="card-header">
          <span>{{ selectedStudentName }} 的{{ selectedExamType }}成绩</span>
          <span class="exam-date">考试日期: {{ examDate || '暂无记录' }}</span>
        </div>
      </template>

      <el-form 
        ref="formRef"
        :model="scoreForm"
        label-width="100px"
      >
        <div class="score-grid">
          <el-form-item 
            v-for="subject in subjects" 
            :key="subject"
            :label="subject"
            :prop="subject"
          >
            <el-input-number 
              v-model="scoreForm[subject]"
              :min="0"
              :max="100"
              :precision="1"
              :step="0.5"
              controls-position="right"
              @change="handleScoreChange"
            />
          </el-form-item>
        </div>

        <!-- 只在数据被修改时显示按钮 -->
        <div v-if="isScoreChanged" class="form-footer">
          <el-button @click="handleCancel">取消</el-button>
          <el-button 
            type="primary" 
            @click="handleSave"
            :loading="loading">
            保存
          </el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getClassList } from '@/api/class'
import { getStudentList } from '@/api/student'
import { getStudentScore, saveStudentScore, testScoreApi } from '@/api/score'
import type { SubjectType, ScoreData } from '@/types/score'
import type { StudentItemResponse } from '@/types/student'

const router = useRouter()

// 确保组件正确导出
defineOptions({
  name: 'ScoreManagement'
})

// 班级和学生数据
const classList = ref<string[]>([])
// 修改学生列表的类型
const studentList = ref<StudentItemResponse[]>([])
const selectedClass = ref('')
const selectedStudent = ref<number | null>(null)

// 科目列表
const subjects: SubjectType[] = ['语文', '数学', '英语', '物理', '化学', '生物']

// 成绩表单数据
const scoreForm = ref<Record<SubjectType, number>>({
  语文: 0,
  数学: 0,
  英语: 0,
  物理: 0,
  化学: 0,
  生物: 0
})

// 添加考试类型和日期数据
const examTypes = [
  { label: '月考', value: '月考' },
  { label: '期中考试', value: '期中' },
  { label: '期末考试', value: '期末' }
]
const selectedExamType = ref('')
const examDate = ref('')

// 添加loading状态
const loading = ref(false)

// 根据选择的班级筛选学生
const filteredStudents = computed(() => {
  return studentList.value.filter(student => student.class_name === selectedClass.value)
})

// 获取选中学生姓名
const selectedStudentName = computed(() => {
  const student = studentList.value.find(s => s.id === selectedStudent.value)
  return student ? student.name : ''
})

// 获取班级列表
const fetchClassList = async () => {
  try {
    const res = await getClassList()
    if (res.code === 200 && Array.isArray(res.data)) {
      classList.value = res.data.map(item => item.class_name)
    } else {
      classList.value = []
      ElMessage.warning('暂无班级数据')
    }
  } catch (error) {
    console.error('获取班级列表失败:', error)
    ElMessage.error('获取班级列表失败')
    classList.value = []
  }
}

// 修改获取学生列表函数
const fetchStudentList = async () => {
  try {
    const res = await getStudentList()
    if (res.code === 200 && Array.isArray(res.data)) {
      studentList.value = res.data // res.data 已经是 StudentItemResponse[]
    } else {
      studentList.value = []
      ElMessage.warning('暂无学生数据')
    }
  } catch (error) {
    console.error('获取学生列表失败:', error)
    ElMessage.error('获取学生列表失败')
    studentList.value = []
  }
}

// 处理班级选择变化
const handleClassChange = () => {
  selectedStudent.value = null
  scoreForm.value = {
    语文: 0,
    数学: 0,
    英语: 0,
    物理: 0,
    化学: 0,
    生物: 0
  }
}

// 处理学生选择
const handleStudentSelect = async () => {
  if (!selectedStudent.value) return
  selectedExamType.value = '' // 清空考试类型选择
  resetScoreForm()
}

// 修改考试类型变化处理函数
const handleExamTypeChange = async () => {
  if (!selectedStudent.value || !selectedExamType.value) return
  
  try {
    const res = await getStudentScore(selectedStudent.value, selectedExamType.value)
    console.log('获取成绩响应:', res)
    
    if (res.code === 200) {
      if (res.data && res.data.exam_type === selectedExamType.value) {
        // 只有当考试类型匹配时才使用数据库中的成绩
        scoreForm.value = {
          语文: res.data.语文 || 0,
          数学: res.data.数学 || 0,
          英语: res.data.英语 || 0,
          物理: res.data.物理 || 0,
          化学: res.data.化学 || 0,
          生物: res.data.生物 || 0
        }
        examDate.value = res.data.exam_time || ''
      } else {
        // 如果没有对应考试类型的成绩，重置为0
        resetScoreForm()
        examDate.value = ''
      }
      // 保存原始成绩用于比较
      originalScores.value = { ...scoreForm.value }
      isScoreChanged.value = false
    }
  } catch (error: any) {
    console.error('获取成绩失败:', error)
    ElMessage.error('获取成绩失败')
  }
}

// 重置成绩表单
const resetScoreForm = () => {
  scoreForm.value = {
    语文: 0,
    数学: 0,
    英语: 0,
    物理: 0,
    化学: 0,
    生物: 0
  }
  originalScores.value = { ...scoreForm.value }
  isScoreChanged.value = false
}

// 取消编辑
const handleCancel = () => {
  // 恢复原始成绩
  scoreForm.value = { ...originalScores.value }
  isScoreChanged.value = false
}

// 修改保存成绩方法
const handleSave = async () => {
  if (!selectedStudent.value || !selectedExamType.value) {
    ElMessage.warning('请选择学生和考试类型')
    return
  }

  try {
    loading.value = true
    const today = new Date().toISOString().split('T')[0]

    const res = await saveStudentScore(
      selectedStudent.value,
      scoreForm.value,
      selectedExamType.value,
      today
    )

    if (res.code === 200) {
      ElMessage.success('保存成功')
      originalScores.value = { ...scoreForm.value }
      isScoreChanged.value = false
      examDate.value = today
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    loading.value = false
  }
}

// 添加成绩是否被修改的标记
const isScoreChanged = ref(false)
// 修改原始成绩的类型定义
const originalScores = ref<Record<SubjectType, number>>({
  语文: 0,
  数学: 0,
  英语: 0,
  物理: 0,
  化学: 0,
  生物: 0
})

// 处理成绩输入变化
const handleScoreChange = () => {
  const hasChanges = subjects.some(subject => 
    scoreForm.value[subject] !== originalScores.value[subject]
  )
  isScoreChanged.value = hasChanges
}

// 页面初始化
onMounted(async () => {
  try {
    // 测试成绩API是否可用
    const testRes = await testScoreApi()
    console.log('成绩API测试结果:', testRes)
    
    // 获取其他数据
    await fetchClassList()
    await fetchStudentList()
  } catch (error) {
    console.error('初始化失败:', error)
    ElMessage.error('系统初始化失败')
  }
})
</script>

<style scoped>
.score-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 84px);
}

.student-select-area {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.score-form {
  margin-top: 20px;
}

.score-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.form-footer {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 添加选择框样式 */
:deep(.el-select) {
  width: 200px;
}

.exam-date {
  font-size: 14px;
  color: #909399;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>