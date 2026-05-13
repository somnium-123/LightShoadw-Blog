import { ref } from 'vue'
import type { Movie } from '@/types'

/**
 * 电影列表通用逻辑
 */
export function useMovieList() {
  const list = ref<Movie[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const page = ref(1)
  const totalPages = ref(1)
  const hasMore = ref(true)

  async function loadData(
    fetcher: (page: number) => Promise<{ results: Movie[]; total_pages: number; page: number }>,
    reset = false,
  ) {
    if (loading.value) return
    if (!reset && !hasMore.value) return

    if (reset) page.value = 1

    loading.value = true
    error.value = null

    try {
      const res = await fetcher(page.value)
      if (reset) {
        list.value = res.results
      } else {
        list.value.push(...res.results)
      }
      totalPages.value = res.total_pages
      hasMore.value = page.value < res.total_pages
      page.value = res.page
    } catch (e: any) {
      error.value = e.message || '加载失败'
    } finally {
      loading.value = false
    }
  }

  function refresh(fetcher: () => Promise<{ results: Movie[]; total_pages: number; page: number }>) {
    return loadData(fetcher, true)
  }

  function loadMore(fetcher: () => Promise<{ results: Movie[]; total_pages: number; page: number }>) {
    if (!hasMore.value) return
    page.value++
    return loadData(fetcher)
  }

  return { list, loading, error, hasMore, refresh, loadMore }
}
