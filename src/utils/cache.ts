const CACHE_PREFIX = 'movie_blog_'

/**
 * 本地缓存工具
 */
export const storage = {
  get<T = any>(key: string): T | null {
    try {
      const value = uni.getStorageSync(`${CACHE_PREFIX}${key}`)
      return value ? (JSON.parse(value) as T) : null
    } catch {
      return null
    }
  },

  set(key: string, value: any): void {
    try {
      uni.setStorageSync(`${CACHE_PREFIX}${key}`, JSON.stringify(value))
    } catch {
      console.warn('Storage set failed:', key)
    }
  },

  remove(key: string): void {
    try {
      uni.removeStorageSync(`${CACHE_PREFIX}${key}`)
    } catch {
      console.warn('Storage remove failed:', key)
    }
  },

  clear(): void {
    try {
      uni.clearStorageSync()
    } catch {
      console.warn('Storage clear failed')
    }
  },
}

/**
 * 搜索历史管理
 */
const SEARCH_HISTORY_KEY = 'search_history'
const MAX_HISTORY = 10

export function getSearchHistory(): string[] {
  const list = storage.get<string[]>(SEARCH_HISTORY_KEY)
  return list || []
}

export function addSearchHistory(keyword: string): void {
  const list = getSearchHistory()
  const index = list.indexOf(keyword)
  if (index > -1) {
    list.splice(index, 1)
  }
  list.unshift(keyword)
  if (list.length > MAX_HISTORY) {
    list.pop()
  }
  storage.set(SEARCH_HISTORY_KEY, list)
}

export function clearSearchHistory(): void {
  storage.remove(SEARCH_HISTORY_KEY)
}
