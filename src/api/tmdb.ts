import type {
  TmdbListResponse,
  TmdbProxyRequest,
  TmdbProxyResponse,
  Movie,
  CreditsResponse,
  Review,
  ImagesResponse,
  UserMovie,
} from '@/types'

const TMDB_BASE = import.meta.env.VITE_TMDB_BASE_URL || 'https://api.themoviedb.org/3'
const TMDB_PROXY = import.meta.env.VITE_TMDB_PROXY || ''

/**
 * 自定义 Request 封装
 * 支持请求拦截、响应拦截、超时重试、防重复请求、请求取消
 */
interface RequestOptions {
  url: string
  method?: 'GET' | 'POST'
  data?: any
  timeout?: number
  retry?: number
  noDuplicate?: boolean
}

class Request {
  private pendingRequests: Map<string, Promise<any>> = new Map()

  private getRequestKey(options: RequestOptions): string {
    return `${options.method || 'GET'}_${options.url}_${JSON.stringify(options.data || {})}`
  }

  requestInterceptor(options: RequestOptions): RequestOptions {
    const token = uni.getStorageSync('token')
    if (token) {
      options.data = { ...options.data, token }
    }
    return options
  }

  responseInterceptor<T>(response: any): T {
    if (response.statusCode === 401) {
      uni.removeStorageSync('token')
      uni.showToast({ title: '登录已过期', icon: 'none' })
    }
    if (response.statusCode >= 400) {
      throw new Error(`请求失败: ${response.statusCode}`)
    }
    return response.data as T
  }

  async request<T = any>(options: RequestOptions): Promise<T> {
    options = this.requestInterceptor(options)
    const key = this.getRequestKey(options)

    if (options.noDuplicate && this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>
    }

    let retryCount = 0
    const maxRetry = options.retry || 0

    const doRequest = async (): Promise<T> => {
      while (retryCount <= maxRetry) {
        try {
          const promise = new Promise<T>((resolve, reject) => {
            uni.request({
              url: options.url,
              method: options.method || 'GET',
              data: options.data,
              timeout: options.timeout || 15000,
              success: (res) => {
                try {
                  resolve(this.responseInterceptor<T>(res))
                } catch (e) {
                  reject(e)
                }
              },
              fail: (err) => reject(err),
            })
          })

          this.pendingRequests.set(key, promise)
          const result = await promise
          this.pendingRequests.delete(key)
          return result
        } catch (error) {
          if (retryCount < maxRetry) {
            retryCount++
            await this.delay(1000 * retryCount)
          } else {
            this.pendingRequests.delete(key)
            throw error
          }
        }
      }
      throw new Error('请求失败')
    }

    return doRequest()
  }

  cancelRequest(key: string): void {
    this.pendingRequests.delete(key)
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

export const http = new Request()

// ==================== TMDB API 调用层 ====================

function buildQueryString(params: Record<string, any>): string {
  const parts: string[] = []
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(value)))
    }
  })
  return parts.join('&')
}

async function tmdbCall<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
  const useMock = import.meta.env.VITE_USE_MOCK === 'true'

  if (useMock) {
    return import('./mock').then((m) => m.getMockData(endpoint) as T)
  }

  const apiKey = import.meta.env.VITE_TMDB_API_KEY
  const queryParams: Record<string, any> = { ...params, api_key: apiKey }
  if (!queryParams.language) {
    queryParams.language = 'zh-CN'
  }

  const base = TMDB_PROXY || TMDB_BASE
  const url = `${base}${endpoint}?${buildQueryString(queryParams)}`

  return new Promise<T>((resolve, reject) => {
    uni.request({
      url,
      method: 'GET',
      timeout: 20000,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data as T)
        } else {
          reject(new Error(`TMDB API 错误: ${res.statusCode}`))
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '请求超时，请检查网络连接'))
      },
    })
  })
}

// TMDB API 方法
export const tmdbApi = {
  /** 热映电影 */
  getNowPlaying(page = 1): Promise<TmdbListResponse<Movie>> {
    return tmdbCall('/movie/now_playing', { page, region: 'CN' })
  },

  /** 热门电影 */
  getPopular(page = 1): Promise<TmdbListResponse<Movie>> {
    return tmdbCall('/movie/popular', { page, region: 'CN' })
  },

  /** 即将上映 */
  getUpcoming(page = 1): Promise<TmdbListResponse<Movie>> {
    return tmdbCall('/movie/upcoming', { page, region: 'CN' })
  },

  /** Top250 高分电影 */
  getTopRated(page = 1): Promise<TmdbListResponse<Movie>> {
    return tmdbCall('/movie/top_rated', { page, region: 'CN' })
  },

  /** 电影详情 */
  getMovieDetail(id: number): Promise<Movie> {
    return tmdbCall(`/movie/${id}`, { language: 'zh-CN' })
  },

  /** 演职员表 */
  getCredits(id: number): Promise<CreditsResponse> {
    return tmdbCall(`/movie/${id}/credits`)
  },

  /** 影评列表 */
  getReviews(id: number, page = 1): Promise<TmdbListResponse<Review>> {
    return tmdbCall(`/movie/${id}/reviews`, { page })
  },

  /** 剧照 */
  getImages(id: number): Promise<ImagesResponse> {
    return tmdbCall(`/movie/${id}/images`)
  },

  /** 相似电影 */
  getSimilar(id: number, page = 1): Promise<TmdbListResponse<Movie>> {
    return tmdbCall(`/movie/${id}/similar`, { page })
  },

  /** 搜索电影 */
  searchMovie(query: string, page = 1): Promise<TmdbListResponse<Movie>> {
    return tmdbCall('/search/movie', { query, page, language: 'zh-CN' })
  },

  /** 电影分类列表 */
  getGenres(): Promise<{ genres: Array<{ id: number; name: string }> }> {
    return tmdbCall('/genre/movie/list', { language: 'zh-CN' })
  },

  /** 按分类发现电影 — 按评分降序 = 分类排行榜 */
  getMoviesByGenre(genreId: number, page = 1, includeAdult = false): Promise<TmdbListResponse<Movie>> {
    const params: Record<string, any> = {
      with_genres: String(genreId),
      sort_by: 'vote_average.desc',
      'vote_count.gte': 200,
      page,
      language: 'zh-CN',
      region: 'CN',
    }
    if (includeAdult) {
      params.include_adult = true
    }
    return tmdbCall('/discover/movie', params)
  },

  /** 情色分类 — 使用关键词 + adult 过滤器 */
  getAdultMovies(page = 1): Promise<TmdbListResponse<Movie>> {
    return tmdbCall('/discover/movie', {
      with_keywords: 'erotic|sex|nudity',
      sort_by: 'vote_average.desc',
      'vote_count.gte': 100,
      include_adult: true,
      page,
      language: 'zh-CN',
    })
  },
}

// ==================== 云函数 API 调用层 ====================

export const cloudApi = {
  /** 获取用户片单 */
  getUserMovies(openid: string, status?: 'wish' | 'watched'): Promise<UserMovie[]> {
    return http.request({
      url: '/cloud/getUserMovies',
      method: 'GET',
      data: { openid, status },
    })
  },

  /** 保存电影到片单 */
  saveMovieList(openid: string, movie: Partial<Movie>, status: 'wish' | 'watched'): Promise<{ success: boolean }> {
    return http.request({
      url: '/cloud/saveMovieList',
      method: 'POST',
      data: {
        openid,
        movie_id: movie.id,
        movie_title: movie.title,
        movie_poster: movie.poster_path,
        movie_rating: movie.vote_average,
        movie_runtime: movie.runtime,
        status,
      },
    })
  },

  /** 从片单删除 */
  removeMovieList(openid: string, movieId: number): Promise<{ success: boolean }> {
    return http.request({
      url: '/cloud/removeMovieList',
      method: 'POST',
      data: { openid, movieId },
    })
  },
}
