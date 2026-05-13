const cloud = require('wx-server-sdk')
cloud.init()

const TMDB_API_KEY = process.env.TMDB_API_KEY || ''
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

// 内存缓存
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000

// 本地降级数据
const fallbackData = {}

exports.main = async (event) => {
  const { endpoint, params = {}, method = 'GET' } = event
  const cacheKey = `${endpoint}_${JSON.stringify(params)}`

  // 检查缓存
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey)
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return { code: 200, data: cached.data, cached: true }
    }
  }

  try {
    const url = `${TMDB_BASE_URL}${endpoint}`

    const res = await cloud.openapi.cloudbase.httpRequest({
      url,
      method,
      data: { ...params, api_key: TMDB_API_KEY, language: params.language || 'zh-CN' },
    })

    if (res.statusCode !== 200) {
      throw new Error(`TMDB API 返回错误: ${res.statusCode}`)
    }

    const data = JSON.parse(res.body || '{}')

    // 缓存结果
    cache.set(cacheKey, { data, timestamp: Date.now() })

    // 更新降级数据
    fallbackData[cacheKey] = data

    return { code: 200, data }
  } catch (error) {
    // 降级处理：返回最近缓存
    if (fallbackData[cacheKey]) {
      return {
        code: 200,
        data: fallbackData[cacheKey],
        cached: true,
        message: '使用缓存数据',
      }
    }

    return {
      code: 500,
      message: error.message || '请求TMDB失败',
    }
  }
}
