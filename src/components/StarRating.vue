<template>
  <view
    class="star-rating"
    :class="sizeClass"
    :style="{ '--rating': ratingPercent }"
  >
    <view class="stars-bg">
      <text v-for="i in 5" :key="i" class="star">★</text>
    </view>
    <view class="stars-fill">
      <text v-for="i in 5" :key="i" class="star">★</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  rating: number
  size?: 'sm' | 'md' | 'lg'
}>(), {
  size: 'md',
})

const ratingPercent = computed(() => {
  const pct = (Math.min(10, Math.max(0, props.rating)) / 10) * 100
  return `${pct}%`
})

const sizeClass = computed(() => `star-rating--${props.size}`)
</script>

<style lang="scss" scoped>
.star-rating {
  position: relative;
  display: inline-flex;
  font-size: 28rpx;

  &--sm { font-size: 20rpx; }
  &--md { font-size: 28rpx; }
  &--lg { font-size: 36rpx; }
}

.stars-bg {
  color: rgba(255, 255, 255, 0.12);
  white-space: nowrap;
  letter-spacing: 2rpx;
}

.stars-fill {
  position: absolute;
  top: 0;
  left: 0;
  color: $accent;
  white-space: nowrap;
  overflow: hidden;
  width: var(--rating);
  letter-spacing: 2rpx;
}

.star {
  display: inline;
}
</style>
