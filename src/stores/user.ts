import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { storage } from '@/utils/cache'
import { cloudApi } from '@/api/tmdb'
import type { UserInfo, UserMovie } from '@/types'

const USER_INFO_KEY = 'user_info'
const WISH_LIST_KEY = 'wish_list'
const WATCHED_LIST_KEY = 'watched_list'

export const useUserStore = defineStore('user', () => {
  // ============ 用户信息 ============
  const userInfo = ref<UserInfo | null>(storage.get<UserInfo>(USER_INFO_KEY))
  const isLoggedIn = ref(!!userInfo.value)
  const loginLoading = ref(false)

  async function login(): Promise<void> {
    if (loginLoading.value) return
    loginLoading.value = true

    try {
      // 微信登录获取 code
      const loginRes = await new Promise<UniApp.LoginRes>((resolve, reject) => {
        uni.login({
          success: resolve,
          fail: reject,
        })
      })

      // 获取用户信息
      let nickName = '影迷'
      let avatarUrl = '/static/images/placeholder-avatar.png'

      try {
        const infoRes = await new Promise<UniApp.GetUserInfoRes>((resolve, reject) => {
          uni.getUserInfo({
            success: resolve,
            fail: reject,
          })
        })
        nickName = infoRes.userInfo.nickName || nickName
        avatarUrl = infoRes.userInfo.avatarUrl || avatarUrl
      } catch {
        // getUserInfo 可能失败，使用默认值
        console.warn('获取用户信息失败，使用默认值')
      }

      const info: UserInfo = {
        openid: loginRes.code || `user_${Date.now()}`,
        nickName,
        avatarUrl,
        gender: 0,
        country: '',
        province: '',
        city: '',
      }

      setUserInfo(info)
      uni.showToast({ title: '登录成功', icon: 'success' })
    } catch (e: any) {
      console.error('登录失败:', e)
      uni.showToast({ title: '登录失败，请重试', icon: 'none' })
    } finally {
      loginLoading.value = false
    }
  }

  function setUserInfo(info: UserInfo) {
    userInfo.value = info
    isLoggedIn.value = true
    storage.set(USER_INFO_KEY, info)
  }

  function logout() {
    userInfo.value = null
    isLoggedIn.value = false
    storage.remove(USER_INFO_KEY)
    wishList.value = []
    watchedList.value = []
    storage.remove(WISH_LIST_KEY)
    storage.remove(WATCHED_LIST_KEY)
  }

  // ============ 片单 ============
  const wishList = ref<UserMovie[]>(storage.get<UserMovie[]>(WISH_LIST_KEY) || [])
  const watchedList = ref<UserMovie[]>(storage.get<UserMovie[]>(WATCHED_LIST_KEY) || [])

  function isInList(movieId: number, status: 'wish' | 'watched'): boolean {
    const list = status === 'wish' ? wishList.value : watchedList.value
    return list.some((m) => m.movie_id === movieId)
  }

  function getStatus(movieId: number): 'wish' | 'watched' | null {
    if (isInList(movieId, 'watched')) return 'watched'
    if (isInList(movieId, 'wish')) return 'wish'
    return null
  }

  async function toggleMovieStatus(
    movie: { id: number; title: string; poster_path: string | null; vote_average: number; runtime: number | null },
    status: 'wish' | 'watched',
  ): Promise<void> {
    if (!userInfo.value) {
      uni.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    const openid = userInfo.value.openid
    const currentStatus = getStatus(movie.id)

    // 如果已经标记同一个状态，则取消
    if (currentStatus === status) {
      await removeFromList(movie.id, status)
      return
    }

    // 如果之前标记了另一个状态，先移除旧的
    if (currentStatus && currentStatus !== status) {
      await removeFromList(movie.id, currentStatus)
    }

    const item: UserMovie = {
      openid,
      movie_id: movie.id,
      movie_title: movie.title,
      movie_poster: movie.poster_path || '',
      movie_rating: movie.vote_average,
      movie_runtime: movie.runtime,
      status,
      created_at: Date.now(),
      watched_at: status === 'watched' ? Date.now() : undefined,
    }

    const list = status === 'wish' ? wishList : watchedList
    list.value.unshift(item)

    // 持久化到本地
    storage.set(status === 'wish' ? WISH_LIST_KEY : WATCHED_LIST_KEY, list.value)

    // 同步到云端
    try {
      await cloudApi.saveMovieList(openid, movie, status)
    } catch {
      console.warn('云端同步失败，保留本地数据')
    }
  }

  async function removeFromList(movieId: number, status: 'wish' | 'watched'): Promise<void> {
    const list = status === 'wish' ? wishList : watchedList
    const index = list.value.findIndex((m) => m.movie_id === movieId)
    if (index > -1) {
      list.value.splice(index, 1)
      storage.set(status === 'wish' ? WISH_LIST_KEY : WATCHED_LIST_KEY, list.value)
    }

    if (userInfo.value) {
      try {
        await cloudApi.removeMovieList(userInfo.value.openid, movieId)
      } catch {
        console.warn('云端同步失败')
      }
    }
  }

  // ============ 观影统计 ============
  const watchedCount = computed(() => watchedList.value.length)
  const wishCount = computed(() => wishList.value.length)

  const avgRating = computed(() => {
    const rated = watchedList.value.filter((m) => m.movie_rating)
    if (rated.length === 0) return 0
    const sum = rated.reduce((acc, m) => acc + (m.movie_rating || 0), 0)
    return Math.round((sum / rated.length) * 10) / 10
  })

  const totalRuntime = computed(() => {
    return watchedList.value.reduce((acc, m) => acc + (m.movie_runtime || 0), 0)
  })

  return {
    userInfo, isLoggedIn, loginLoading,
    wishList, watchedList,
    watchedCount, wishCount, avgRating, totalRuntime,
    login, setUserInfo, logout,
    isInList, getStatus,
    toggleMovieStatus, removeFromList,
  }
})
