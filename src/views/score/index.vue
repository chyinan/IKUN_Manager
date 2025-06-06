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
            v-for="subject in activeSubjects" 
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
import { ref, computed, onMounted, watch, reactive } from 'vue'
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
  getExamTypeOptions, 
  getSubjectOptions,
  getScoreList,
  getStudentScoreByExamId,
  type ScoreQueryParams,
  type SaveScoreParams
} from '@/api/score'

// Define Pagination type if not already available globally
interface Pagination { 
  currentPage: number;
  pageSize: number;
  total: number;
}

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

// 科目列表 - REMOVED Hardcoded list
// const subjects: SubjectType[] = ['语文', '数学', '英语', '物理', '化学', '生物']
// Add reactive ref for active subjects
const activeSubjects = ref<string[]>([])

// scoreForm and originalScores are now initialized empty and populated dynamically
const scoreForm = ref<Record<string, number | null>>({}); // Initialize as empty object
const originalScores = ref<Record<string, number | null>>({}); // Initialize as empty object
const isScoreChanged = ref(false);

// Corrected: Define pagination ref
const pagination = reactive<Pagination>({
  currentPage: 1,
  pageSize: 10, // Or your desired default
  total: 0
});

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
    const response = await getClassList()
    if (response?.code === 200 && Array.isArray(response.data)) {
      classList.value = response.data.map(item => item.class_name || '')
    } else {
      ElMessage.warning(response?.message || '获取班级列表失败')
    }
  } catch (error: any) {
    console.error('获取班级列表失败:', error)
    ElMessage.error(error.response?.data?.message || error.message || '获取班级列表失败')
  }
}

// 获取学生列表
const fetchStudentList = async () => {
  try {
    const response = await getStudentList()
    if (response?.code === 200 && Array.isArray(response.data)) {
      studentList.value = response.data.filter((student: StudentItemResponse) => {
        return !selectedClass.value || student.class_name === selectedClass.value
      })
        } else {
      ElMessage.warning(response?.message || '获取学生列表失败')
    }
  } catch (error: any) {
    console.error('获取学生列表失败:', error)
    ElMessage.error(error.response?.data?.message || error.message || '获取学生列表失败')
  }
}

// 获取成绩列表
const fetchScores = async () => {
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
    
    const response = await getScoreList(params) // Returns ApiResponse<ScoreDetail[]>
    console.log('成绩列表API响应:', response)
    
    if (response && response.code === 200 && Array.isArray(response.data)) {
      scoreList.value = response.data
      console.log('成绩列表:', scoreList.value)
      pagination.total = response.data.length; 
      if (response.data.length === 0) {
          ElMessage.info('未查询到相关成绩记录。');
        }
      } else {
      console.warn('成绩列表API响应格式不正确或 code !== 200:', response);
      scoreList.value = []
      pagination.total = 0;
    }
  } catch (error) {
    console.error('获取成绩列表异常:', error)
    scoreList.value = []
    pagination.total = 0;
  }
}

// 处理班级选择变化
const handleClassChange = async () => {
  selectedStudent.value = null;
  selectedExamType.value = '';
  selectedExamName.value = null;
  // Reset scoreForm.value
  scoreForm.value = {};
  originalScores.value = {};
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
    // Assuming getStudentList returns Promise<ApiResponse<StudentItemResponse[]>>
    const response = await getStudentList(); 
    // Check response.code and response.data directly
    if (response && response.code === 200 && Array.isArray(response.data)) {
        // Filter locally based on className
        studentList.value = response.data.filter((student: StudentItemResponse) =>
            student.class_name && student.class_name === className
        );
    } else {
        // Handle error or empty data from API
        ElMessage.warning(response?.message || '获取学生列表失败或无数据');
    studentList.value = [];
  }
  } catch (error: any) {
      console.error('获取学生列表失败 (catch):', error);
      ElMessage.error(error.response?.data?.message || error.message || '获取学生列表失败');
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

// 处理考试名称变化 (Ensure resetScoreForm is called correctly)
const handleExamNameChange = async () => {
    resetScoreForm(); // Reset first
    if (!selectedStudent.value || !selectedExamType.value || !selectedExamName.value) {
        examDate.value = '';
        activeSubjects.value = []; // Clear active subjects
        return;
    }

    const selectedExam = examNames.value.find(e => e.id === selectedExamName.value);
    examDate.value = selectedExam?.exam_date || ''; // Update raw exam date

    // Fetch scores using the existing fetchStudentScores function
    await fetchStudentScores(selectedStudent.value, selectedExamName.value);
}

// 获取学生成绩 (Refactored to use dynamic subjects)
const fetchStudentScores = async (studentId: number, examId: number) => {
  if (!studentId || !examId) return;
  console.log(`开始获取学生 ${studentId} 在考试 ${examId} 的成绩...`);
  loading.value = true;
  resetScoreForm(); // Resets scoreForm, originalScores, and activeSubjects

  try {
    // API returns ApiResponse<ScoreData> where ScoreData = { subjects: string[], scores: {...} }
    const res = await scoreApi.getStudentScoreByExamId(studentId, examId);
    console.log('获取学生成绩响应:', res);

    // Corrected: Check res.code and access res.data for subjects and scores
    if (res && res.code === 200 && res.data && Array.isArray(res.data.subjects) && typeof res.data.scores === 'object') {
      const scoreData = res.data as ScoreData; // Assert type ScoreData
      
      // 1. Update active subjects
      if (Array.isArray(scoreData.subjects)) {
         activeSubjects.value = scoreData.subjects;
         console.log('Active subjects set to:', activeSubjects.value);
      } else {
         activeSubjects.value = []; // Fallback to empty array
         console.warn('scoreData.subjects is not an array');
      }

      // 2. Initialize scoreForm and originalScores based on active subjects
      const newScoreForm: Record<string, number | null> = {};
      activeSubjects.value.forEach(subject => {
        // Corrected: Remove assertion, add safer access and type checks
        const scoresObject = scoreData.scores;
        if (scoresObject && typeof scoresObject === 'object' && scoresObject.hasOwnProperty(subject)) {
          const scoreValue = scoresObject[subject as keyof typeof scoresObject]; // Access using keyof
          if (scoreValue !== undefined && scoreValue !== null) {
              // Try parsing after converting to string for robustness
              const numericScore = parseFloat(String(scoreValue)); 
              if (!isNaN(numericScore)) {
                  newScoreForm[subject] = numericScore;
      } else {
                  newScoreForm[subject] = null;
                  console.warn(`Received non-numeric score value for ${subject}:`, scoreValue);
              }
          } else {
              // Value is null or undefined
              newScoreForm[subject] = null;
          }
        } else {
            // Subject key doesn't exist in the scores object
            newScoreForm[subject] = null;
            console.warn(`Subject ${subject} not found in scores object`);
        }
      });
      
      scoreForm.value = newScoreForm;
      originalScores.value = { ...scoreForm.value }; // Deep copy for comparison

      console.log('学生成绩加载完成', scoreForm.value);
      isScoreChanged.value = false; // Reset changed flag after load
    } else {
      console.warn('未找到学生成绩记录、科目列表或API响应无效, 表单已重置.');
      ElMessage.info(`未找到该考试的成绩记录，可编辑并保存新成绩`);
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

// 重置成绩表单 (Clear activeSubjects and reset forms to empty objects)
const resetScoreForm = () => {
  activeSubjects.value = []; // Clear the subjects list
  scoreForm.value = {}; // Reset to empty object
  originalScores.value = {}; // Reset to empty object
  isScoreChanged.value = false;
};

// 取消修改 (Restore using originalScores, check if activeSubjects needs reset?)
const handleCancel = () => {
  // Restore from originalScores.value. No need to touch activeSubjects here.
  scoreForm.value = { ...originalScores.value };
  isScoreChanged.value = false;
  ElMessage.info('修改已取消');
};

// 计算总分 (Iterate over activeSubjects)
const calculateTotalScore = () => {
  // Check if activeSubjects has items to avoid division by zero later
  if (!activeSubjects.value || activeSubjects.value.length === 0) return '0.0';
  
  return activeSubjects.value.reduce((sum, subject) => {
    const score = scoreForm.value[subject];
    return sum + (typeof score === 'number' ? score : 0);
  }, 0).toFixed(1);
};

// 计算平均分 (Iterate over activeSubjects)
const calculateAverageScore = () => {
  // Check if activeSubjects has items
  if (!activeSubjects.value || activeSubjects.value.length === 0) return '0.0';

  const validScores = activeSubjects.value
    .map(subject => scoreForm.value[subject])
    .filter(score => typeof score === 'number') as number[];
    
  if (validScores.length === 0) return '0.0';
  const sum = validScores.reduce((acc, score) => acc + score, 0);
  return (sum / validScores.length).toFixed(1); // Average over subjects with valid scores
};

// 保存成绩 (Iterate over activeSubjects to build scoresToSave)
const handleSave = async () => {
  // ... (Keep existing ID validations) ...
  if (typeof selectedStudent.value !== 'number' || selectedStudent.value <= 0) {
    ElMessage.warning('无效的学生ID，请重新选择');
    return;
  }
  if (typeof selectedExamName.value !== 'number' || selectedExamName.value <= 0) {
    ElMessage.warning('无效的考试ID，请重新选择');
    return;
  }

  const scoresToSave: Record<string, number> = {};
  // Iterate over the currently active subjects
  activeSubjects.value.forEach(subject => { 
    const score = scoreForm.value[subject];
    if (typeof score === 'number' && !isNaN(score)) {
      scoresToSave[subject] = score;
    }
    // Optional: Decide if you want to save subjects with null score as 0 or omit them
    // else if (score === null) { scoresToSave[subject] = 0; } // Example: save null as 0
  });

  const saveData: SaveScoreParams = {
    studentId: selectedStudent.value,
    examId: selectedExamName.value,
    examType: selectedExamType.value, // Ensure this has a value if needed by backend
    scores: scoresToSave // Send only scores for active subjects
  };

  // ... (Keep existing API call and error handling logic) ...
  console.log('即将保存的成绩数据:', JSON.stringify(saveData)); 
  loading.value = true;
  try {
    // Use the imported saveStudentScore function
    const res = await scoreApi.saveStudentScore(saveData);
    if (res && (res.code === 200 || res.code === 201)) {
        ElMessage.success('成绩保存成功');
      originalScores.value = { ...scoreForm.value };
      isScoreChanged.value = false;
    } else {
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

// 处理成绩输入变化 (Comparison logic remains the same)
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
    // Corrected: Call scoreApi.testConnection()
    // const apiTestResult = await scoreApi.testConnection() // 注释掉这行
    // if (apiTestResult) { // testConnection returns boolean
    // 默认加载数据，不再依赖 testConnection
    await fetchClassList() // Fetches class names
    await fetchExamTypes()
    // } else {
    //   ElMessage.error('成绩API连接失败，请检查网络连接')
    // }
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

<style lang="scss" scoped>
.score-container {
  padding: 20px;
  background-color: var(--el-bg-color-page);
  min-height: calc(100vh - 84px); /* Adjust based on layout */
  transition: background-color 0.3s;
}

.header-card,
.score-form-card {
  background-color: var(--el-card-bg-color, var(--el-bg-color-overlay));
  border: 1px solid var(--el-border-color-lighter);
  margin-bottom: 20px;
  transition: background-color 0.3s, border-color 0.3s;
}

.page-header {
  /* Styles for page header */
}
.header-title {
  display: flex;
  align-items: center;
  font-size: 1.5em;
  font-weight: bold;
  color: var(--el-text-color-primary);
  margin-bottom: 5px;
}
.header-title .el-icon {
  margin-right: 10px;
}
.header-desc {
  font-size: 0.9em;
  color: var(--el-text-color-secondary);
}

.student-select-area {
  margin-top: 15px;
  padding: 15px;
  background-color: var(--el-fill-color-lighter);
  border-radius: 4px;
  transition: background-color 0.3s;
}

.area-title {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  font-weight: bold;
  color: var(--el-text-color-regular);
}
.area-title .el-icon {
  margin-right: 5px;
}

.selection-form {
  /* Remove background, rely on parent */
}

/* Card header inside score-form-card */
.score-form-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 10px;
}
.student-details {
  display: flex;
  flex-direction: column;
}
.student-name {
  font-weight: bold;
  color: var(--el-text-color-primary);
}
.exam-type {
  font-size: 0.9em;
  color: var(--el-text-color-secondary);
}

.exam-info {
  /* Styles for exam info */
}
.exam-date-tag {
  background-color: var(--el-bg-color-page);
  border-color: var(--el-border-color);
  color: var(--el-text-color-secondary);
  display: inline-flex; 
  align-items: center;
  gap: 5px;
}

.score-form {
  padding-top: 20px;
}

.score-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.subject-card {
  border: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-card-bg-color, var(--el-bg-color-overlay));
  transition: background-color 0.3s, border-color 0.3s;
}

/* Subject card specific styles */
.subject-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.subject-score {
  margin-top: 10px;
}
.score-input :deep(.el-input-number__decrease),
.score-input :deep(.el-input-number__increase) {
  background-color: var(--el-fill-color-light) !important;
  color: var(--el-text-color-regular) !important;
}

.score-visual {
  height: 6px;
  background-color: var(--el-fill-color-light);
  border-radius: 3px;
  margin-top: 8px;
  overflow: hidden;
}

.score-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease-in-out, background-color 0.3s ease-in-out;
}

.subject-card.high-score {
  border-left: 4px solid #67C23A;
}
.subject-card.low-score {
  border-left: 4px solid #F56C6C;
}

/* Score summary styles */
.score-summary {
  display: flex;
  gap: 20px;
  margin-top: 30px;
  margin-bottom: 20px;
}
.summary-card {
  flex: 1;
  text-align: center;
  background-color: var(--el-card-bg-color, var(--el-bg-color-overlay));
  border: 1px solid var(--el-border-color-lighter);
}

.summary-header {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}
.summary-value {
  font-size: 24px;
  font-weight: bold;
  margin-top: 10px;
  color: var(--el-text-color-primary);
}

/* Form footer */
.form-footer {
  text-align: right;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid var(--el-border-color-lighter);
}

/* Empty state */
.empty-placeholder {
  margin-top: 50px;
  /* rely on EP default dark mode */
}

/* Optional: Adjust specific element styles if needed in dark mode */
.dark :deep(.el-select .el-input__wrapper) {
  /* Example: Adjust select background if needed */
}
.dark :deep(.el-input-number .el-input__wrapper) {
  /* Example: Adjust number input background if needed */
}

</style>