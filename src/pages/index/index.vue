<template>
  <view class="page-index">
    <!-- ===== 1. Top Nav Bar ===== -->
    <view class="nav-bar">
      <text class="nav-title">光影博客</text>
    </view>

    <!-- ===== 2. Banner Swiper ===== -->
    <view class="banner-wrap" v-if="banners.length">
      <swiper
        class="banner-swiper"
        :indicator-dots="true"
        :autoplay="true"
        :interval="4000"
        :duration="600"
        :circular="true"
        indicator-color="rgba(255,255,255,0.4)"
        indicator-active-color="#FF6B6B"
      >
        <swiper-item v-for="banner in banners" :key="banner.id" @click="goDetail(banner.id)">
          <image
            class="banner-img"
            :src="getBackdropUrl(banner.backdrop_path, 'w780')"
            mode="aspectFill"
          />
          <view class="banner-caption">
            <text class="banner-title">{{ banner.title }}</text>
            <text class="banner-rating">★ {{ formatRating(banner.vote_average) }}</text>
          </view>
        </swiper-item>
      </swiper>
    </view>

    <!-- ===== 3. Service Entry Grid ===== -->
    <view class="service-grid">
      <view
        v-for="svc in services"
        :key="svc.name"
        class="service-item"
        @click="navigateTo(svc.path)"
      >
        <view class="service-icon" :style="{ background: svc.gradient }">
          <text class="service-icon-text">{{ svc.icon }}</text>
        </view>
        <text class="service-name">{{ svc.name }}</text>
        <text class="service-desc">{{ svc.desc }}</text>
      </view>
    </view>

    <!-- ===== 4. Filter Bar ===== -->
    <view class="filter-bar">
      <view class="filter-tabs">
        <text
          v-for="tab in mainTabs"
          :key="tab.key"
          :class="['filter-tab', { active: activeTab === tab.key }]"
          @click="switchTab(tab.key)"
        >{{ tab.label }}</text>
      </view>
      <view class="search-entry" @click="goSearch">
        <text class="search-icon">🔍</text>
        <text class="search-text">搜片名</text>
      </view>
    </view>

    <!-- ===== 5. Movie List (left-image-right-text) ===== -->
    <view class="movie-list">
      <!-- Now Playing -->
      <template v-if="activeTab === 'now_playing'">
        <Skeleton v-if="store.nowPlayingLoading && !store.nowPlaying.length" type="card" />
        <template v-else-if="store.nowPlaying.length">
          <MovieCard
            v-for="movie in store.nowPlaying"
            :key="movie.id"
            :movie="movie"
            variant="row"
          />
        </template>
        <view v-else class="empty-state"><text class="empty-text">暂无热映电影</text></view>
      </template>

      <!-- Upcoming -->
      <template v-if="activeTab === 'upcoming'">
        <Skeleton v-if="store.upcomingLoading && !store.upcoming.length" type="card" />
        <template v-else-if="store.upcoming.length">
          <MovieCard
            v-for="movie in store.upcoming"
            :key="movie.id"
            :movie="movie"
            variant="row"
          />
        </template>
        <view v-else class="empty-state"><text class="empty-text">暂无待映电影</text></view>
      </template>

      <!-- Top 250 -->
      <template v-if="activeTab === 'top_rated'">
        <Skeleton v-if="store.topRatedLoading && !store.topRated.length" type="card" />
        <template v-else-if="store.topRated.length">
          <MovieCard
            v-for="(movie, idx) in store.topRated"
            :key="movie.id"
            :movie="movie"
            variant="row"
            :rank="idx + 1"
          />
        </template>
        <view v-else class="empty-state"><text class="empty-text">暂无排行数据</text></view>
      </template>

      <!-- Genres -->
      <template v-if="activeTab === 'genres'">
        <scroll-view scroll-x class="genre-pills-row" :show-scrollbar="false">
          <view
            v-for="g in store.genres"
            :key="g.id"
            :class="['genre-chip', { active: activeGenre === g.id }]"
            @click="selectGenre(g.id)"
          >
            <text>{{ g.name }}</text>
          </view>
        </scroll-view>
        <Skeleton v-if="activeGenre && !store.genreRankings[activeGenre]?.length" type="card" />
        <template v-else-if="activeGenre && store.genreRankings[activeGenre]?.length">
          <MovieCard
            v-for="(movie, idx) in store.genreRankings[activeGenre]"
            :key="movie.id"
            :movie="movie"
            variant="row"
            :rank="idx + 1"
          />
        </template>
        <view v-else-if="!activeGenre" class="empty-state"><text class="empty-text">选择一个分类查看排行榜</text></view>
      </template>
    </view>

    <view class="safe-area-bottom" style="height: 120rpx;" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useMovieStore } from '@/stores/movie'
import { getPosterUrl, getBackdropUrl, formatRating, formatYear } from '@/utils/helpers'
import MovieCard from '@/components/MovieCard.vue'
import Skeleton from '@/components/Skeleton.vue'
import type { Movie } from '@/types'

const store = useMovieStore()

const mainTabs = [
  { key: 'now_playing', label: '正在热映' },
  { key: 'upcoming', label: '即将上映' },
  { key: 'top_rated', label: 'Top250' },
  { key: 'genres', label: '分类' },
]
const activeTab = ref('now_playing')
const activeGenre = ref<number | null>(null)

const banners = computed<Movie[]>(() => store.popular.slice(0, 5))

const services = [
  { name: '我的想看', desc: '想看的电影片单', icon: '♡', gradient: 'linear-gradient(135deg, #6C5CE7, #A29BFE)', path: '/pages/profile/index' },
  { name: '我的看过', desc: '已看电影记录', icon: '✓', gradient: 'linear-gradient(135deg, #FFA500, #FFD700)', path: '/pages/profile/index' },
  { name: '观影报告', desc: '年度观影统计', icon: '📊', gradient: 'linear-gradient(135deg, #FF6B6B, #FF8E53)', path: '/pages/report/index' },
  { name: '影评专区', desc: '用户影评推荐', icon: '✎', gradient: 'linear-gradient(135deg, #00B4D8, #90E0EF)', path: '/pages/search/index' },
]

function switchTab(key: string) {
  activeTab.value = key
  if (key === 'now_playing' && !store.nowPlaying.length) store.fetchNowPlaying()
  else if (key === 'upcoming' && !store.upcoming.length) store.fetchUpcoming()
  else if (key === 'top_rated' && !store.topRated.length) store.fetchTopRated()
  else if (key === 'genres' && !store.genres.length) store.fetchGenres()
}

function selectGenre(genreId: number) {
  activeGenre.value = genreId
  if (!store.genreRankings[genreId]?.length) store.fetchGenreRanking(genreId)
}

function goDetail(id: number) {
  uni.navigateTo({ url: `/pages/movie-detail/index?id=${id}` })
}

function goSearch() {
  uni.navigateTo({ url: '/pages/search/index' })
}

function navigateTo(path: string) {
  if (path.includes('/pages/report/') || path.includes('/pages/search/')) {
    uni.navigateTo({ url: path })
  } else {
    uni.switchTab({ url: path })
  }
}

onLoad(async () => {
  await Promise.all([store.fetchPopular(), store.fetchNowPlaying(), store.fetchGenres()])
})
</script>

<style lang="scss" scoped>
.page-index {
  min-height: 100vh;
  background: $bg-secondary;
  padding-bottom: 120rpx;
}

// ===== 1. Nav Bar =====
.nav-bar {
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #2a2a2a, #1a1a1a);
}

.nav-title {
  color: #FFFFFF;
  font-size: 34rpx;
  font-weight: bold;
}

// ===== 2. Banner =====
.banner-wrap {
  padding: 20rpx 30rpx;
  background: $bg-primary;
}

.banner-swiper {
  height: 320rpx;
  border-radius: $radius-lg;
  overflow: hidden;
}

.banner-img {
  width: 100%;
  height: 100%;
}

.banner-caption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 40rpx 24rpx 20rpx;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  display: flex;
  align-items: flex-end;
  gap: 16rpx;
}

.banner-title {
  color: #fff;
  font-size: $font-lg;
  font-weight: 700;
  flex: 1;
}

.banner-rating {
  color: $color-secondary;
  font-size: $font-md;
  font-weight: 700;
}

// ===== 3. Service Grid =====
.service-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
  margin: 20rpx 30rpx;
  padding: 30rpx;
  background: $bg-primary;
  border-radius: $radius-lg;
  box-shadow: $shadow-card;
}

.service-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 16rpx 0;
}

.service-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12rpx;
}

.service-icon-text {
  font-size: 36rpx;
  color: #fff;
}

.service-name {
  font-size: $font-sm;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: 4rpx;
}

.service-desc {
  font-size: $font-xs;
  color: $text-muted;
}

// ===== 4. Filter Bar =====
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  background: $bg-primary;
  margin-top: 4rpx;
}

.filter-tabs {
  display: flex;
  gap: 24rpx;
}

.filter-tab {
  font-size: $font-md;
  color: $text-secondary;
  padding-bottom: 8rpx;
  transition: color $transition-fast;

  &.active {
    color: $color-primary;
    font-weight: bold;
    border-bottom: 4rpx solid $color-primary;
  }
}

.search-entry {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 10rpx 20rpx;
  background: $bg-secondary;
  border-radius: $radius-xl;
}

.search-icon {
  font-size: $font-sm;
}

.search-text {
  font-size: $font-sm;
  color: $text-muted;
}

// ===== 5. Movie List =====
.movie-list {
  background: $bg-primary;
  padding: 0 30rpx;
}

.genre-pills-row {
  display: flex;
  white-space: nowrap;
  padding: 16rpx 0;

  &::-webkit-scrollbar { display: none; }
}

.genre-chip {
  display: inline-flex;
  padding: 8rpx 24rpx;
  margin-right: 12rpx;
  border-radius: $radius-xl;
  font-size: $font-sm;
  color: $text-secondary;
  background: $bg-secondary;
  flex-shrink: 0;

  &.active {
    background: $color-primary-gradient;
    color: #fff;
  }
}
</style>
