import { ref } from 'vue'
import { storage } from '@/utils/cache'
import type { UserInfo } from '@/types'

const USER_INFO_KEY = 'user_info'
const IS_LOGGED_IN_KEY = 'is_logged_in'

/**
 * 用户相关逻辑
 */
export function useUser() {
  const userInfo = ref<UserInfo | null>(storage.get<UserInfo>(USER_INFO_KEY))
  const isLoggedIn = ref(storage.get<boolean>(IS_LOGGED_IN_KEY) || false)
  const loginLoading = ref(false)

  async function login(): Promise<boolean> {
    loginLoading.value = true
    try {
      const res = await uni.login({ provider: 'weixin' })
      if (!res.code) {
        throw new Error('获取登录凭证失败')
      }

      // 模拟获取用户信息
      const info: UserInfo = {
        openid: 'mock_openid_' + Date.now(),
        nickName: '影迷用户',
        avatarUrl: '',
        gender: 0,
        country: '中国',
        province: '',
        city: '',
      }

      userInfo.value = info
      isLoggedIn.value = true
      storage.set(USER_INFO_KEY, info)
      storage.set(IS_LOGGED_IN_KEY, true)

      uni.showToast({ title: '登录成功', icon: 'success' })
      return true
    } catch (e: any) {
      uni.showToast({ title: e.message || '登录失败', icon: 'none' })
      return false
    } finally {
      loginLoading.value = false
    }
  }

  async function getUserProfile(): Promise<void> {
    try {
      const res = await uni.getUserProfile({ desc: '用于完善个人资料' })
      if (userInfo.value) {
        userInfo.value = {
          ...userInfo.value,
          nickName: res.userInfo.nickName,
          avatarUrl: res.userInfo.avatarUrl,
          gender: res.userInfo.gender,
          country: res.userInfo.country,
          province: res.userInfo.province,
          city: res.userInfo.city,
        }
        storage.set(USER_INFO_KEY, userInfo.value)
      }
    } catch {
      console.warn('用户拒绝授权')
    }
  }

  function logout() {
    userInfo.value = null
    isLoggedIn.value = false
    storage.remove(USER_INFO_KEY)
    storage.remove(IS_LOGGED_IN_KEY)
  }

  return { userInfo, isLoggedIn, loginLoading, login, getUserProfile, logout }
}
