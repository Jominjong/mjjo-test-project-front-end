import { defineStore } from 'pinia'
import http from '../api/http'

export const useRecipeStore = defineStore('recipes', {
  state: () => ({
    list: [],
    selected: null,
    loading: false,
    error: '',
  }),
  
  actions: {
    async fetchList(params = { page: 1, size: 10 }) {
      this.loading = true; this.error = ''
      try {
        const { data } = await http.get('/recipes', { params: { page: 1, size: 10 } })
        // 백엔드 응답 구조에 맞춰 조정 (예: data.items / data.content / data)
        this.list = data.items ?? data.content ?? data
      } catch (e) {
        this.error = e.response?.data?.message || String(e)
      } finally {
        this.loading = false
      }
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
