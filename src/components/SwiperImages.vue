<template>
  <view class="swiper-images">
    <scroll-view
      class="images-scroll"
      scroll-x
      enable-flex
      :show-scrollbar="false"
      scroll-with-animation
    >
      <view
        v-for="(img, index) in images"
        :key="index"
        class="image-item"
        @click="previewImage(index)"
      >
        <image
          class="backdrop"
          :src="getBackdropUrl(img.file_path, 'w780')"
          mode="aspectFill"
          lazy-load
        />
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import type { MovieImage } from '@/types'
import { getBackdropUrl } from '@/utils/helpers'

defineProps<{
  images: MovieImage[]
}>()

function previewImage(current: number) {
  // #ifdef H5
  uni.previewImage({
    urls: [],
    current,
  })
  // #endif
}
</script>

<style lang="scss" scoped>
.images-scroll {
  display: flex;
  flex-direction: row;
  white-space: nowrap;

  ::-webkit-scrollbar {
    display: none;
  }
}

.image-item {
  display: inline-block;
  flex-shrink: 0;
  width: 320rpx;
  height: 200rpx;
  margin-right: $spacing-md;
  border-radius: $radius-md;
  overflow: hidden;
  background-color: $bg-card;
  box-shadow: $shadow-card;
}

.backdrop {
  width: 100%;
  height: 100%;
}
</style>
