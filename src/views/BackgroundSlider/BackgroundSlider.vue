<template>
  <div class="background-slider">
    <transition-group name="fade">
      <div 
        v-for="(image, index) in images" 
        :key="image"
        v-show="currentIndex === index"
        class="background-image"
        :style="{ backgroundImage: `url(${image})` }"
      />
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// 使用相对路径引入图片
const images = [
  new URL('../../assets/images/bg1.jpg', import.meta.url).href,
  new URL('../../assets/images/bg2.jpg', import.meta.url).href,
  new URL('../../assets/images/bg3.jpg', import.meta.url).href
]

const currentIndex = ref(0)
let timer: number

const changeBackground = () => {
  currentIndex.value = (currentIndex.value + 1) % images.length
}

onMounted(() => {
  timer = setInterval(changeBackground, 5000)
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<style scoped>
.background-slider {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}

.background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 1;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 1s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>