<template>
  <!-- Row variant: left-image-right-text layout -->
  <view v-if="variant === 'row'" class="movie-row" @click="goDetail">
    <view class="row-poster-wrap">
      <image
        class="row-poster"
        :src="posterUrl"
        mode="aspectFill"
        lazy-load
      />
      <view v-if="rank" class="row-rank">{{ rank }}</view>
    </view>

    <view class="row-info">
      <text class="row-title">{{ movie.title }}</text>
      <view class="row-meta">
        <text class="row-rating-label">评分</text>
        <text class="row-rating-score">{{ ratingText }}</text>
      </view>
      <text class="row-genre-year">{{ genresText }} | {{ year }}</text>
      <text v-if="movie.overview" class="row-overview text-ellipsis">{{ movie.overview }}</text>

      <view class="row-actions" @click.stop>
        <view class="action-btn wish-btn" @click="toggleWish">
          <text>{{ wished ? '❤ 已想看' : '♡ 想看' }}</text>
        </view>
        <view class="action-btn watched-btn" @click="toggleWatched">
          <text>{{ watched ? '✓ 已看过' : '看过' }}</text>
        </view>
      </view>
    </view>
  </view>

  <!-- Default: poster card (for horizontal scroll) -->
  <view v-else class="movie-card" @click="goDetail">
    <view class="card-poster-wrap">
      <image class="card-poster" :src="posterUrl" mode="aspectFill" lazy-load />
      <view class="card-shine" />
      <view class="card-badge">
        <text class="card-badge-star">★</text>
        <text class="card-badge-text">{{ ratingText }}</text>
      </view>
    </view>
    <view class="card-info">
      <text class="card-title text-ellipsis">{{ movie.title }}</text>
      <text class="card-year">{{ year }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Movie } from '@/types'
import { getPosterUrl, formatYear, formatRating } from '@/utils/helpers'
import { useUserStore } from '@/stores/user'

const props = withDefaults(defineProps<{
  movie: Movie
  variant?: 'row' | 'card'
  rank?: number
}>(), {
  variant: 'card',
  rank: 0,
})

const userStore = useUserStore()

const posterUrl = computed(() => getPosterUrl(props.movie.poster_path, 'w342'))
const ratingText = computed(() => formatRating(props.movie.vote_average))
const year = computed(() => formatYear(props.movie.release_date))

const genresText = computed(() => {
  if (props.movie.genres?.length) return props.movie.genres.map(g => g.name).join('/')
  return ''
})

const wished = ref(false)
const watched = ref(false)

function toggleWish() {
  wished.value = !wished.value
  userStore.toggleMovieStatus(props.movie, 'wish')
}

function toggleWatched() {
  watched.value = !watched.value
  userStore.toggleMovieStatus(props.movie, 'watched')
}

function goDetail() {
  uni.navigateTo({ url: `/pages/movie-detail/index?id=${props.movie.id}` })
}
</script>

<style lang="scss" scoped>
// ===== Row Variant =====
.movie-row {
  display: flex;
  padding: 20rpx 0;
  border-bottom: 1rpx solid $divider;
  gap: 20rpx;

  &:last-child { border-bottom: none; }
}

.row-poster-wrap {
  position: relative;
  width: $poster-width;
  height: $poster-height;
  border-radius: 12rpx;
  overflow: hidden;
  background: $bg-secondary;
  flex-shrink: 0;
}

.row-poster {
  width: 100%;
  height: 100%;
}

.row-rank {
  position: absolute;
  top: 0;
  left: 0;
  width: 40rpx;
  height: 40rpx;
  background: $color-primary-gradient;
  color: #fff;
  font-size: $font-xs;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0 0 12rpx 0;
}

.row-info {
  flex: 1;
  min-width: 0;
}

.row-title {
  font-size: $font-lg;
  font-weight: 700;
  color: $text-primary;
  display: block;
}

.row-meta {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 8rpx;
}

.row-rating-label {
  font-size: $font-xs;
  color: $text-muted;
}

.row-rating-score {
  font-size: 32rpx;
  font-weight: bold;
  color: $color-secondary;
}

.row-genre-year {
  font-size: $font-xs;
  color: $text-secondary;
  margin-top: 6rpx;
  display: block;
}

.row-overview {
  font-size: $font-xs;
  color: $text-muted;
  margin-top: 8rpx;
  display: block;
  line-height: 1.4;
}

.row-actions {
  display: flex;
  gap: 12rpx;
  margin-top: 16rpx;
}

.action-btn {
  padding: 10rpx 24rpx;
  border-radius: $radius-xl;
  font-size: $font-xs;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wish-btn {
  background: $color-primary-gradient;
  color: #fff;
}

.watched-btn {
  background: $btn-green;
  color: #fff;
}

// ===== Card Variant (horizontal scroll) =====
.movie-card {
  display: inline-block;
  width: 200rpx;
  margin-right: 20rpx;
  vertical-align: top;

  &:active { opacity: 0.9; }
}

.card-poster-wrap {
  position: relative;
  width: 200rpx;
  height: 280rpx;
  border-radius: $radius-md;
  overflow: hidden;
  background: $bg-secondary;
  box-shadow: $shadow-card;
}

.card-poster {
  width: 100%;
  height: 100%;
}

.card-shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%);
  pointer-events: none;
}

.card-badge {
  position: absolute;
  top: $spacing-sm;
  right: $spacing-sm;
  background: rgba(0,0,0,0.6);
  border-radius: $radius-sm;
  padding: 4rpx 12rpx;
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.card-badge-star {
  color: $color-secondary;
  font-size: 18rpx;
}

.card-badge-text {
  color: #fff;
  font-size: $font-xs;
  font-weight: 700;
}

.card-info {
  padding: $spacing-sm 4rpx;
}

.card-title {
  font-size: $font-sm;
  font-weight: 600;
  color: $text-primary;
  display: block;
  line-height: 1.4;
}

.card-year {
  font-size: $font-xs;
  color: $text-muted;
  margin-top: 4rpx;
  display: block;
}
</style>
