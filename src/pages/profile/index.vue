<template>
  <view class="page-profile">
    <!-- 登录状态 -->
    <template v-if="userStore.isLoggedIn">
      <!-- 用户信息卡片 -->
      <view class="user-card">
        <image class="avatar" :src="userStore.userInfo?.avatarUrl || defaultAvatar" mode="aspectFill" />
        <text class="nickname">{{ userStore.userInfo?.nickName || '影迷' }}</text>
      </view>

      <!-- 观影统计 -->
      <view class="stats-card">
        <view class="stat-item">
          <text class="stat-value">{{ userStore.watchedCount }}</text>
          <text class="stat-label">看过</text>
        </view>
        <view class="stat-divider" />
        <view class="stat-item">
          <text class="stat-value">{{ userStore.wishCount }}</text>
          <text class="stat-label">想看</text>
        </view>
        <view class="stat-divider" />
        <view class="stat-item">
          <text class="stat-value">{{ userStore.avgRating || '-' }}</text>
          <text class="stat-label">平均评分</text>
        </view>
        <view class="stat-divider" />
        <view class="stat-item">
          <text class="stat-value">{{ userStore.totalRuntime }}</text>
          <text class="stat-label">观影时长(h)</text>
        </view>
      </view>

      <!-- 片单 Tab -->
      <view class="tab-bar">
        <view
          v-for="tab in listTabs"
          :key="tab.key"
          class="tab"
          :class="{ active: activeListTab === tab.key }"
          @click="activeListTab = tab.key"
        >
          <text>{{ tab.label }}</text>
        </view>
      </view>

      <!-- 看过列表 -->
      <view v-if="activeListTab === 'watched'" class="list-section">
        <template v-if="userStore.watchedList.length">
          <view
            v-for="item in userStore.watchedList"
            :key="item._id || item.movie_id + '_watched'"
            class="movie-row"
            @click="goDetail(item.movie_id)"
          >
            <image
              class="row-poster"
              :src="getPosterUrl(item.movie_poster, 'w342')"
              mode="aspectFill"
              lazy-load
            />
            <view class="row-info">
              <text class="row-title text-ellipsis">{{ item.movie_title }}</text>
              <text class="row-date">看过: {{ formatDate(item.watched_at) }}</text>
            </view>
            <text class="row-arrow">›</text>
          </view>
        </template>
        <view v-else class="empty-state">
          <text class="empty-text">还没有标记过电影</text>
        </view>
      </view>

      <!-- 想看列表 -->
      <view v-if="activeListTab === 'wish'" class="list-section">
        <template v-if="userStore.wishList.length">
          <view
            v-for="item in userStore.wishList"
            :key="item._id || item.movie_id + '_wish'"
            class="movie-row"
            @click="goDetail(item.movie_id)"
          >
            <image
              class="row-poster"
              :src="getPosterUrl(item.movie_poster, 'w342')"
              mode="aspectFill"
              lazy-load
            />
            <view class="row-info">
              <text class="row-title text-ellipsis">{{ item.movie_title }}</text>
              <text class="row-date">添加: {{ formatDate(item.created_at) }}</text>
            </view>
            <text class="row-arrow">›</text>
          </view>
        </template>
        <view v-else class="empty-state">
          <text class="empty-text">还没有想看的电影</text>
        </view>
      </view>
    </template>

    <!-- 未登录状态 -->
    <view v-else class="login-card">
      <text class="login-icon">🎬</text>
      <text class="login-title">登录 MovieBlog</text>
      <text class="login-desc">记录你的观影足迹</text>
      <button class="login-btn" :loading="userStore.loginLoading" @click="handleLogin">
        微信一键登录
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'
import { getPosterUrl } from '@/utils/helpers'

const userStore = useUserStore()

const defaultAvatar = '/static/images/placeholder-avatar.png'

const listTabs = [
  { key: 'watched', label: '看过' },
  { key: 'wish', label: '想看' },
]
const activeListTab = ref('watched')

function formatDate(ts?: number): string {
  if (!ts) return '-'
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function handleLogin() {
  // #ifdef MP-WEIXIN
  await userStore.login()
  // #endif

  // #ifdef H5
  uni.showToast({ title: '请在微信小程序中登录', icon: 'none' })
  // #endif
}

function goDetail(movieId: number) {
  uni.navigateTo({ url: `/pages/movie-detail/index?id=${movieId}` })
}
</script>

<style lang="scss" scoped>
.page-profile {
  min-height: 100vh;
  background: $bg-secondary;
  padding-bottom: 120rpx;
}

.user-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx $spacing-xl $spacing-xxl;
  background: $bg-primary;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: $bg-secondary;
  border: 3rpx solid rgba($color-primary, 0.3);
  box-shadow: 0 0 32rpx rgba($color-primary, 0.08);
}

.nickname {
  font-size: $font-xl;
  font-weight: 700;
  margin-top: $spacing-lg;
  color: $text-primary;
}

.stats-card {
  display: flex;
  margin: 20rpx 30rpx;
  padding: 40rpx;
  background: $color-primary-gradient;
  border-radius: $radius-lg;
  justify-content: space-around;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.stat-value {
  font-size: 48rpx;
  font-weight: 700;
  color: #FFFFFF;
}

.stat-label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.8);
}

.stat-divider {
  width: 1rpx;
  background: rgba(255, 255, 255, 0.25);
  align-self: stretch;
}

.tab-bar {
  display: flex;
  margin: 0 30rpx;
  background: $bg-primary;
  border-radius: $radius-md;
  overflow: hidden;
}

.tab {
  flex: 1;
  text-align: center;
  padding: $spacing-md 0;
  font-size: $font-md;
  color: $text-secondary;
  font-weight: 500;
  transition: all $transition-smooth;

  &.active {
    color: $color-primary;
    font-weight: 700;
    background: rgba($color-primary, 0.06);
    border-bottom: 4rpx solid $color-primary;
  }
}

.list-section {
  padding: 0 30rpx;
  background: $bg-primary;
  margin-top: 20rpx;
}

.movie-row {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid $divider;
  gap: 20rpx;

  &:last-child { border-bottom: none; }

  &:active {
    background: $bg-secondary;
    margin: 0 -30rpx;
    padding: 20rpx 30rpx;
  }
}

.row-poster {
  width: 96rpx;
  height: 132rpx;
  border-radius: $radius-sm;
  background: $bg-secondary;
  flex-shrink: 0;
}

.row-info {
  flex: 1;
  min-width: 0;
}

.row-title {
  font-size: $font-md;
  font-weight: bold;
  display: block;
}

.row-date {
  font-size: $font-xs;
  color: $text-muted;
  margin-top: $spacing-xs;
}

.row-arrow {
  font-size: $font-xl;
  color: $text-muted;
}

/* 未登录 */
.login-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx $spacing-xl;
}

.login-icon {
  font-size: 100rpx;
  margin-bottom: $spacing-xl;
}

.login-title {
  font-size: $font-xl;
  font-weight: bold;
  margin-bottom: $spacing-sm;
}

.login-desc {
  font-size: $font-md;
  color: $text-secondary;
  margin-bottom: $spacing-xxl;
}

.login-btn {
  width: 80%;
  background-color: $btn-green;
  color: #fff;
  border-radius: 40rpx;
  padding: $spacing-md;
  font-size: $font-md;
  text-align: center;
  border: none;
}
</style>
