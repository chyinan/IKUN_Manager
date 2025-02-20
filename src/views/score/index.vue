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
      </el-form>
    </div>

    <!-- 成绩编辑表单 -->
    <el-card v-if="selectedStudent" class="score-form">
      <template #header>
        <div class="card-header">
          <span>{{ selectedStudentName }} 的成绩信息</span>
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
            />
          </el-form-item>
        </div>

        <div class="form-footer">
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" @click="handleSave">保存</el-button>
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

const router = useRouter()

// 确保组件正确导出
defineOptions({
  name: 'ScoreManagement'
})

// 班级和学生数据
const classList = ref<string[]>([])
const studentList = ref<any[]>([])
const selectedClass = ref('')
const selectedStudent = ref<number | null>(null)

// 科目列表
const subjects = ['语文', '数学', '英语', '物理', '化学', '生物']

// 成绩表单数据
const scoreForm = ref<Record<string, number>>({
  语文: 0,
  数学: 0,
  英语: 0,
  物理: 0,
  化学: 0,
  生物: 0
})

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
    classList.value = res.data.map(item => item.class_name)
  } catch (error) {
    console.error('获取班级列表失败:', error)
    ElMessage.error('获取班级列表失败')
  }
}

// 获取学生列表
const fetchStudentList = async () => {
  try {
    const res = await getStudentList()
    studentList.value = res.data
  } catch (error) {
    console.error('获取学生列表失败:', error)
    ElMessage.error('获取学生列表失败')
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
  
  try {
    const res = await getStudentScore(selectedStudent.value)
    console.log('获取成绩响应:', res)
    
    // 初始化默认值
    const defaultScores = {
      语文: 0,
      数学: 0,
      英语: 0,
      物理: 0,
      化学: 0,
      生物: 0
    }
    
    if (res.code === 200 && res.data) {
      // 合并服务器返回的成绩
      scoreForm.value = {
        ...defaultScores,
        ...res.data
      }
      console.log('更新后的成绩表单:', scoreForm.value)
    }
  } catch (error: any) {
    console.error('获取成绩失败:', error)
    ElMessage.error('获取成绩失败')
  }
}

// 取消编辑
const handleCancel = () => {
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

// 保存成绩
const handleSave = async () => {
  try {
    if (!selectedStudent.value) {
      ElMessage.warning('请先选择学生')
      return
    }

    console.log('准备保存成绩:', {
      student_id: selectedStudent.value,
      scores: scoreForm.value
    })

    await saveStudentScore(selectedStudent.value, scoreForm.value)
    ElMessage.success('保存成功')
    
    // 刷新成绩数据
    await handleStudentSelect()
  } catch (error: any) {
    console.error('保存失败:', error)
    ElMessage.error(`保存失败: ${error.response?.data?.message || error.message}`)
  }
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
</style>