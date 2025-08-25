import { defineStore } from 'pinia'
import http from '../api/http'

export const useRecipeStore = defineStore('recipes', {
  state: () => ({
    list: [],
    selected: null,
    loading: false,
    error: '',

    // 검색/필터 상태
    keyword: '',
    categoryNo: null,

    // 페이지네이션 상태
    page: 1,
    size: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
  }),
  
  getters: {
    hasPrev: (s) => s.page > 1,
  },

  actions: {
    setFilters({ keyword = '', categoryNo = null } = {}) {
      this.keyword = (keyword ?? '').trim()
      this.categoryNo = categoryNo ?? null
    },
    reset() {
      this.list = []
      this.loading = false
      this.error = ''
      this.page = 1
      this.total = 0
      this.totalPages = 0
      this.hasNext = false
    },

    async fetchList({ page, size, keyword, categoryNo } = {}) {
      this.loading = true
      this.error = ''

      // 파라미터 우선순위: 인자 > state
      const params = {
        page: page ?? this.page,
        size: size ?? this.size,
      }
      const k = keyword ?? this.keyword
      const cg = categoryNo ?? this.categoryNo
      if (k) params.keyword = k
      if (cg != null) params.categoryNo = cg

      try {
        const { data } = await http.get('/recipes', { params })
        // 백엔드 표준 응답 반영
        this.list = data.items ?? data.content ?? []
        this.page = data.page ?? params.page
        this.size = data.size ?? (size ?? this.size)
        this.total = data.total ?? 0
        this.totalPages = data.totalPages ?? Math.ceil((data.total ?? 0) / this.size)
        this.hasNext = data.hasNext ?? (this.page < this.totalPages)
      } catch (e) {
        this.error = e.response?.data?.message || String(e)
      } finally {
        this.loading = false
      }
    },

    // 검색 실행(항상 1페이지로)
    async search({ keyword, categoryNo } = {}) {
      this.setFilters({ keyword, categoryNo })
      await this.fetchList({ page: 1 })
    },

    async goTo(page) {
      const target = Math.max(1, Math.min(page, this.totalPages || page))
      await this.fetchList({ page: target })
    },
    async next() {
      if (this.page < this.totalPages) await this.goTo(this.page + 1)
    },
    async prev() {
      if (this.page > 1) await this.goTo(this.page - 1)
    },
    async fetchDetail(boardNo) {
      this.loading = true; this.error = ''
      try {
        const { data } = await http.get(`/recipes/${boardNo}`)
        this.selected = data
      } catch (e) {
        this.error = e.response?.data?.message || String(e)
      } finally {
        this.loading = false
      }
    },
  },
})
