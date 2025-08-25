import { defineStore } from 'pinia'
import http from '../api/http'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: localStorage.getItem('accessToken') || '',
    user: null,        // { email, name, roles? }
    refreshToken: localStorage.getItem('refreshToken') || '' // (쿠키 쓰면 비워둬도 됨)
  }),
  getters: {
    isAuthed: (s) => !!s.accessToken,
  },
  actions: {
    setTokens({ accessToken, refreshToken }) {
      if (accessToken) {
        this.accessToken = accessToken
        localStorage.setItem('accessToken', accessToken)
      }
      // 백엔드가 refreshToken을 바디로 주는 경우만 저장
      if (refreshToken) {
        this.refreshToken = refreshToken
        localStorage.setItem('refreshToken', refreshToken)
      }
    },
    clearTokens() {
      this.accessToken = ''
      this.refreshToken = ''
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    },

    async register({ email, password, name }) {
      await http.post('/auth/register', { email, password, name })
      // 보통은 가입 후 자동로그인 안함 → 필요하면 여기서 this.login(...) 호출
    },

    async login({ email, password }) {
      const { data } = await http.post('/auth/login', { email, password })
      // 기대 응답: { accessToken, refreshToken?, user? }
      this.setTokens(data)
      if (data.user) this.user = data.user
      else this.user = { email } // 최소한 이메일은 기억
      return true
    },

    async refresh() {
      try {
        // 1) HttpOnly 쿠키를 쓰는 서버라면 바디 없이 호출만 해도 됨
        let data
        try {
          ({ data } = await http.post('/auth/refresh'))
        } catch (e) {
          // 2) 쿠키 미사용 서버: 저장된 refreshToken을 바디로 보냄
          if (!this.refreshToken) throw e
          ({ data } = await http.post('/auth/refresh', { refreshToken: this.refreshToken }))
        }
        this.setTokens(data)
        return true
      } catch (e) {
        this.logout()
        return false
      }
    },

    logout() {
      this.clearTokens()
      this.user = null
    },

    // 비밀번호 찾기(리셋 토큰 발급)
    async requestPasswordReset(email) {
      const { data } = await http.post('/auth/password/find', { email })
      // 서버가 resetToken을 리턴하면 data.resetToken 사용 가능 (메일링이라 나중에 없앨예정)
      return data
    },

    // 비밀번호 리셋(토큰 필요)
    async resetPassword({ resetToken, newPassword }) {
      // 이 API는 Authorization 헤더에 resetToken을 Bearer로 넣어야 함
      await http.post( '/auth/password/reset', { resetToken, newPassword }
        // { headers: { Authorization: `Bearer ${resetToken}` } }
      )
    },
  },
})
