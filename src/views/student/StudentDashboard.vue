<template>
  <div class="student-dashboard-container">
    <el-card shadow="never" class="carousel-card">
      <template #header>
        <div class="card-header">
          <span>校园掠影</span>
        </div>
      </template>
      <el-skeleton :loading="loading" animated>
        <template #template>
          <el-skeleton-item variant="image" style="width: 100%; height: 400px;" />
        </template>
        <template #default>
          <el-carousel
            v-if="carouselImages.length > 0"
            :interval="carouselPlayInterval"
            arrow="always"
            indicator-position="outside"
            height="400px"
          >
            <el-carousel-item v-for="item in carouselImages" :key="item.id">
              <a v-if="item.link_url && item.link_url.trim() !== '' && item.link_url.trim() !== '#'"
                 :href="formatLinkUrl(item.link_url)"
                 target="_blank"
                 rel="noopener noreferrer"
              >
                <img :src="getImageUrl(item.image_url)" :alt="item.title || '轮播图'" class="carousel-image"/>
                <h3 v-if="item.title" class="carousel-title">{{ item.title }}</h3>
              </a>
              <template v-else>
                <img :src="getImageUrl(item.image_url)" :alt="item.title || '轮播图'" class="carousel-image"/>
                <h3 v-if="item.title" class="carousel-title">{{ item.title }}</h3>
              </template>
            </el-carousel-item>
          </el-carousel>
          <el-empty v-else description="暂无轮播图内容"></el-empty>
        </template>
      </el-skeleton>
    </el-card>

    <!-- 未来可以添加其他Dashboard内容，例如 -->
    <!-- <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <Announcements />
      </el-col>
      <el-col :span="12">
        <UpcomingExams />
      </el-col>
    </el-row>
    <el-row style="margin-top: 20px;">
      <el-col :span="24">
        <MyScoresOverview />  // 假设有这样一个组件
      </el-col>
    </el-row> -->

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getActiveCarouselImages, type CarouselImage } from '@/api/carousel'
import { getCarouselIntervalConfig } from '@/api/config'

const carouselImages = ref<CarouselImage[]>([])
const loading = ref(true)
const carouselPlayInterval = ref(5000);

const SERVER_BASE_URL = 'http://localhost:3000';

const getImageUrl = (imageUrlFromServer: string) => {
  if (!imageUrlFromServer) return '';

  let path = imageUrlFromServer;
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  return `${SERVER_BASE_URL}${path}`;
}

const formatLinkUrl = (url: string | null | undefined): string => {
  if (!url || url.trim() === '#' || url.trim() === '') return 'javascript:void(0);';
  const trimmedUrl = url.trim();
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }
  if (trimmedUrl.startsWith('//')) {
    return `https:${trimmedUrl}`;
  }
  return `https://${trimmedUrl}`;
}

const fetchCarouselImages = async () => {
  try {
    loading.value = true;
    const response = await getActiveCarouselImages(); // response is { code, data, message }
    if (response.code === 200 && Array.isArray(response.data)) {
      carouselImages.value = response.data;
    } else {
      ElMessage.error(response.message || '获取轮播图数据失败');
    }
  } catch (error: any) {
    console.error("获取轮播图数据失败:", error);
    const errorMessage = error?.response?.data?.message || error?.message || '获取轮播图时发生网络错误';
    ElMessage.error(errorMessage);
  } finally {
    loading.value = false;
  }
}

const fetchPlayInterval = async () => {
  try {
    const response = await getCarouselIntervalConfig();
    if (response.code === 200 && response.data && typeof response.data.carouselInterval === 'number') {
      carouselPlayInterval.value = response.data.carouselInterval;
    }
  } catch (error: any) {
    console.warn("获取轮播图播放间隔失败，将使用默认值:", error);
  }
};

onMounted(() => {
  fetchCarouselImages();
  fetchPlayInterval();
})
</script>

<style scoped lang="scss">
.student-dashboard-container {
  // padding: 20px; /* Let the card be the main element */
}

.carousel-card {
  margin-bottom: 20px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.4);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);

  :deep(.el-card__header) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  }
}

.card-header span {
  font-weight: 600;
  font-size: 1.5rem; /* Increased size for better visual hierarchy */
  color: #fff; /* White color for better contrast on glass background */
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2); /* Subtle shadow for depth */
}

.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.el-carousel__item h3.carousel-title {
  color: #fff;
  font-size: 18px;
  opacity: 0.85;
  position: absolute;
  bottom: 20px;
  left: 20px;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 5px 10px;
  border-radius: 4px;
  margin: 0;
}
</style> 