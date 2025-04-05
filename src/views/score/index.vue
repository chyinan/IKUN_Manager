<template>
  <div class="score-container">
    <el-card class="header-card">
      <template #header>
        <div class="page-header">
          <div class="header-title">
            <el-icon><School /></el-icon>
            <span>学生成绩管理</span>
          </div>
          <div class="header-desc">录入和管理学生各科目考试成绩</div>
        </div>
      </template>
      
      <!-- 学生选择区域 -->
      <div class="student-select-area">
        <div class="area-title">
          <el-icon><User /></el-icon>
          <span>筛选</span>
        </div>
        <el-form :inline="true" class="selection-form">
          <el-form-item label="班级">
            <el-select 
              v-model="selectedClass" 
              placeholder="请选择班级" 
              @change="handleClassChange"
              clearable
              style="width: 200px">
              <el-option
                v-for="item in classList"
                :key="item"
                :label="item"
                :value="item"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="学生">
            <el-select 
              v-model="selectedStudent" 
              placeholder="请选择学生"
              :disabled="!selectedClass"
              @change="handleStudentSelect"
              clearable
              filterable
              style="width: 200px">
              <el-option
                v-for="item in filteredStudents"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              >
                <div class="student-option">
                  <span>{{ item.name }}</span>
                  <span class="student-id">学号: {{ item.student_id }}</span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="考试类型">
            <el-select 
              v-model="selectedExamType" 
              placeholder="请选择考试类型"
              :disabled="!selectedStudent"
              @change="handleExamTypeChange"
              clearable
              style="width: 200px">
              <el-option
                v-for="item in examTypes"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="考试名称">
            <el-select 
              v-model="selectedExamName" 
              placeholder="请选择考试名称"
              :disabled="!selectedExamType || examNames.length === 0"
              @change="handleExamNameChange"
              clearable
              style="width: 200px">
              <el-option
                v-for="item in examNames"
                :key="item.id"
                :label="item.exam_name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <!-- 成绩编辑表单 -->
    <el-card v-if="selectedStudent && selectedExamType && selectedExamName" class="score-form-card">
      <template #header>
        <div class="card-header">
          <div class="student-info">
            <el-avatar :size="32" :icon="UserFilled" class="student-avatar" />
            <div class="student-details">
              <span class="student-name">{{ selectedStudentName }}</span>
              <span class="exam-type">{{ selectedExamType }}成绩</span>
            </div>
          </div>
          <div class="exam-info">
            <el-tag effect="plain" type="info" class="exam-date-tag">
              <el-icon><Calendar /></el-icon>
              <span>考试日期: {{ formattedExamDate || '暂无记录' }}</span>
            </el-tag>
          </div>
        </div>
      </template>

      <el-form 
        ref="formRef"
        :model="scoreForm"
        label-width="100px"
        class="score-form"
      >
        <div class="score-grid">
          <el-card 
            v-for="subject in subjects" 
            :key="subject"
            class="subject-card"
            :class="{ 'high-score': (scoreForm[subject] ?? 0) >= 90, 'low-score': (scoreForm[subject] ?? 100) < 60 }"
            shadow="hover"
          >
            <template #header>
              <div class="subject-header">
                <span class="subject-name">{{ subject }}</span>
                <el-tag 
                  :type="getScoreTagType(scoreForm[subject])" 
                  effect="light"
                  size="small"
                >
                  {{ getScoreLevel(scoreForm[subject]) }}
                </el-tag>
              </div>
            </template>
            <div class="subject-score">
              <el-input-number 
                v-model="scoreForm[subject]"
                :min="0"
                :max="100"
                :precision="1"
                :step="0.5"
                controls-position="right"
                @change="handleScoreChange"
                class="score-input"
              />
              <div class="score-visual">
                <div 
                  class="score-bar" 
                  :style="{ width: `${scoreForm[subject] ?? 0}%`, backgroundColor: getScoreColor(scoreForm[subject]) }"
                ></div>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 总分和平均分统计 -->
        <div class="score-summary">
          <el-card shadow="hover" class="summary-card">
            <template #header>
              <div class="summary-header">
                <span>总分</span>
              </div>
            </template>
            <div class="summary-value">{{ calculateTotalScore() }}</div>
          </el-card>
          
          <el-card shadow="hover" class="summary-card">
            <template #header>
              <div class="summary-header">
                <span>平均分</span>
              </div>
            </template>
            <div class="summary-value">{{ calculateAverageScore() }}</div>
          </el-card>
        </div>

        <!-- 只在数据被修改时显示按钮 -->
        <div v-if="isScoreChanged" class="form-footer">
          <el-button @click="handleCancel" :icon="Close">取消修改</el-button>
          <el-button 
            type="primary" 
            @click="handleSave"
            :loading="loading"
            :icon="Check">
            保存成绩
          </el-button>
        </div>
      </el-form>
    </el-card>
    
    <!-- 未选择学生或考试类型时显示的提示 - 移除了误导性按钮 -->
    <el-empty 
      v-else 
      description="请按照上方操作指引选择班级、学生和考试类型查看成绩" 
      :image-size="200"
      class="empty-placeholder"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance } from 'element-plus'
import { getClassList } from '@/api/class'
import { getStudentList } from '@/api/student'
import { createExamIfNotExists, getExamListByType } from '@/api/exam'
import type { SubjectType, ScoreData, ApiResponse, StudentItemResponse } from '@/types/common'
import { School, Calendar, UserFilled, Check, Close, User } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

// 导入新的score API
import * as scoreApi from '@/api/score'
import { 
  testScoreApi, 
  getExamTypeOptions, 
  getSubjectOptions,
  getScoreList,
  type ScoreQueryParams,
  type SaveScoreParams
} from '@/api/score'

const router = useRouter()

// 确保组件正确导出
defineOptions({
  name: 'ScoreManagement'
})

// 定义响应式变量
const classList = ref<string[]>([])
const studentList = ref<any[]>([])
const scoreList = ref<any[]>([])
const selectedClass = ref('')
const selectedStudent = ref<number | null>(null)
const selectedExamType = ref('')
const selectedExamName = ref<number | null>(null)
const selectedStudentName = ref('')
const examDate = ref('')
const examTypes = ref<Array<{label: string; value: string}>>([])
const examNames = ref<Array<{id: number; exam_name: string; exam_date: string}>>([])
const loading = ref(false)
const formRef = ref<FormInstance | null>(null)

// 科目列表
const subjects: SubjectType[] = ['语文', '数学', '英语', '物理', '化学', '生物']

// Revert both scoreForm and originalScores to use ref
const scoreForm = ref<Record<SubjectType, number | null>>(
  subjects.reduce((acc, subject) => {
    acc[subject] = null;
    return acc;
  }, {} as Record<SubjectType, number | null>)
);

const originalScores = ref<Record<SubjectType, number | null>>(
  subjects.reduce((acc, subject) => {
    acc[subject] = null;
    return acc;
  }, {} as Record<SubjectType, number | null>)
);
const isScoreChanged = ref(false);

// 根据选择的班级筛选学生
const filteredStudents = computed(() => {
  return studentList.value.filter(student => student.class_name === selectedClass.value)
})

// 考试类型选项
interface ExamTypeOption {
  label: string
  value: string
}

// 获取考试类型选项
const fetchExamTypes = async () => {
  try {
    console.log('获取考试类型选项')
    const response = await getExamTypeOptions()
    console.log('考试类型API响应:', response)
    
    if (response && response.code === 200 && Array.isArray(response.data)) {
      // 将字符串数组转换为选项格式
      examTypes.value = response.data.map(type => ({
        label: type,
        value: type
      }))
      console.log('成功获取考试类型选项:', examTypes.value)
    } else {
      console.warn('考试类型API响应格式不正确或 code !== 200')
      examTypes.value = [
        { label: '月考', value: '月考' },
        { label: '期中', value: '期中' },
        { label: '期末', value: '期末' }
      ]
    }
  } catch (error) {
    console.error('获取考试类型选项失败:', error)
    ElMessage.error('获取考试类型选项失败')
    examTypes.value = [
      { label: '月考', value: '月考' },
      { label: '期中', value: '期中' },
      { label: '期末', value: '期末' }
    ]
  }
}

// 获取班级列表
const fetchClassList = async () => {
  try {
    console.log('开始获取班级列表...')
    const response = await getClassList()
    console.log('班级列表API响应:', response)
    
    if (response && response.data && response.data.code === 200 && Array.isArray(response.data.data)) {
      classList.value = response.data.data.map(item => item.class_name || '')
      console.log('成功获取班级列表:', classList.value)
    } else {
      console.warn('班级列表API响应格式不正确或 code !== 200，使用默认值')
      generateMockClassData()
    }
  } catch (error) {
    console.error('获取班级列表失败:', error)
    ElMessage.error('获取班级列表失败')
    generateMockClassData()
  }
}

// 获取学生列表
const fetchStudentList = async (className: string) => {
  try {
    console.log('开始获取学生列表, 班级:', className)
    const response = await getStudentList() // response is AxiosResponse
    console.log('学生列表API响应:', response)
    
    // Check the actual API data within response.data
    if (response && response.data && response.data.code === 200 && Array.isArray(response.data.data)) {
      // Filter the actual student array from response.data.data
      studentList.value = response.data.data.filter((student: StudentItemResponse) => 
        student.class_name && student.class_name === className
      )
      console.log('筛选后的学生列表:', studentList.value)
    } else {
      // Log the actual response data for debugging if the format is wrong
      console.warn('学生列表API响应格式不正确或 code !== 200, 响应数据:', response.data)
      studentList.value = []
    }
  } catch (error) {
    console.error('获取学生列表异常:', error)
    studentList.value = []
  }
}

// 获取成绩列表
const fetchScoreList = async () => {
  // 如果没有选择学生或考试类型，不调用API
  if (!selectedStudent.value || !selectedExamType.value) {
    scoreList.value = []
    return
  }

  try {
    console.log('开始获取成绩列表...')
    const params: ScoreQueryParams = {
      studentId: selectedStudent.value,
      examType: selectedExamType.value
    }
    
    const response = await getScoreList(params)
    console.log('成绩列表API响应:', response)
    
    if (response && response.data && response.data.code === 200 && Array.isArray(response.data.data)) {
      scoreList.value = response.data.data
      console.log('成绩列表:', scoreList.value)
    } else {
      console.warn('成绩列表API响应格式不正确或 code !== 200')
      scoreList.value = []
    }
  } catch (error) {
    console.error('获取成绩列表异常:', error)
    scoreList.value = []
  }
}

// 处理班级选择变化
const handleClassChange = async () => {
  selectedStudent.value = null;
  selectedExamType.value = '';
  selectedExamName.value = null;
  // Reset scoreForm.value
  scoreForm.value = subjects.reduce((acc, subject) => {
    acc[subject] = null;
    return acc;
  }, {} as Record<SubjectType, number | null>);
  originalScores.value = { ...scoreForm.value }; // Reset original as well
  isScoreChanged.value = false;

  if (selectedClass.value) {
    // Call the correct fetchStudentList - assuming it's defined elsewhere or kept from previous state
    // await fetchStudentList(selectedClass.value); // You might need to adjust this if fetchStudentList was changed
     await fetchStudentListForClass(selectedClass.value); // Assuming a function to fetch all students for a class exists
  } else {
    studentList.value = []; // Clear student list if no class selected
  }
};

// Fetch all students for a class (helper needed after revert)
const fetchStudentListForClass = async (className: string) => {
  try {
    const response = await getStudentList(); // Fetch all students
    if (response && response.data && response.data.code === 200 && Array.isArray(response.data.data)) {
        // Filter locally
        studentList.value = response.data.data.filter((student: StudentItemResponse) =>
            student.class_name && student.class_name === className
        );
    } else {
        studentList.value = [];
    }
  } catch (error) {
      console.error('获取学生列表失败:', error);
      studentList.value = [];
  }
};

// 处理学生选择
const handleStudentSelect = async () => {
  if (!selectedStudent.value) {
      selectedStudentName.value = '';
      selectedExamType.value = '';
      selectedExamName.value = null;
      examNames.value = [];
      resetScoreForm(); // Resets scoreForm.value and originalScores.value
      return;
  }
  selectedExamType.value = '';
  selectedExamName.value = null;
  examNames.value = [];
  resetScoreForm();

  const selectedStudentData = studentList.value.find(s => s.id === selectedStudent.value);
  if (selectedStudentData) {
    selectedStudentName.value = selectedStudentData.name;
  }
}

// 处理考试类型变化
const handleExamTypeChange = async () => {
  if (!selectedStudent.value || !selectedExamType.value) {
      selectedExamName.value = null;
      examNames.value = [];
      resetScoreForm();
      return;
  }

  selectedExamName.value = null;
  examNames.value = [];
  resetScoreForm();

  try {
    loading.value = true;
    const examListResult = await scoreApi.getExams(selectedExamType.value);
    if (Array.isArray(examListResult) && examListResult.length > 0) {
      examNames.value = examListResult.map(item => ({
        id: item.id,
        exam_name: item.exam_name,
        exam_date: item.exam_date
      }));
      if (examNames.value.length > 0) {
        ElMessage.info(`请选择具体的${selectedExamType.value}考试`);
      } else {
        ElMessage.warning(`未找到${selectedExamType.value}类型的考试记录`);
      }
    } else {
      ElMessage.warning(`未找到${selectedExamType.value}类型的考试记录`);
    }
  } catch (error) {
    console.error('获取考试名称列表失败:', error);
    ElMessage.error('获取考试名称列表失败');
  } finally {
    loading.value = false;
  }
}

// 处理考试名称变化
const handleExamNameChange = async () => {
    resetScoreForm(); // Reset first
    if (!selectedStudent.value || !selectedExamType.value || !selectedExamName.value) {
        examDate.value = '';
        return;
    }

    const selectedExam = examNames.value.find(e => e.id === selectedExamName.value);
    examDate.value = selectedExam?.exam_date || ''; // Update raw exam date for formatter

    // Fetch scores using the existing fetchStudentScores function
    await fetchStudentScores(selectedStudent.value, selectedExamName.value);
}

// 获取学生成绩 (Refactored to use ref)
const fetchStudentScores = async (studentId: number, examId: number) => {
  if (!studentId || !examId) return;
  console.log(`开始获取学生 ${studentId} 在考试 ${examId} 的成绩...`);
  loading.value = true;
  resetScoreForm(); // Resets scoreForm.value and originalScores.value
  // examDate is set in handleExamNameChange

  try {
    const res = await scoreApi.getStudentScoreByExamId(studentId, examId);
    console.log('获取学生成绩响应:', res);

    if (res) {
      // Populate scoreForm.value, converting string scores to numbers
      subjects.forEach(subject => {
        const scoreValue = res[subject];
        if (scoreValue !== undefined && scoreValue !== null) {
            const numericScore = parseFloat(scoreValue); // Attempt to convert string to number
            if (!isNaN(numericScore)) { // Check if the conversion resulted in a valid number
                scoreForm.value[subject] = numericScore;
            } else {
                scoreForm.value[subject] = null; // Assign null if conversion fails
                console.warn(`Received non-numeric score value for ${subject}:`, scoreValue);
            }
        } else {
            scoreForm.value[subject] = null; // Assign null if subject is missing in response
        }
      });
      // examDate.value is already set from selectedExam in handleExamNameChange
      // examDate.value = res.exam_time || ''; // Keep this if backend 'exam_time' is more accurate

      // Update originalScores.value
      originalScores.value = { ...scoreForm.value };
      console.log('学生成绩加载完成', scoreForm.value);
      isScoreChanged.value = false; // Ensure changed flag is reset after load
    } else {
      console.warn('未找到学生成绩记录或API响应无效, 表单已重置.');
       ElMessage.info(`未找到考试成绩记录，可编辑并保存新成绩`);
      // Form is already reset by resetScoreForm()
    }
  } catch (error) {
    console.error('获取学生成绩失败 (catch):', error);
    ElMessage.error('获取学生成绩失败');
    // Form is already reset
  } finally {
    loading.value = false;
  }
};

// 重置成绩表单 (Using ref)
const resetScoreForm = () => {
  scoreForm.value = subjects.reduce((acc, subject) => {
    acc[subject] = null;
    return acc;
  }, {} as Record<SubjectType, number | null>);
  originalScores.value = { ...scoreForm.value }; // Keep original in sync with reset
  isScoreChanged.value = false;
};

// 取消修改 (Using ref)
const handleCancel = () => {
  // Restore from originalScores.value
  scoreForm.value = { ...originalScores.value };
  isScoreChanged.value = false;
  ElMessage.info('修改已取消');
};

// 计算总分 (Using ref)
const calculateTotalScore = () => {
  return subjects.reduce((sum, subject) => {
    const score = scoreForm.value[subject];
    return sum + (typeof score === 'number' ? score : 0);
  }, 0).toFixed(1);
};

// 计算平均分 (Using ref)
const calculateAverageScore = () => {
  const validScores = subjects.map(subject => scoreForm.value[subject]).filter(score => typeof score === 'number') as number[];
  if (validScores.length === 0) return '0.0';
  const sum = validScores.reduce((acc, score) => acc + score, 0);
  return (sum / validScores.length).toFixed(1);
};

// 保存成绩 (Using ref)
const handleSave = async () => {
  // Add explicit validation for IDs
  if (typeof selectedStudent.value !== 'number' || selectedStudent.value <= 0) {
    ElMessage.warning('无效的学生ID，请重新选择');
    return;
  }
  if (typeof selectedExamName.value !== 'number' || selectedExamName.value <= 0) {
    ElMessage.warning('无效的考试ID，请重新选择');
    return;
  }

  const scoresToSave: Record<string, number> = {};
  subjects.forEach(subject => {
    const score = scoreForm.value[subject];
    if (typeof score === 'number' && !isNaN(score)) {
      scoresToSave[subject] = score;
    }
  });

  const saveData: SaveScoreParams = {
    studentId: selectedStudent.value, // Now validated as number
    examId: selectedExamName.value,   // Now validated as number
    examType: selectedExamType.value, // Ensure this has a value if needed by backend logic
    scores: scoresToSave
  };

  // Log the data being sent
  console.log('即将保存的成绩数据:', JSON.stringify(saveData)); 

  loading.value = true;
  try {
    const res = await scoreApi.saveStudentScore(saveData);
    // Check success based only on status codes 200/201
    if (res && (res.code === 200 || res.code === 201)) {
      ElMessage.success('成绩保存成功');
      originalScores.value = { ...scoreForm.value }; 
      isScoreChanged.value = false;
    } else {
      // Use message from response if available
      ElMessage.error(res?.message || '成绩保存失败');
    }
  } catch (error: any) {
    console.error('保存成绩失败 (catch):', error);
    let errorMessage = '保存成绩失败';
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage += `: ${error.response.data.message}`;
    } else if (error.message) {
      errorMessage += `: ${error.message}`;
    }
    ElMessage.error(errorMessage);
  } finally {
    loading.value = false;
  }
};

// 处理成绩输入变化 (Using ref)
const handleScoreChange = () => {
  isScoreChanged.value = JSON.stringify(scoreForm.value) !== JSON.stringify(originalScores.value);
};

// 根据分数获取颜色
const getScoreColor = (score: number | null): string => {
  if (score === null) return '#909399'; // 未录入 - Gray
  if (score < 60) return '#909399';    // 不及格 - Gray (Changed from Red)
  if (score < 70) return '#F56C6C';    // 及格   - Red (New range for Red)
  if (score < 80) return '#E6A23C';    // 中等   - Orange/Yellow (Kept)
  if (score < 90) return '#409EFF';    // 良好   - Blue (Changed from Gray)
  return '#67C23A';                   // 优秀   - Green (Kept)
}

// 根据分数获取标签类型
const getScoreTagType = (score: number | null): 'success' | 'warning' | 'danger' | 'info' | 'primary' => {
  if (score === null) return 'info';     // 未录入 - Gray
  if (score < 60) return 'info';     // 不及格 - Gray (Changed from danger)
  if (score < 70) return 'danger';   // 及格   - Red (New range for danger)
  if (score < 80) return 'warning';  // 中等   - Orange/Yellow (Kept)
  if (score < 90) return 'primary';  // 良好   - Blue (Changed from info)
  return 'success';                  // 优秀   - Green (Kept)
}

// 根据分数获取等级
const getScoreLevel = (score: number | null): string => {
  if (score === null) return '未录入';
  if (score < 60) return '不及格';
  if (score < 70) return '及格';
  if (score < 80) return '中等';
  if (score < 90) return '良好';
  return '优秀';
}

// 生成模拟班级数据
const generateMockClassData = () => {
  const mockClasses = [
    '计算机科学2401班',
    '软件工程2402班',
    '人工智能2403班',
    '大数据分析2404班',
    '网络安全2405班'
  ]
  classList.value = mockClasses
  console.log('生成的模拟班级数据:', classList.value)
}

// 页面初始化
onMounted(async () => {
  try {
    const apiTestResult = await testScoreApi()
    if (apiTestResult) {
      await fetchClassList() // Fetches class names
      // Don't fetch all students initially, wait for class selection
      await fetchExamTypes()
      // fetchScoreList is likely unnecessary here as no student/exam selected
    } else {
      ElMessage.error('成绩API连接失败，请检查网络连接')
    }
  } catch (error) {
    console.error('页面初始化失败:', error)
    ElMessage.error('页面初始化失败，请刷新重试')
  }
})

// Keep the formattedExamDate computed property
const formattedExamDate = computed(() => {
    if (!examDate.value) return '';
    try {
        return dayjs(examDate.value).format('YYYY-MM-DD HH:mm');
    } catch (e) {
        console.error("Error formatting exam date:", e);
        return examDate.value;
    }
});
</script>

<style scoped>
.score-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 84px);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header-card {
  margin-bottom: 0;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: bold;
}

.header-desc {
  color: #909399;
  font-size: 14px;
}

.student-select-area {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.area-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 5px;
  border-left: 4px solid #409EFF;
  padding-left: 10px;
}

.selection-form {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 6px;
}

.student-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.student-id {
  color: #909399;
  font-size: 12px;
}

.score-form-card {
  flex: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.student-details {
  display: flex;
  flex-direction: column;
}

.student-name {
  font-size: 16px;
  font-weight: bold;
}

.exam-type {
  font-size: 14px;
  color: #606266;
}

.exam-date-tag {
  display: flex;
  align-items: center;
  gap: 5px;
}

.score-form {
  margin-top: 20px;
}

.score-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.subject-card {
  transition: all 0.3s;
  border: 1px solid #EBEEF5;
}

.subject-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.high-score {
  border-top: 3px solid #67C23A;
}

.low-score {
  border-top: 3px solid #F56C6C;
}

.subject-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.subject-name {
  font-weight: bold;
}

.subject-score {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.score-input {
  width: 100%;
}

.score-visual {
  height: 8px;
  background-color: #EBEEF5;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 5px;
}

.score-bar {
  height: 100%;
  transition: width 0.3s, background-color 0.3s;
}

.score-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.summary-card {
  text-align: center;
}

.summary-header {
  font-weight: bold;
  text-align: center;
}

.summary-value {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
}

.form-footer {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.empty-placeholder {
  margin-top: 40px;
  background-color: #fcfcfc;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .score-grid {
    grid-template-columns: 1fr;
  }
  
  .score-summary {
    grid-template-columns: 1fr;
  }
  
  .selection-form {
    flex-direction: column;
  }
}
</style>