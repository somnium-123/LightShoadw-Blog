import type { Movie } from '@/types'

/**
 * Mock 数据 - 开发阶段使用
 */
export const useMock = import.meta.env.DEV

const MOCK_IMAGE_BASE = 'https://image.tmdb.org/t/p'

export const mockMovies: Movie[] = [
  {
    id: 1,
    title: '流浪地球3',
    original_title: 'The Wandering Earth 3',
    overview: '太阳即将毁灭，人类在地球表面建造出巨大的推进器，寻找新的家园。然而宇宙之路危机四伏，为了拯救地球，流浪地球时代的年轻人再次挺身而出，展开争分夺秒的生死之战。',
    poster_path: '/mock-poster-1.jpg',
    backdrop_path: '/mock-backdrop-1.jpg',
    release_date: '2026-02-10',
    vote_average: 8.5,
    vote_count: 15234,
    genres: [
      { id: 878, name: '科幻' },
      { id: 12, name: '冒险' },
    ],
    runtime: 160,
    adult: false,
    original_language: 'zh',
    popularity: 980.5,
  },
  {
    id: 2,
    title: '哪吒之魔童闹海',
    original_title: 'Nezha 2',
    overview: '天劫之后，哪吒、敖丙的灵魂虽保住了，但肉身很快会魂飞魄散。太乙真人打算用七色宝莲给二人重塑肉身。但是在重塑肉身的过程中却遇到重重困难。',
    poster_path: '/mock-poster-2.jpg',
    backdrop_path: '/mock-backdrop-2.jpg',
    release_date: '2025-07-20',
    vote_average: 8.8,
    vote_count: 28500,
    genres: [
      { id: 16, name: '动画' },
      { id: 28, name: '动作' },
      { id: 14, name: '奇幻' },
    ],
    runtime: 144,
    adult: false,
    original_language: 'zh',
    popularity: 1200.3,
  },
  {
    id: 3,
    title: '封神第二部',
    original_title: 'Creation of the Gods II',
    overview: '殷商大军兵临西岐，姜子牙率昆仑仙人相助。各方势力暗流涌动，封神大战一触即发。',
    poster_path: '/mock-poster-3.jpg',
    backdrop_path: '/mock-backdrop-3.jpg',
    release_date: '2025-08-15',
    vote_average: 8.2,
    vote_count: 9800,
    genres: [
      { id: 28, name: '动作' },
      { id: 14, name: '奇幻' },
      { id: 36, name: '历史' },
    ],
    runtime: 148,
    adult: false,
    original_language: 'zh',
    popularity: 850.1,
  },
  {
    id: 4,
    title: '星际穿越',
    original_title: 'Interstellar',
    overview: '在不久的未来，气候巨变，粮食作物逐渐绝迹。前NASA宇航员库珀被选中加入穿越虫洞寻找人类新家园的星际远征队。',
    poster_path: '/mock-poster-4.jpg',
    backdrop_path: '/mock-backdrop-4.jpg',
    release_date: '2014-11-12',
    vote_average: 8.7,
    vote_count: 32000,
    genres: [
      { id: 12, name: '冒险' },
      { id: 18, name: '剧情' },
      { id: 878, name: '科幻' },
    ],
    runtime: 169,
    adult: false,
    original_language: 'en',
    popularity: 700.2,
  },
  {
    id: 5,
    title: '奥本海默',
    original_title: 'Oppenheimer',
    overview: '二战期间，美国物理学家罗伯特·奥本海默领导曼哈顿计划，研发出了原子弹。在目睹了原子弹的巨大威力后，他陷入了道德困境。',
    poster_path: '/mock-poster-5.jpg',
    backdrop_path: '/mock-backdrop-5.jpg',
    release_date: '2023-08-30',
    vote_average: 8.6,
    vote_count: 45000,
    genres: [
      { id: 18, name: '剧情' },
      { id: 36, name: '历史' },
      { id: 53, name: '惊悚' },
    ],
    runtime: 180,
    adult: false,
    original_language: 'en',
    popularity: 600.8,
  },
]

// Mock 端点映射
const mockEndpoints: Record<string, any> = {
  '/movie/now_playing': { page: 1, results: mockMovies, total_pages: 1, total_results: mockMovies.length },
  '/movie/popular': { page: 1, results: mockMovies, total_pages: 1, total_results: mockMovies.length },
  '/movie/upcoming': { page: 1, results: mockMovies.slice(0, 3), total_pages: 1, total_results: 3 },
  '/movie/top_rated': { page: 1, results: [...mockMovies].sort((a, b) => b.vote_average - a.vote_average), total_pages: 1, total_results: mockMovies.length },
}

export function getMockData(endpoint: string): Promise<any> {
  const baseEndpoint = endpoint.split('?')[0]

  // 电影详情 mock
  if (baseEndpoint.match(/^\/movie\/\d+$/)) {
    return Promise.resolve(mockMovies[0])
  }

  const data = mockEndpoints[baseEndpoint]
  if (data) {
    return Promise.resolve(data)
  }

  // 搜索 mock
  if (baseEndpoint.startsWith('/search/')) {
    return Promise.resolve({ page: 1, results: mockMovies, total_pages: 1, total_results: mockMovies.length })
  }

  return Promise.resolve({ page: 1, results: [], total_pages: 0, total_results: 0 })
}
