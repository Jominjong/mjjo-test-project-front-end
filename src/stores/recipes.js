import { defineStore } from 'pinia'
import http from '../api/http'
// 같은 폴더에 auth 스토어가 있다면 './auth'로, 경로가 다르면 맞춰주세요.
import { useAuthStore } from './auth'

export const useRecipeStore = defineStore('recipes', {
  state: () => ({
    list: [],
    selected: null,
    loading: false,
    saving: false,
    error: '',

    // 검색/필터 상태
    keyword: '',
    categoryNo: null,

    // 페이지네이션 상태
    page: 1,
    size: 11,
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
        const { data } = await http.get('http://localhost:8080/recipes', { params })
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
        const { data } = await http.get(`http://localhost:8080/recipes/${boardNo}`)
        this.selected = data
      } catch (e) {
        this.error = e.response?.data?.message || String(e)
      } finally {
        this.loading = false
      }
    },

  // 레시피 추가
    async createRecipe(form) {
      this.saving = true; this.error = ''
      try {
        // 로그인 사용자에서 userNo 조회
        const auth = useAuthStore()
        const rawUserNo = auth.user?.userNo ?? auth.user?.id ?? auth.user?.no
        if (!rawUserNo) throw new Error('userNo를 확인할 수 없습니다.')

        const payload = {
          userNo: Number(rawUserNo), // ⬅️ 필수: create에만 포함
          title: String(form.title || '').trim(),
          content: String(form.content || '').trim(),
          categoryNo: Number(form.categoryNo), // 숫자로 강제
          ingredients: (form.ingredients || []).map(i => ({
            name: String(i.name || '').trim(),
            amount: String(i.amount || '').trim(),
          })),
        }

        const { data } = await http.post('http://localhost:8080/recipes', payload)
        this.selected = data
        return data // boardNo 포함 가정
      } catch (e) {
        this.error = e?.response?.data?.message || String(e)
        throw e
      } finally {
        this.saving = false
      }
    },

    // 레시피 수정
    async updateRecipe(boardNo, form) {
      this.saving = true; this.error = ''
      try {
        const id = Number(boardNo)
        if (!id) throw new Error('boardNo가 올바르지 않습니다.')

        const payload = {
          title: String(form.title || '').trim(),
          content: String(form.content || '').trim(),
          categoryNo: Number(form.categoryNo), // 숫자로 강제
          ingredients: (form.ingredients || []).map(i => ({
            name: String(i.name || '').trim(),
            amount: String(i.amount || '').trim(),
          })),
        }

        const { data } = await http.put(`http://localhost:8080/recipes/${id}`, payload)
        this.selected = data
        return data
      } catch (e) {
        this.error = e?.response?.data?.message || String(e)
        throw e
      } finally {
        this.saving = false
      }
    },

    // 레시피 삭제
    async deleteRecipe(boardNo) {
      this.saving = true; this.error = ''
      try {
        const id = Number(boardNo)
        if (!id) throw new Error('boardNo가 올바르지 않습니다.')

        await http.delete(`http://localhost:8080/recipes/${id}`)
        if (this.selected?.boardNo === id) this.selected = null
      } catch (e) {
        this.error = e?.response?.data?.message || String(e)
        throw e
      } finally {
        this.saving = false
      }
    },
  },
})
