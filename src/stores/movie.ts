import { defineStore } from 'pinia'
import { ref } from 'vue'
import { tmdbApi } from '@/api/tmdb'
import type { Movie, Cast, Review, MovieImage } from '@/types'

export const useMovieStore = defineStore('movie', () => {
  // ============ 热映电影 ============
  const nowPlaying = ref<Movie[]>([])
  const nowPlayingLoading = ref(false)
  const nowPlayingError = ref<string | null>(null)

  async function fetchNowPlaying(page = 1) {
    nowPlayingLoading.value = true
    nowPlayingError.value = null
    try {
      const res = await tmdbApi.getNowPlaying(page)
      nowPlaying.value = res.results
    } catch (e: any) {
      nowPlayingError.value = e.message || '加载失败'
    } finally {
      nowPlayingLoading.value = false
    }
  }

  // ============ 热门电影 ============
  const popular = ref<Movie[]>([])
  const popularLoading = ref(false)
  const popularError = ref<string | null>(null)

  async function fetchPopular(page = 1) {
    popularLoading.value = true
    popularError.value = null
    try {
      const res = await tmdbApi.getPopular(page)
      popular.value = res.results
    } catch (e: any) {
      popularError.value = e.message || '加载失败'
    } finally {
      popularLoading.value = false
    }
  }

  // ============ 即将上映 ============
  const upcoming = ref<Movie[]>([])
  const upcomingLoading = ref(false)
  const upcomingError = ref<string | null>(null)

  async function fetchUpcoming(page = 1) {
    upcomingLoading.value = true
    upcomingError.value = null
    try {
      const res = await tmdbApi.getUpcoming(page)
      upcoming.value = res.results
    } catch (e: any) {
      upcomingError.value = e.message || '加载失败'
    } finally {
      upcomingLoading.value = false
    }
  }

  // ============ Top250 ============
  const topRated = ref<Movie[]>([])
  const topRatedPage = ref(1)
  const topRatedTotalPages = ref(1)
  const topRatedLoading = ref(false)
  const topRatedError = ref<string | null>(null)

  async function fetchTopRated(page = 1) {
    topRatedLoading.value = true
    topRatedError.value = null
    try {
      const res = await tmdbApi.getTopRated(page)
      if (page === 1) {
        topRated.value = res.results
      } else {
        topRated.value.push(...res.results)
      }
      topRatedPage.value = res.page
      topRatedTotalPages.value = res.total_pages
    } catch (e: any) {
      topRatedError.value = e.message || '加载失败'
    } finally {
      topRatedLoading.value = false
    }
  }

  async function loadMoreTopRated() {
    if (topRatedLoading.value || topRatedPage.value >= topRatedTotalPages.value) return
    await fetchTopRated(topRatedPage.value + 1)
  }

  // ============ 电影详情 ============
  const currentMovie = ref<Movie | null>(null)
  const currentMovieLoading = ref(false)
  const currentMovieError = ref<string | null>(null)

  const castList = ref<Cast[]>([])
  const reviews = ref<Review[]>([])
  const similarMovies = ref<Movie[]>([])
  const movieImages = ref<MovieImage[]>([])

  async function fetchMovieDetail(id: number) {
    currentMovieLoading.value = true
    currentMovieError.value = null
    try {
      const [movie, creditsRes, reviewsRes, similarRes, imagesRes] = await Promise.all([
        tmdbApi.getMovieDetail(id),
        tmdbApi.getCredits(id),
        tmdbApi.getReviews(id),
        tmdbApi.getSimilar(id),
        tmdbApi.getImages(id),
      ])

      currentMovie.value = movie
      castList.value = creditsRes.cast.slice(0, 20)
      reviews.value = reviewsRes.results.slice(0, 10)
      similarMovies.value = similarRes.results.slice(0, 10)
      movieImages.value = imagesRes.backdrops.slice(0, 15)
    } catch (e: any) {
      currentMovieError.value = e.message || '加载失败'
    } finally {
      currentMovieLoading.value = false
    }
  }

  // ============ 搜索 ============
  const searchResults = ref<Movie[]>([])
  const searchLoading = ref(false)
  const searchError = ref<string | null>(null)

  async function searchMovies(query: string, page = 1) {
    if (!query.trim()) return
    searchLoading.value = true
    searchError.value = null
    try {
      const res = await tmdbApi.searchMovie(query, page)
      if (page === 1) {
        searchResults.value = res.results
      } else {
        searchResults.value.push(...res.results)
      }
    } catch (e: any) {
      searchError.value = e.message || '搜索失败'
    } finally {
      searchLoading.value = false
    }
  }

  // ============ 分类 & 分类排行榜 ============
  const genres = ref<Array<{ id: number; name: string }>>([])
  const genresLoading = ref(false)

  // 按分类ID存储排行榜数据
  const genreRankings = ref<Record<number, Movie[]>>({})
  const genreRankingsLoading = ref<Record<number, boolean>>({})
  const genreRankingsPage = ref<Record<number, number>>({})
  const genreRankingsTotal = ref<Record<number, number>>({})

  // 情色分类特殊 ID
  const ADULT_GENRE_ID = -999

  async function fetchGenres() {
    if (genres.value.length) return
    genresLoading.value = true
    try {
      const res = await tmdbApi.getGenres()
      const list = res.genres.slice(0, 12)
      // 追加情色分类
      list.push({ id: ADULT_GENRE_ID, name: '情色' })
      genres.value = list
    } catch {
      // 静默失败
    } finally {
      genresLoading.value = false
    }
  }

  async function fetchGenreRanking(genreId: number, page = 1) {
    if (!genreRankingsLoading.value[genreId]) {
      genreRankingsLoading.value = { ...genreRankingsLoading.value, [genreId]: true }
    } else {
      genreRankingsLoading.value[genreId] = true
    }

    try {
      const isAdult = genreId === ADULT_GENRE_ID
      const res = isAdult
        ? await tmdbApi.getAdultMovies(page)
        : await tmdbApi.getMoviesByGenre(genreId, page, false)
      if (page === 1) {
        genreRankings.value = { ...genreRankings.value, [genreId]: res.results }
      } else {
        const existing = genreRankings.value[genreId] || []
        genreRankings.value = { ...genreRankings.value, [genreId]: [...existing, ...res.results] }
      }
      genreRankingsPage.value = { ...genreRankingsPage.value, [genreId]: res.page }
      genreRankingsTotal.value = { ...genreRankingsTotal.value, [genreId]: res.total_pages }
    } catch {
      // 静默失败
    } finally {
      genreRankingsLoading.value = { ...genreRankingsLoading.value, [genreId]: false }
    }
  }

  function getGenreRanking(genreId: number): Movie[] {
    return genreRankings.value[genreId] || []
  }

  // ============ 清除当前电影详情缓存 ============
  function clearCurrentMovie() {
    currentMovie.value = null
    castList.value = []
    reviews.value = []
    similarMovies.value = []
    movieImages.value = []
  }

  return {
    nowPlaying, nowPlayingLoading, nowPlayingError,
    popular, popularLoading, popularError,
    upcoming, upcomingLoading, upcomingError,
    topRated, topRatedPage, topRatedTotalPages, topRatedLoading, topRatedError,
    currentMovie, currentMovieLoading, currentMovieError,
    castList, reviews, similarMovies, movieImages,
    searchResults, searchLoading, searchError,
    fetchNowPlaying, fetchPopular, fetchUpcoming,
    fetchTopRated, loadMoreTopRated,
    fetchMovieDetail, clearCurrentMovie,
    searchMovies,
    genres, genresLoading, genreRankings, genreRankingsLoading,
    fetchGenres, fetchGenreRanking, getGenreRanking,
  }
})
