<template>
  <div class="video-container">
    <iframe 
      src="//player.bilibili.com/player.html?isOutside=true&aid=90473739&bvid=BV1P7411w7yv&cid=154513056&p=1" 
      scrolling="no" 
      border="0" 
      frameborder="no" 
      framespacing="0" 
      allowfullscreen="true"
    ></iframe>
  </div>
  <div class="tag-container">
    <el-tag class="custom-tag" type="primary">陈胤安</el-tag>
    <el-tag class="custom-tag" type="success">赵艺勋</el-tag>
    <el-tag class="custom-tag" type="info">熊灵杰</el-tag>
    <el-tag class="custom-tag" type="warning">曾一帆</el-tag>
    <el-tag class="custom-tag" type="danger">尹崇翰</el-tag>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const carouselHeight = ref('400px')
const carouselImg = ref(null)

const handleImageLoad = (e: Event) => {
  const img = e.target as HTMLImageElement
  carouselHeight.value = `${img.naturalHeight}px`
}

const carouselImages = [
  '/src/assets/images/1.jpg',  // 替换为你的实际图片路径
  '/src/assets/images/2.jpg',
  '/src/assets/images/3.jpg'
]
</script>

<style scoped>
.video-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  aspect-ratio: 16 / 9;
}

.video-container iframe {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}
.tag-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
}

.custom-tag {
  padding: 10px 20px;
  font-size: 16px;
}
</style>
