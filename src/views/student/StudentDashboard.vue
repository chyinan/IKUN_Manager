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
import { getActiveCarouselImages } from '@/api/carousel'
import { getCarouselIntervalConfig } from '@/api/config'

// 定义轮播图项目的类型接口
interface CarouselItem {
  id: number;
  image_url: string; // 通常是文件名，如 'image1.jpg'
  title?: string;
  link_url?: string;
  // 其他可能的字段，如 display_order, is_active (虽然这里只获取active的)
}

const carouselImages = ref<CarouselItem[]>([])
const loading = ref(true)
const carouselPlayInterval = ref(5000); // Added - default 5000ms

// 假设这是您的后端服务器地址 (没有 /api 后缀)
// 考虑将其配置在 .env 文件中，然后通过 import.meta.env.VITE_SERVER_BASE_URL 导入
const SERVER_BASE_URL = 'http://localhost:3000'; 

// 辅助函数：获取完整的图片URL
const getImageUrl = (imageUrlFromServer: string) => {
  if (!imageUrlFromServer) return '';
  
  // imageUrlFromServer 已经是像 "/uploads/carousel/banner-1.jpg" 这样的形式
  // 我们需要确保它以 '/' 开头（虽然从日志看已经是了），然后拼接到服务器基础URL
  let path = imageUrlFromServer;
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  return `${SERVER_BASE_URL}${path}`;
}

// 辅助函数：格式化跳转链接，确保是绝对URL
const formatLinkUrl = (url: string | null | undefined): string => {
  if (!url || url.trim() === '#' || url.trim() === '') return 'javascript:void(0);'; // 返回一个无操作的javascript链接，或者不渲染<a>标签

  // 移除可能存在的前后空格
  const trimmedUrl = url.trim();

  // 检查是否已经是完整的HTTP/HTTPS URL
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }
  // 检查是否是协议相对URL (例如 //example.com)
  if (trimmedUrl.startsWith('//')) {
    return `https:${trimmedUrl}`; // 默认使用 https
  }
  // 否则，默认添加 https://
  return `https://${trimmedUrl}`;
}

const fetchCarouselData = async () => {
  loading.value = true;
  try {
    const response = await getActiveCarouselImages();
    if (response.code === 200 && Array.isArray(response.data)) {
      carouselImages.value = response.data;
      if (carouselImages.value.length === 0) {
        // 可以选择不显示消息，或者用 ElEmpty 的 description
        // ElMessage.info('当前没有可显示的轮播图');
      }
    } else {
      ElMessage.error(response.message || '获取轮播图数据失败');
    }
  } catch (error: any) {
    console.error("获取轮播图数据失败:", error);
    ElMessage.error(error.response?.data?.message || error.message || '获取轮播图时发生网络错误');
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
    // No error message here as default is used if fetch fails
  } catch (error) {
    console.warn("获取轮播图播放间隔失败，将使用默认值:", error);
    // Silently fail and use default interval
  }
};

onMounted(() => {
  fetchCarouselData();
  fetchPlayInterval();
})
</script>

<style scoped lang="scss">
.student-dashboard-container {
  padding: 20px; // 为整个仪表盘容器添加内边距
}

.carousel-card {
  margin-bottom: 20px;
}

.card-header span {
  font-weight: bold;
  font-size: 18px;
}

.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: cover; // 图片覆盖整个区域，可能会裁剪
  // object-fit: contain; // 图片完整显示，可能会有留白
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

// 确保el-carousel item的内容垂直居中 (如果需要的话)
// :deep(.el-carousel__item) {
//   display: flex;
//   align-items: center;
//   justify-content: center;
// }
</style> 