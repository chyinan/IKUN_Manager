<template>
  <div class="upcoming-exams-container">
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <span>待考考试</span>
        </div>
      </template>
      <div v-loading="loading">
        <el-table :data="upcomingExams" class="modern-table" style="width: 100%" empty-text="暂无待考安排">
          <el-table-column prop="exam_name" label="考试名称" min-width="250" />
          <el-table-column prop="exam_type" label="考试类型" width="120" />
          <el-table-column prop="exam_date" label="考试时间" width="180" />
          <el-table-column prop="subjects" label="考试科目" min-width="300">
            <template #default="{ row }">
              <el-tag 
                v-for="subject in row.subjects.split(',').filter((s: string) => s)" 
                :key="subject" 
                class="subject-tag"
                style="margin: 2px;"
              >
                {{ subject }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!loading && upcomingExams.length === 0" description="太棒了！当前没有待考的考试。"></el-empty>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { getStudentUpcomingExams, type ExamTaken } from '@/api/score';
import { ElMessage } from 'element-plus';

// Use the imported ExamTaken type and add the non-optional subjects property for the view model.
interface UpcomingExamViewModel extends Omit<ExamTaken, 'subjects'> {
  subjects: string;
}

const userStore = useUserStore();
const loading = ref(true);
const upcomingExams = ref<UpcomingExamViewModel[]>([]);

const fetchUpcomingExams = async () => {
  const userId = userStore.userInfo?.id;
  if (!userId) {
    ElMessage.warning('无法获取用户信息，请重新登录。');
    loading.value = false;
    return;
  }

  try {
    loading.value = true;
    const res = await getStudentUpcomingExams(userId); // res is ApiResponse<ExamTaken[]>
    if (res.code === 200) {
      upcomingExams.value = res.data.map((exam: ExamTaken): UpcomingExamViewModel => ({
        ...exam,
        subjects: exam.subjects || '' // Ensure subjects is a string
      }));
    } else {
      ElMessage.error(res.message || '获取待考列表失败');
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取待考列表时发生网络错误');
    console.error('[UpcomingExams] Error fetching data:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchUpcomingExams();
});
</script>

<style scoped lang="scss">
.upcoming-exams-container {
  padding: 0;
}

.table-card {
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
  
  :deep(.el-card__header) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    padding-left: 0;
    padding-right: 0;
  }
  
  :deep(.el-card__body) {
    padding: 0;
  }
}

.card-header span {
  font-weight: 600;
  font-size: 1.5rem;
  color: #fff;
  text-shadow: 1px 1px 3px rgba(0,0,0,0.2);
}

// Modern Table Styling
:deep(.modern-table) {
  background-color: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  overflow: hidden;

  // --- 您提供的核心修复 ---
  --el-table-border-color: rgba(255, 255, 255, 0.2);

  .el-table__header-wrapper th,
  .el-table__header-wrapper tr {
    background-color: rgb(91 161 233 / 8%) !important;
    color: #fff;
    font-weight: 600;
    // border-color is now handled by the CSS variable above
  }

  .el-table__row {
    color: #ffffff;
    background-color: rgb(156 229 255 / 38%) !important;
    
    &:hover > td {
      background-color: rgba(156, 229, 255, 0.5) !important;
    }
  }

  td.el-table__cell,
  th.el-table__cell.is-leaf {
    border-color: transparent !important; // Let the variable control this
  }

  // Remove the default top and bottom border lines of the table
  &::before,
  &::after {
    display: none;
  }
  
  .el-table__inner-wrapper {
     border-radius: 12px;
  }
  
  .el-table__empty-text {
    color: #c0c4cc;
  }
}

.subject-tag {
  background-color: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.25);
  color: #e0e7ff;
  font-weight: 500;
}

:deep(.el-empty__description p) {
  color: #fff;
  opacity: 0.8;
}
</style>
 