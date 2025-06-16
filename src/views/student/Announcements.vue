<template>
  <div class="announcements-container">
    <el-card shadow="never" class="page-main-card">
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
import dayjs from 'dayjs';

const loading = ref(true);
const announcements = ref<Announcement[]>([]);

const fetchAnnouncements = async () => {
  try {
    loading.value = true;
    const res = await getAnnouncements();
    if (res.code === 200) {
      announcements.value = res.data.map((a: any) => ({
        ...a,
        published_at: a.published_at ? dayjs(a.published_at).format('YYYY-MM-DD HH:mm:ss') : '-',
      }));
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

.page-main-card {
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
  
  :deep(.el-card__header) {
    border-bottom: none;
    .card-header span {
      font-weight: bold;
      font-size: 1.5rem;
      color: #fff;
      text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
    }
  }

  :deep(.el-card__body) {
    padding: 20px 0 20px 20px;
  }
}


.announcement-card {
  background-color: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: #fff;

  :deep(.el-card__header) {
    border-bottom-color: rgba(255, 255, 255, 0.2);
  }

  .announcement-title {
    font-weight: bold;
    font-size: 1.1rem;
    color: #fff;
    display: flex;
    align-items: center;
  }
  .pin-tag {
    margin-right: 8px;
  }
  .announcement-content {
    padding: 16px 0;
    line-height: 1.7;
    color: #e5e7eb; // Softer white
    
    // Style for content that comes from v-html
    :deep(p) {
      margin: 0 0 1em;
    }
    :deep(strong) {
      font-weight: 600;
    }
  }
  .announcement-footer {
    text-align: right;
    padding-right: 20px; // Nudge the author info slightly to the left

    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 10px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    padding-top: 10px;
  }
}

// Custom timeline styles
:deep(.el-timeline-item__timestamp) {
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
}

:deep(.el-timeline-item__tail) {
  border-left-color: rgba(255, 255, 255, 0.3);
}

:deep(.el-timeline-item__node) {
  background-color: var(--el-color-primary-light-3);
  box-shadow: 0 0 8px var(--el-color-primary-light-5);
}

:deep(.el-empty__description p) {
  color: #fff;
}
</style> 