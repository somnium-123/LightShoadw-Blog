<template>
  <view class="app">
    <router-view />
  </view>
</template>

<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'

onLaunch(() => {
  console.log('Movie Blog App Launch')
})
</script>

<style lang="scss">
@import '@/styles/common.scss';

.app {
  min-height: 100vh;
  background-color: $bg-secondary;
  color: $text-primary;
}
</style>
