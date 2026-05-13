<template>
  <view class="skeleton-wrapper">
    <view v-if="type === 'poster'" class="skeleton skeleton-poster" />
    <view v-else-if="type === 'card'" class="skeleton-card">
      <view class="skeleton skeleton-img" />
      <view class="skeleton-text">
        <view class="skeleton skeleton-title" />
        <view class="skeleton skeleton-subtitle" />
      </view>
    </view>
    <view v-else-if="type === 'detail'" class="skeleton-detail">
      <view class="skeleton skeleton-backdrop" />
      <view class="skeleton skeleton-poster-inline" />
      <view class="skeleton skeleton-line" style="width: 60%" />
      <view class="skeleton skeleton-line" style="width: 80%" />
      <view class="skeleton skeleton-line" style="width: 40%" />
    </view>
    <view v-else-if="type === 'list'" class="skeleton-list">
      <view v-for="i in count" :key="i" class="skeleton skeleton-row" />
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  type: 'poster' | 'card' | 'detail' | 'list'
  count?: number
}>()
</script>

<style lang="scss" scoped>
.skeleton-wrapper {
  width: 100%;
}

.skeleton-poster {
  width: 260rpx;
  height: 364rpx;
  border-radius: $radius-md;
  display: inline-block;
  margin-right: $spacing-md;
}

.skeleton-card {
  display: flex;
  gap: $spacing-md;
  padding: $spacing-md;

  .skeleton-img {
    width: 140rpx;
    height: 200rpx;
    border-radius: $radius-md;
    flex-shrink: 0;
  }

  .skeleton-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
    padding-top: $spacing-sm;
  }

  .skeleton-title {
    height: 36rpx;
    width: 60%;
  }

  .skeleton-subtitle {
    height: 28rpx;
    width: 40%;
  }
}

.skeleton-detail {
  position: relative;
  padding: 0 $spacing-lg;

  .skeleton-backdrop {
    width: 100%;
    height: 400rpx;
    border-radius: $radius-lg;
    margin-bottom: $spacing-lg;
  }

  .skeleton-poster-inline {
    width: 200rpx;
    height: 300rpx;
    border-radius: $radius-md;
    margin-bottom: $spacing-lg;
  }

  .skeleton-line {
    height: 28rpx;
    margin-bottom: $spacing-md;
    border-radius: $radius-sm;
  }
}

.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  padding: 0 $spacing-lg;

  .skeleton-row {
    height: 80rpx;
    border-radius: $radius-md;
  }
}
</style>
