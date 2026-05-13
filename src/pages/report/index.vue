<template>
  <view class="page-report">
    <!-- ===== Summary Stats ===== -->
    <view class="report-hero">
      <text class="report-title">观影报告</text>
      <text class="report-subtitle">{{ currentYear }} 年度</text>
      <view class="stats-row">
        <view class="stat-item">
          <text class="stat-num">{{ stats.watched }}</text>
          <text class="stat-unit">部</text>
          <text class="stat-label">已看</text>
        </view>
        <view class="stat-divider" />
        <view class="stat-item">
          <text class="stat-num">{{ stats.avgRating }}</text>
          <text class="stat-unit">分</text>
          <text class="stat-label">均分</text>
        </view>
        <view class="stat-divider" />
        <view class="stat-item">
          <text class="stat-num">{{ stats.totalHours }}</text>
          <text class="stat-unit">h</text>
          <text class="stat-label">时长</text>
        </view>
      </view>
    </view>

    <!-- ===== Runtime Distribution ===== -->
    <view class="chart-card">
      <text class="chart-title">片长分布</text>
      <view class="chart-wrap">
        <canvas
          v-if="runtimeData.length"
          type="2d"
          id="genreCanvas"
          class="chart-canvas"
          :style="{ width: canvasWidth + 'px', height: genreChartHeight + 'px' }"
        />
        <view v-else class="chart-empty">
          <text class="empty-text">暂无片长数据</text>
        </view>
      </view>
    </view>

    <!-- ===== Rating Distribution ===== -->
    <view class="chart-card">
      <text class="chart-title">评分分布</text>
      <view class="chart-wrap">
        <canvas
          v-if="ratingData.length"
          type="2d"
          id="ratingCanvas"
          class="chart-canvas"
          :style="{ width: canvasWidth + 'px', height: barChartHeight + 'px' }"
        />
        <view v-else class="chart-empty">
          <text class="empty-text">暂无评分数据</text>
        </view>
      </view>
    </view>

    <!-- ===== Monthly Timeline ===== -->
    <view class="chart-card">
      <text class="chart-title">月度观影</text>
      <view class="chart-wrap">
        <canvas
          v-if="monthlyData.length"
          type="2d"
          id="monthlyCanvas"
          class="chart-canvas"
          :style="{ width: canvasWidth + 'px', height: barChartHeight + 'px' }"
        />
        <view v-else class="chart-empty">
          <text class="empty-text">暂无月度数据</text>
        </view>
      </view>
    </view>

    <!-- ===== Top Rated ===== -->
    <view v-if="topMovies.length" class="chart-card">
      <text class="chart-title">高分作品</text>
      <view class="top-list">
        <view v-for="(m, i) in topMovies" :key="m.movie_id" class="top-item">
          <view class="top-rank" :class="{ gold: i < 3 }">{{ i + 1 }}</view>
          <text class="top-name text-ellipsis">{{ m.movie_title }}</text>
          <text class="top-score">★ {{ m.movie_rating || '-' }}</text>
        </view>
      </view>
    </view>

    <view class="safe-area-bottom" style="height: 60rpx;" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { onReady } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { useMovieStore } from '@/stores/movie'

const userStore = useUserStore()
const movieStore = useMovieStore()

const currentYear = new Date().getFullYear()
const canvasWidth = ref(335)
const genreChartHeight = ref(240)
const barChartHeight = ref(280)

// ===== Stats =====
const stats = computed(() => {
  const list = userStore.watchedList
  const rated = list.filter(m => m.movie_rating)
  const totalMin = list.reduce((s, m) => s + (m.movie_runtime || 0), 0)
  return {
    watched: list.length,
    avgRating: rated.length ? (rated.reduce((s, m) => s + (m.movie_rating || 0), 0) / rated.length).toFixed(1) : '0',
    totalHours: Math.round(totalMin / 60 * 10) / 10,
  }
})

// ===== Runtime Distribution =====
const runtimeData = computed(() => {
  const buckets = { '短篇\n<100min': 0, '中篇\n100-150min': 0, '长篇\n>150min': 0 }
  userStore.watchedList.forEach(m => {
    const rt = m.movie_runtime || 0
    if (rt <= 0) return
    if (rt < 100) buckets['短篇\n<100min']++
    else if (rt <= 150) buckets['中篇\n100-150min']++
    else buckets['长篇\n>150min']++
  })
  return Object.entries(buckets).map(([name, count]) => ({ name, count }))
})

// ===== Rating Distribution =====
const ratingData = computed(() => {
  const buckets = Array(10).fill(0)
  userStore.watchedList.forEach(m => {
    if (m.movie_rating) {
      const idx = Math.min(9, Math.floor(m.movie_rating))
      buckets[idx]++
    }
  })
  return buckets.map((count, i) => ({ label: String(i + 1), count }))
})

// ===== Monthly Data =====
const monthlyData = computed(() => {
  const months = Array(12).fill(0)
  userStore.watchedList.forEach(m => {
    if (m.watched_at) {
      const d = new Date(m.watched_at)
      if (d.getFullYear() === currentYear) {
        months[d.getMonth()]++
      }
    } else if (m.created_at) {
      const d = new Date(m.created_at)
      if (d.getFullYear() === currentYear) {
        months[d.getMonth()]++
      }
    }
  })
  return months.map((count, i) => ({ label: `${i + 1}月`, count }))
})

// ===== Top Rated Movies =====
const topMovies = computed(() => {
  return [...userStore.watchedList]
    .filter(m => m.movie_rating)
    .sort((a, b) => (b.movie_rating || 0) - (a.movie_rating || 0))
    .slice(0, 10)
})

// ===== Canvas Drawing =====
function getCanvasCtx(id: string): Promise<any> {
  return new Promise((resolve) => {
    const query = uni.createSelectorQuery()
    query.select('#' + id)
      .fields({ node: true, size: true })
      .exec((res) => {
        if (res[0]) {
          const canvas = res[0].node
          const ctx = canvas.getContext('2d')
          const dpr = uni.getSystemInfoSync().pixelRatio
          canvas.width = res[0].width * dpr
          canvas.height = res[0].height * dpr
          ctx.scale(dpr, dpr)
          resolve({ ctx, width: res[0].width, height: res[0].height })
        } else {
          resolve(null)
        }
      })
  })
}

const COLORS = [
  '#FF6B6B', '#FFA500', '#6C5CE7', '#00B4D8', '#00B600',
  '#FF8E53', '#A29BFE', '#FFD700', '#FF4081', '#00E676',
]

async function drawRuntimeChart() {
  const r = await getCanvasCtx('genreCanvas')
  if (!r || !runtimeData.value.length) return
  const { ctx, width: w, height: h } = r
  const total = runtimeData.value.reduce((s, d) => s + d.count, 0)

  ctx.clearRect(0, 0, w, h)
  const barHeight = 28
  const gap = 12
  const maxBarW = w - 100

  runtimeData.value.forEach((d, i) => {
    const y = 30 + i * (barHeight + gap)
    const barW = total ? (d.count / total) * maxBarW : 0

    // Label
    ctx.fillStyle = '#333'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(d.name, 56, y + barHeight / 2 + 4)

    // Bar
    ctx.fillStyle = COLORS[i % COLORS.length]
    ctx.beginPath()
    const r2 = barHeight / 2
    ctx.moveTo(64 + r2, y)
    ctx.lineTo(64 + barW - r2, y)
    ctx.arc(64 + barW - r2, y + r2, r2, -Math.PI / 2, Math.PI / 2)
    ctx.lineTo(64 + r2, y + barHeight)
    ctx.arc(64 + r2, y + r2, r2, Math.PI / 2, -Math.PI / 2)
    ctx.fill()

    // Count
    ctx.fillStyle = '#666'
    ctx.textAlign = 'left'
    ctx.fillText(String(d.count), 64 + barW + 8, y + barHeight / 2 + 4)
  })
}

async function drawRatingChart() {
  const r = await getCanvasCtx('ratingCanvas')
  if (!r) return
  const { ctx, width: w, height: h } = r
  const maxCount = Math.max(1, ...ratingData.value.map(d => d.count))

  ctx.clearRect(0, 0, w, h)
  const barW = 22
  const gap = (w - 60) / 10
  const bottom = h - 40

  // Grid lines
  ctx.strokeStyle = '#EEEEEE'
  ctx.lineWidth = 1
  for (let yi = 0; yi <= 4; yi++) {
    const y = bottom - (yi / 4) * (bottom - 40)
    ctx.beginPath()
    ctx.moveTo(40, y)
    ctx.lineTo(w - 16, y)
    ctx.stroke()
    ctx.fillStyle = '#999'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(String(Math.round(maxCount * yi / 4)), 36, y + 4)
  }

  // Bars
  ratingData.value.forEach((d, i) => {
    const x = 44 + i * gap
    const barH = bottom - ((d.count / maxCount) * (bottom - 40))
    const actualH = bottom - barH

    ctx.fillStyle = d.count > 0 ? COLORS[i % COLORS.length] : '#E0E0E0'
    const r2 = 4
    ctx.beginPath()
    ctx.moveTo(x + r2, bottom)
    ctx.lineTo(x + r2, bottom - actualH + r2)
    ctx.arc(x + r2, bottom - actualH + r2, r2, Math.PI, Math.PI * 1.5)
    ctx.lineTo(x + barW - r2, bottom - actualH)
    ctx.arc(x + barW - r2, bottom - actualH + r2, r2, -Math.PI / 2, 0)
    ctx.lineTo(x + barW - r2, bottom)
    ctx.closePath()
    ctx.fill()

    // Label
    ctx.fillStyle = '#999'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(d.label + '分', x + barW / 2, bottom + 18)
  })
}

async function drawMonthlyChart() {
  const r = await getCanvasCtx('monthlyCanvas')
  if (!r) return
  const { ctx, width: w, height: h } = r
  const maxCount = Math.max(1, ...monthlyData.value.map(d => d.count))

  ctx.clearRect(0, 0, w, h)
  const barW = 14
  const gap = (w - 50) / 12
  const bottom = h - 40

  // Grid
  ctx.strokeStyle = '#EEEEEE'
  ctx.lineWidth = 1
  for (let yi = 0; yi <= 4; yi++) {
    const y = bottom - (yi / 4) * (bottom - 40)
    ctx.beginPath()
    ctx.moveTo(40, y)
    ctx.lineTo(w - 16, y)
    ctx.stroke()
    ctx.fillStyle = '#999'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(String(Math.round(maxCount * yi / 4)), 36, y + 4)
  }

  // Bars with gradient
  monthlyData.value.forEach((d, i) => {
    const x = 44 + i * gap
    const barH = bottom - ((d.count / maxCount) * (bottom - 40))
    const actualH = bottom - barH

    const gradient = ctx.createLinearGradient(x, bottom, x, bottom - actualH)
    gradient.addColorStop(0, '#FF6B6B')
    gradient.addColorStop(1, '#FF8E53')
    ctx.fillStyle = d.count > 0 ? gradient : '#F0F0F0'

    const r2 = 4
    ctx.beginPath()
    ctx.moveTo(x + r2, bottom)
    ctx.lineTo(x + r2, bottom - actualH + r2)
    ctx.arc(x + r2, bottom - actualH + r2, r2, Math.PI, Math.PI * 1.5)
    ctx.lineTo(x + barW - r2, bottom - actualH)
    ctx.arc(x + barW - r2, bottom - actualH + r2, r2, -Math.PI / 2, 0)
    ctx.lineTo(x + barW - r2, bottom)
    ctx.closePath()
    ctx.fill()

    // Every 2nd month label
    if (i % 2 === 0) {
      ctx.fillStyle = '#999'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(d.label, x + barW / 2, bottom + 18)
    }
  })
}

function drawAllCharts() {
  nextTick(() => {
    setTimeout(() => {
      drawRuntimeChart()
      drawRatingChart()
      drawMonthlyChart()
    }, 300)
  })
}

// For H5: use onMounted; for MP: use onReady
onMounted(() => {
  // #ifdef H5
  drawAllCharts()
  // #endif
})

onReady(() => {
  // #ifdef MP-WEIXIN
  drawAllCharts()
  // #endif
})
</script>

<style lang="scss" scoped>
.page-report {
  min-height: 100vh;
  background: $bg-secondary;
  padding-bottom: 60rpx;
}

// ===== Hero =====
.report-hero {
  background: $color-primary-gradient;
  padding: 60rpx 40rpx 50rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.report-title {
  font-size: $font-xxl;
  font-weight: 800;
  color: #fff;
  margin-bottom: 6rpx;
}

.report-subtitle {
  font-size: $font-sm;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 36rpx;
}

.stats-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40rpx;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 100rpx;
}

.stat-num {
  font-size: 56rpx;
  font-weight: 800;
  color: #fff;
  line-height: 1;
}

.stat-unit {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-top: -4rpx;
}

.stat-label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.85);
  margin-top: 8rpx;
  font-weight: 500;
}

.stat-divider {
  width: 1rpx;
  height: 60rpx;
  background: rgba(255, 255, 255, 0.25);
}

// ===== Chart Cards =====
.chart-card {
  background: $bg-primary;
  margin: 20rpx 30rpx;
  border-radius: $radius-lg;
  padding: 30rpx;
  box-shadow: $shadow-card;
}

.chart-title {
  font-size: $font-lg;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: 20rpx;
  display: block;
}

.chart-wrap {
  display: flex;
  justify-content: center;
}

.chart-canvas {
  display: block;
}

.chart-empty {
  padding: 60rpx 0;
}

// ===== Top Rated =====
.top-list {
  display: flex;
  flex-direction: column;
}

.top-item {
  display: flex;
  align-items: center;
  padding: 14rpx 0;
  gap: 16rpx;
  border-bottom: 1rpx solid $divider;

  &:last-child { border-bottom: none; }
}

.top-rank {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: $bg-secondary;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-xs;
  font-weight: 700;
  color: $text-secondary;
  flex-shrink: 0;

  &.gold {
    background: $color-primary-gradient;
    color: #fff;
  }
}

.top-name {
  flex: 1;
  font-size: $font-sm;
  color: $text-primary;
  font-weight: 500;
}

.top-score {
  font-size: $font-sm;
  color: $color-secondary;
  font-weight: 700;
  flex-shrink: 0;
}
</style>
