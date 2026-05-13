// 电影基本信息
export interface Movie {
  id: number
  title: string
  original_title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  genres: Genre[]
  genre_ids?: number[]
  runtime: number | null
  adult: boolean
  original_language: string
  popularity: number
}

export interface Genre {
  id: number
  name: string
}

// 演职员
export interface Cast {
  id: number
  name: string
  character: string
  profile_path: string | null
  order: number
}

export interface Crew {
  id: number
  name: string
  department: string
  job: string
  profile_path: string | null
}

// 剧照
export interface MovieImage {
  file_path: string
  width: number
  height: number
  aspect_ratio: number
}

export interface ImagesResponse {
  backdrops: MovieImage[]
  posters: MovieImage[]
}

// 影评
export interface Review {
  id: string
  author: string
  author_details: {
    name: string
    username: string
    avatar_path: string | null
    rating: number | null
  }
  content: string
  created_at: string
}

// 演职员接口响应
export interface CreditsResponse {
  id: number
  cast: Cast[]
  crew: Crew[]
}

// 用户片单
export interface UserMovie {
  _id?: string
  openid: string
  movie_id: number
  movie_title: string
  movie_poster: string
  movie_rating?: number
  movie_runtime?: number
  status: 'wish' | 'watched'
  created_at: number
  watched_at?: number
}

// 搜索历史
export interface SearchHistory {
  keyword: string
  timestamp: number
}

// 用户信息
export interface UserInfo {
  openid: string
  nickName: string
  avatarUrl: string
  gender: number
  country: string
  province: string
  city: string
}

// API 响应
export interface TmdbListResponse<T> {
  page: number
  results: T[]
  total_pages: number
  total_results: number
}

export interface TmdbProxyRequest {
  endpoint: string
  params?: Record<string, any>
  method?: 'GET' | 'POST'
}

export interface TmdbProxyResponse<T = any> {
  code: number
  data: T
  message?: string
  cached?: boolean
}
