const IMAGE_BASE_URL = import.meta.env.VITE_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p'

/**
 * 获取海报 URL
 * @param path 海报路径
 * @param size 尺寸: w185 | w300 | w500 | w780 | w1280 | original
 */
export function getPosterUrl(path: string | null, size: string = 'w500'): string {
  if (!path) return '/static/images/placeholder-poster.png'
  return `${IMAGE_BASE_URL}/${size}${path}`
}

/**
 * 获取背景图 URL
 */
export function getBackdropUrl(path: string | null, size: string = 'w1280'): string {
  if (!path) return '/static/images/placeholder-backdrop.png'
  return `${IMAGE_BASE_URL}/${size}${path}`
}

/**
 * 获取头像 URL
 */
export function getProfileUrl(path: string | null, size: string = 'w185'): string {
  if (!path) return '/static/images/placeholder-avatar.png'
  return `${IMAGE_BASE_URL}/${size}${path}`
}

/**
 * 格式化运行时长 (分钟 -> X小时X分钟)
 */
export function formatRuntime(minutes: number | null): string {
  if (!minutes || minutes <= 0) return '未知'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}分钟`
  if (m === 0) return `${h}小时`
  return `${h}小时${m}分钟`
}

/**
 * 格式化上映年份
 */
export function formatYear(dateStr: string): string {
  if (!dateStr) return '未知'
  return dateStr.split('-')[0]
}

/**
 * 格式化评分
 */
export function formatRating(vote: number): string {
  return vote.toFixed(1)
}

/**
 * 格式化数字（千位）
 */
export function formatCount(count: number): string {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}万`
  }
  return count.toString()
}
