<template>
  <view class="page-search">
    <!-- 搜索框 -->
    <view class="search-header">
      <view class="search-input-wrap">
        <text class="search-icon">🔍</text>
        <input
          v-model="keyword"
          class="search-input"
          placeholder="搜索电影..."
          placeholder-style="color:#666"
          confirm-type="search"
          @confirm="doSearch"
          @input="onInput"
        />
        <text v-if="keyword" class="clear-btn" @click="clearInput">✕</text>
      </view>
      <text class="cancel-btn" @click="goBack">取消</text>
    </view>

    <!-- 搜索结果 -->
    <template v-if="hasSearched">
      <view v-if="store.searchLoading" class="loading-state">
        <text>搜索中...</text>
      </view>

      <view v-else-if="store.searchResults.length" class="result-list">
        <view
          v-for="movie in store.searchResults"
          :key="movie.id"
          class="search-item"
          @click="goDetail(movie.id)"
        >
          <image
            class="item-poster"
            :src="getPosterUrl(movie.poster_path, 'w342')"
            mode="aspectFill"
            lazy-load
          />
          <view class="item-info">
            <text class="item-title text-ellipsis">
              {{ movie.title }}
            </text>
            <text class="item-original text-ellipsis">
              {{ movie.original_title }}
            </text>
            <view class="item-meta">
              <StarRating :rating="movie.vote_average" size="sm" />
              <text class="item-score">{{ formatRating(movie.vote_average) }}</text>
              <text class="item-year">{{ formatYear(movie.release_date) }}</text>
            </view>
            <text v-if="movie.overview" class="item-overview text-ellipsis-2">
              {{ movie.overview }}
            </text>
          </view>
        </view>
      </view>

      <view v-else class="empty-state">
        <text class="empty-text">未找到相关电影</text>
      </view>
    </template>

    <!-- 搜索历史 & 热门搜索 -->
    <template v-else>
      <view v-if="searchHistory.length" class="section">
        <view class="section-header">
          <text class="section-title">搜索历史</text>
          <text class="clear-history" @click="clearHistory">清除</text>
        </view>
        <view class="tag-list">
          <text
            v-for="(word, index) in searchHistory"
            :key="index"
            class="tag"
            @click="quickSearch(word)"
          >
            {{ word }}
          </text>
        </view>
      </view>

      <view class="section">
        <text class="section-title">热门搜索</text>
        <view class="tag-list">
          <text
            v-for="word in hotKeywords"
            :key="word"
            class="tag tag-hot"
            @click="quickSearch(word)"
          >
            {{ word }}
          </text>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useMovieStore } from '@/stores/movie'
import { getPosterUrl, formatRating, formatYear } from '@/utils/helpers'
import { getSearchHistory, addSearchHistory, clearSearchHistory } from '@/utils/cache'
import StarRating from '@/components/StarRating.vue'

const store = useMovieStore()
const keyword = ref('')
const hasSearched = ref(false)
const searchHistory = ref<string[]>(getSearchHistory())

const hotKeywords = ['流浪地球', '哪吒', '星际穿越', '封神', '奥本海默', '三体', '流浪地球3', '疯狂的麦克斯']

function onInput() {
  if (!keyword.value.trim()) {
    hasSearched.value = false
  }
}

function doSearch() {
  const kw = keyword.value.trim()
  if (!kw) return
  addSearchHistory(kw)
  searchHistory.value = getSearchHistory()
  hasSearched.value = true
  store.searchMovies(kw)
}

function quickSearch(word: string) {
  keyword.value = word
  doSearch()
}

function clearInput() {
  keyword.value = ''
  hasSearched.value = false
}

function clearHistory() {
  clearSearchHistory()
  searchHistory.value = []
}

function goDetail(id: number) {
  uni.navigateTo({ url: `/pages/movie-detail/index?id=${id}` })
}

function goBack() {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.page-search {
  min-height: 100vh;
  background: $bg-deep;
  padding-top: 20rpx;
}

.search-header {
  display: flex;
  align-items: center;
  padding: $spacing-sm $spacing-xl $spacing-lg;
  gap: $spacing-md;
}

.search-input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  background: $bg-glass;
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  border-radius: $radius-full;
  padding: $spacing-md $spacing-xl;
  gap: $spacing-sm;
  transition: border-color $transition-smooth;

  &:focus-within {
    border-color: rgba($accent, 0.5);
  }
}

.search-icon {
  font-size: $font-md;
}

.search-input {
  flex: 1;
  font-size: $font-md;
  color: $text-primary;
}

.clear-btn {
  font-size: $font-md;
  color: $text-muted;
  padding: 4rpx $spacing-sm;
}

.cancel-btn {
  font-size: $font-md;
  color: $accent-light;
  flex-shrink: 0;
  font-weight: 500;
}

.loading-state {
  text-align: center;
  padding: 160rpx;
  color: $text-secondary;
  font-size: $font-md;
}

.result-list {
  padding: 0 $spacing-xl;
}

.search-item {
  display: flex;
  padding: $spacing-lg 0;
  border-bottom: 1rpx solid $divider;
  gap: $spacing-lg;
  transition: background $transition-fast;

  &:active {
    background: rgba(255, 255, 255, 0.015);
    margin: 0 -$spacing-xl;
    padding: $spacing-lg $spacing-xl;
  }
}

.item-poster {
  width: 120rpx;
  height: 170rpx;
  border-radius: $radius-sm;
  background: $bg-card;
  flex-shrink: 0;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.3);
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: $font-lg;
  font-weight: 700;
  display: block;
  color: $text-primary;
}

.item-original {
  font-size: $font-xs;
  color: $text-muted;
  margin-top: 2rpx;
  display: block;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin-top: $spacing-sm;
}

.item-score {
  color: $accent;
  font-size: $font-sm;
  font-weight: 700;
  font-family: $font-display;
}

.item-year {
  color: $text-muted;
  font-size: $font-xs;
}

.item-overview {
  font-size: $font-xs;
  color: $text-secondary;
  margin-top: $spacing-sm;
  line-height: 1.6;
}

.section {
  padding: $spacing-xl;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-lg;
}

.section-title {
  font-size: $font-lg;
  font-weight: 700;
  letter-spacing: 0.5rpx;
}

.clear-history {
  font-size: $font-sm;
  color: $text-muted;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-md;
}

.tag {
  background: $bg-glass;
  border: 1rpx solid rgba(255, 255, 255, 0.06);
  color: $text-secondary;
  font-size: $font-sm;
  padding: $spacing-sm $spacing-xl;
  border-radius: $radius-full;
  transition: all $transition-smooth;

  &.tag-hot {
    border-color: rgba($accent, 0.3);
    color: $accent-light;
  }

  &:active {
    border-color: $accent;
    color: $accent-light;
    background: $accent-glow;
  }
}
</style>
