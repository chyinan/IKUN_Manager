<template>
  <div class="announcements-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>学校通知</span>
        </div>
      </template>
      <div v-loading="loading">
        <el-timeline v-if="announcements.length > 0">
          <el-timeline-item
            v-for="item in announcements"
            :key="item.id"
            :timestamp="item.published_at"
            placement="top"
          >
            <el-card class="announcement-card">
              <template #header>
                <div class="announcement-title">
                  <el-tag v-if="item.is_pinned" type="danger" effect="dark" size="small" class="pin-tag">置顶</el-tag>
                  <span>{{ item.title }}</span>
                </div>
              </template>
              <!-- Use v-html to render HTML content from the backend -->
              <div class="announcement-content" v-html="item.content"></div>
              <div class="announcement-footer">
                <span>发布者: {{ item.author_name }}</span>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else-if="!loading && announcements.length === 0" description="暂无新的学校通知"></el-empty>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getAnnouncements } from '@/api/announcement';
import type { Announcement } from '@/api/announcement';
import { ElMessage } from 'element-plus';

const loading = ref(true);
const announcements = ref<Announcement[]>([]);

const fetchAnnouncements = async () => {
  try {
    loading.value = true;
    const res = await getAnnouncements();
    if (res.code === 200) {
      announcements.value = res.data;
    } else {
      ElMessage.error(res.message || '获取通知列表失败');
    }
  } catch (error: any) {
    console.error('[Announcements] Error fetching data:', error);
    ElMessage.error('获取通知列表时发生网络错误');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchAnnouncements();
});
</script>

<style scoped lang="scss">
.announcements-container {
  padding: 0;
}

.card-header span {
  font-weight: bold;
  font-size: 18px;
}

.announcement-card {
  border-radius: 8px;
  .announcement-title {
    font-weight: bold;
    font-size: 16px;
    display: flex;
    align-items: center;
  }
  .pin-tag {
    margin-right: 8px;
    height: 20px;
    line-height: 20px;
  }
  .announcement-content {
    padding: 16px 0;
    line-height: 1.6;
    color: #606266;
  }
  .announcement-footer {
    text-align: right;
    font-size: 12px;
    color: #909399;
    margin-top: 10px;
    border-top: 1px solid #e4e7ed;
    padding-top: 10px;
  }
}

// Custom timeline styles
:deep(.el-timeline-item__timestamp) {
  font-size: 14px;
  color: #303133;
}
</style> 