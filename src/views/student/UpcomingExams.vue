<template>
  <div class="upcoming-exams-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>待考考试</span>
        </div>
      </template>
      <div v-loading="loading">
        <el-table :data="upcomingExams" stripe style="width: 100%" empty-text="暂无待考安排">
          <el-table-column prop="exam_name" label="考试名称" min-width="250" />
          <el-table-column prop="exam_type" label="考试类型" width="120" />
          <el-table-column prop="exam_date" label="考试时间" width="180" />
          <el-table-column prop="subjects" label="考试科目" min-width="300">
            <template #default="{ row }">
              <el-tag v-for="subject in row.subjects.split(',')" :key="subject" type="info" style="margin: 2px;">
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
import { getStudentUpcomingExams } from '@/api/score';
import { ElMessage } from 'element-plus';

interface UpcomingExam {
  exam_id: number;
  exam_name: string;
  exam_type: string;
  exam_date: string;
  subjects: string;
}

const userStore = useUserStore();
const loading = ref(true);
const upcomingExams = ref<UpcomingExam[]>([]);

const fetchUpcomingExams = async () => {
  const userId = userStore.userInfo?.id;
  if (!userId) {
    ElMessage.warning('无法获取用户信息，请重新登录。');
    loading.value = false;
    return;
  }

  try {
    loading.value = true;
    const res = await getStudentUpcomingExams(userId);
    if (res.code === 200) {
      upcomingExams.value = res.data;
    } else {
      ElMessage.error(res.message || '获取待考列表失败');
    }
  } catch (error) {
    ElMessage.error('获取待考列表时发生网络错误');
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

.card-header span {
  font-weight: bold;
  font-size: 18px;
}
</style> 