<template>
  <!-- 视频播放器容器 -->
  <div class="video-container">
    <!-- B站视频嵌入播放器 -->
    <iframe 
      src="//player.bilibili.com/player.html?isOutside=true&aid=90473739&bvid=BV1P7411w7yv&cid=154513056&p=1" 
      scrolling="no" 
      border="0" 
      frameborder="no" 
      framespacing="0" 
      allowfullscreen="true"
    ></iframe>
  </div>
  <!-- 团队成员标签展示区 -->
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
</script>

<style scoped>
/* 视频容器样式 */
.video-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  aspect-ratio: 16 / 9;  /* 保持16:9的视频比例 */
}

/* 视频播放器iframe样式 */
.video-container iframe {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

/* 标签容器样式 */
.tag-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
}

/* 自定义标签样式 */
.custom-tag {
  padding: 10px 20px;
  font-size: 16px;
}
</style>
