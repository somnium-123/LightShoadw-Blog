<template>
  <view class="page-detail">
    <!-- Loading -->
    <template v-if="store.currentMovieLoading && !store.currentMovie">
      <Skeleton type="detail" />
    </template>

    <!-- Error -->
    <view v-else-if="store.currentMovieError" class="error-state">
      <text class="error-icon">!</text>
      <text class="error-text">{{ store.currentMovieError }}</text>
      <view class="retry-btn" @click="loadMovie"><text>Retry</text></view>
    </view>

    <!-- Content -->
    <template v-else-if="store.currentMovie">
      <!-- Hero Backdrop -->
      <view class="hero-backdrop">
        <image
          class="backdrop-img"
          :src="getBackdropUrl(store.currentMovie.backdrop_path, 'original')"
          mode="aspectFill"
        />
        <view class="backdrop-gradient" />
      </view>

      <!-- Poster + Info -->
      <view class="info-card">
        <view class="poster-wrap">
          <image
            class="poster"
            :src="getPosterUrl(store.currentMovie.poster_path, 'w500')"
            mode="aspectFill"
          />
          <view class="poster-shine" />
        </view>
        <view class="info-text">
          <text class="title">{{ store.currentMovie.title }}</text>
          <text v-if="store.currentMovie.original_title !== store.currentMovie.title" class="original-title">
            {{ store.currentMovie.original_title }}
          </text>
          <view class="meta">
            <text>{{ formatYear(store.currentMovie.release_date) }}</text>
            <text class="meta-sep">·</text>
            <text>{{ formatRuntime(store.currentMovie.runtime) }}</text>
          </view>
          <view class="genres">
            <text v-for="genre in store.currentMovie.genres" :key="genre.id" class="genre-tag">
              {{ genre.name }}
            </text>
          </view>
        </view>
      </view>

      <!-- Score Display -->
      <view class="score-block">
        <view class="score-main">
          <text class="score-number">{{ formatRating(store.currentMovie.vote_average) }}</text>
          <text class="score-max">/ 10</text>
        </view>
        <StarRating :rating="store.currentMovie.vote_average" size="lg" />
        <text class="score-votes">{{ formatCount(store.currentMovie.vote_count) }} 人评价</text>
      </view>

      <!-- Action Buttons -->
      <view class="action-bar">
        <view
          class="action-btn wish-btn"
          :class="{ active: movieStatus === 'wish' }"
          @click="toggleStatus('wish')"
        >
          <text class="action-icon">{{ movieStatus === 'wish' ? '★' : '☆' }}</text>
          <text>{{ movieStatus === 'wish' ? '已想' : '想看' }}</text>
        </view>
        <view
          class="action-btn watched-btn"
          :class="{ active: movieStatus === 'watched' }"
          @click="toggleStatus('watched')"
        >
          <text class="action-icon">{{ movieStatus === 'watched' ? '✓' : '○' }}</text>
          <text>{{ movieStatus === 'watched' ? '已看' : '看过' }}</text>
        </view>
      </view>

      <!-- Overview -->
      <view class="section">
        <text class="section-title">剧情简介</text>
        <text class="overview-label">SYNOPSIS</text>
        <view class="overview" :class="{ expanded: showFullOverview }">
          <text>{{ store.currentMovie.overview || '暂无简介' }}</text>
        </view>
        <text
          v-if="store.currentMovie.overview && store.currentMovie.overview.length > 120"
          class="expand-btn"
          @click="showFullOverview = !showFullOverview"
        >
          {{ showFullOverview ? '收起 ↑' : '展开全文 ↓' }}
        </text>
      </view>

      <!-- Images -->
      <view v-if="store.movieImages.length" class="section">
        <view class="section-header-row">
          <text class="section-title">剧照</text>
          <text class="section-count">{{ store.movieImages.length }}</text>
        </view>
        <SwiperImages :images="store.movieImages" />
      </view>

      <!-- Cast -->
      <view v-if="store.castList.length" class="section">
        <view class="section-header-row">
          <text class="section-title">演职员</text>
          <text class="section-count">{{ store.castList.length }}</text>
        </view>
        <scroll-view class="cast-scroll" scroll-x enable-flex :show-scrollbar="false">
          <view v-for="cast in store.castList" :key="cast.id" class="cast-item">
            <view class="cast-avatar-wrap">
              <image
                class="cast-avatar"
                :src="getProfileUrl(cast.profile_path, 'w185')"
                mode="aspectFill"
                lazy-load
              />
            </view>
            <text class="cast-name text-ellipsis">{{ cast.name }}</text>
            <text class="cast-role text-ellipsis">{{ cast.character || '-' }}</text>
          </view>
        </scroll-view>
      </view>

      <!-- Watch Channels -->
      <view class="section">
        <text class="section-title">观看渠道</text>
        <view class="channels">
          <view
            v-for="channel in watchChannels"
            :key="channel.name"
            class="channel-item"
            @click="openChannel(channel.url)"
          >
            <text class="channel-name">{{ channel.name }}</text>
            <text class="channel-arrow">→</text>
          </view>
        </view>
      </view>

      <!-- Similar -->
      <view v-if="store.similarMovies.length" class="section">
        <text class="section-title">相似推荐</text>
        <scroll-view scroll-x class="similar-scroll">
          <view class="similar-inner">
            <MovieCard v-for="(movie, idx) in store.similarMovies" :key="movie.id" :movie="movie" :index="idx" />
          </view>
        </scroll-view>
      </view>

      <view class="safe-area-bottom" style="height: 80rpx;" />
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useMovieStore } from '@/stores/movie'
import { useUserStore } from '@/stores/user'
import {
  getPosterUrl, getBackdropUrl, getProfileUrl,
  formatRating, formatYear, formatRuntime, formatCount,
} from '@/utils/helpers'
import StarRating from '@/components/StarRating.vue'
import SwiperImages from '@/components/SwiperImages.vue'
import MovieCard from '@/components/MovieCard.vue'
import Skeleton from '@/components/Skeleton.vue'

const store = useMovieStore()
const userStore = useUserStore()

const showFullOverview = ref(false)

const movieStatus = computed(() => {
  if (!store.currentMovie) return null
  return userStore.getStatus(store.currentMovie.id)
})

async function toggleStatus(status: 'wish' | 'watched') {
  if (!store.currentMovie) return
  await userStore.toggleMovieStatus(store.currentMovie, status)
}

const watchChannels = [
  { name: '爱奇艺', url: 'https://www.iqiyi.com' },
  { name: '腾讯视频', url: 'https://v.qq.com' },
  { name: '优酷视频', url: 'https://www.youku.com' },
]

function openChannel(url: string) {
  // #ifdef H5
  window.open(url)
  // #endif
  // #ifdef MP-WEIXIN
  uni.showToast({ title: '请前往对应平台观看', icon: 'none' })
  // #endif
}

async function loadMovie() {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const id = Number(currentPage.options?.id)
  if (!id) {
    uni.showToast({ title: '参数错误', icon: 'none' })
    return
  }
  await store.fetchMovieDetail(id)
}

onLoad(() => {
  loadMovie()
})
</script>

<style lang="scss" scoped>
.page-detail {
  min-height: 100vh;
  background: $bg-secondary;
  padding-bottom: 80rpx;
}

// ===== Hero Backdrop =====
.hero-backdrop {
  position: relative;
  height: 460rpx;
}

.backdrop-img {
  width: 100%;
  height: 100%;
  background: $bg-card;
}

.backdrop-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    transparent 40%,
    rgba(255, 255, 255, 0.3) 70%,
    $bg-secondary 100%
  );
}

// ===== Info Card =====
.info-card {
  display: flex;
  padding: 0 $spacing-xl;
  margin-top: -140rpx;
  gap: $spacing-xl;
  position: relative;
  z-index: 2;
}

.poster-wrap {
  width: 220rpx;
  height: 310rpx;
  border-radius: $radius-lg;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: $shadow-elevated;
  position: relative;
}

.poster {
  width: 100%;
  height: 100%;
}

.poster-shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    transparent 0%,
    rgba(255, 255, 255, 0.04) 50%,
    transparent 100%
  );
  pointer-events: none;
}

.info-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding-bottom: $spacing-sm;
}

.title {
  font-size: $font-xxl;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
  letter-spacing: 0.5rpx;
}

.original-title {
  font-size: $font-sm;
  color: $text-secondary;
  margin-top: 6rpx;
}

.meta {
  font-size: $font-sm;
  color: $text-secondary;
  margin-top: $spacing-sm;
  display: flex;
  align-items: center;
}

.meta-sep {
  margin: 0 $spacing-sm;
  opacity: 0.5;
}

.genres {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
  margin-top: $spacing-md;
}

.genre-tag {
  background: $bg-glass;
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  color: $accent-light;
  font-size: $font-xs;
  padding: 4rpx 16rpx;
  border-radius: $radius-full;
  letter-spacing: 1rpx;
}

// ===== Score Block =====
.score-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-xxl $spacing-xl $spacing-xl;
  gap: $spacing-sm;
}

.score-main {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
}

.score-number {
  font-size: 72rpx;
  font-weight: 700;
  color: $accent;
  font-family: $font-display;
  line-height: 1;
}

.score-max {
  font-size: $font-lg;
  color: $text-secondary;
  font-family: $font-display;
}

.score-votes {
  font-size: $font-xs;
  color: $text-muted;
  letter-spacing: 1rpx;
}

// ===== Action Bar =====
.action-bar {
  display: flex;
  gap: $spacing-md;
  padding: 0 $spacing-xl;
  margin-bottom: $spacing-xl;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  padding: $spacing-md;
  border-radius: $radius-full;
  font-size: $font-md;
  font-weight: 600;
  letter-spacing: 1rpx;
  transition: all $transition-smooth;
  border: 1rpx solid transparent;

  &.wish-btn {
    background: $btn-green;
    color: #fff;

    &.active {
      background: transparent;
      border-color: rgba(255, 255, 255, 0.12);
      color: $text-secondary;
    }
  }

  &.watched-btn {
    background: $accent;
    color: $text-inverse;

    &.active {
      background: transparent;
      border-color: rgba(255, 255, 255, 0.12);
      color: $text-secondary;
    }
  }

  &:active {
    transform: scale(0.96);
  }
}

.action-icon {
  font-size: $font-lg;
}

// ===== Section =====
.section {
  padding: $spacing-xl $spacing-xl;
}

.section-header-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: $spacing-lg;
}

.section-title {
  font-size: $font-xl;
  font-weight: 700;
  color: $text-primary;
  letter-spacing: 0.5rpx;
  position: relative;

  &::after {
    content: '';
    display: block;
    width: 40rpx;
    height: 4rpx;
    background: $accent;
    margin-top: 8rpx;
    border-radius: 2rpx;
  }
}

.overview-label {
  font-size: $font-xs;
  color: $text-muted;
  letter-spacing: 4rpx;
  display: block;
  margin-bottom: $spacing-md;
}

.section-count {
  font-size: $font-sm;
  color: $text-muted;
  font-family: $font-display;
}

// ===== Overview =====
.overview {
  font-size: $font-md;
  color: $text-secondary;
  line-height: 1.9;

  &:not(.expanded) {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 4;
    overflow: hidden;
  }
}

.expand-btn {
  color: $accent-light;
  font-size: $font-sm;
  display: block;
  margin-top: $spacing-md;
  letter-spacing: 1rpx;
}

// ===== Cast =====
.cast-scroll {
  display: flex;
  white-space: nowrap;

  &::-webkit-scrollbar { display: none; }
}

.cast-item {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  width: 120rpx;
  margin-right: $spacing-lg;
  flex-shrink: 0;
}

.cast-avatar-wrap {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  overflow: hidden;
  background: $bg-card;
  margin-bottom: $spacing-sm;
  border: 2rpx solid rgba(255, 255, 255, 0.06);
}

.cast-avatar {
  width: 100%;
  height: 100%;
}

.cast-name {
  font-size: $font-sm;
  max-width: 120rpx;
  font-weight: 500;
}

.cast-role {
  font-size: $font-xs;
  color: $text-muted;
  max-width: 120rpx;
  margin-top: 2rpx;
}

// ===== Channels =====
.channels {
  background: $bg-card;
  border-radius: $radius-lg;
  overflow: hidden;
}

.channel-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-lg $spacing-xl;
  border-bottom: 1rpx solid $divider;
  transition: background $transition-fast;

  &:last-child { border-bottom: none; }

  &:active {
    background: $bg-card-hover;
  }
}

.channel-name {
  font-size: $font-md;
  font-weight: 500;
}

.channel-arrow {
  color: $text-muted;
  font-size: $font-lg;
}

// ===== Similar =====
.similar-scroll {
  white-space: nowrap;

  &::-webkit-scrollbar { display: none; }
}

.similar-inner {
  display: inline-flex;
  gap: $spacing-md;
}

// ===== Error =====
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 300rpx $spacing-xl;
}

.error-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: rgba(255, 100, 100, 0.15);
  color: #ff6b6b;
  font-size: $font-xxl;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: $spacing-lg;
}

.error-text {
  color: $text-secondary;
  font-size: $font-md;
  margin-bottom: $spacing-xl;
  text-align: center;
}

.retry-btn {
  padding: $spacing-sm $spacing-xxl;
  border: 1rpx solid rgba(255, 255, 255, 0.15);
  border-radius: $radius-full;
  color: $text-secondary;
  font-size: $font-sm;
  letter-spacing: 2rpx;
  transition: all $transition-smooth;

  &:active {
    border-color: $accent;
    color: $accent-light;
    background: $accent-glow;
  }
}
</style>
