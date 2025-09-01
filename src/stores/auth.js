import { defineStore } from 'pinia'
import http from '../api/http'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: localStorage.getItem('accessToken') || '',
    user: (() => {
      const name = localStorage.getItem('userName') || ''
      const userNoStr = localStorage.getItem('userNo')
      const hasAny = name || userNoStr !== null
      if (!hasAny) return null
      return { name, userNo: userNoStr != null ? Number(userNoStr) : 0 }
    })(),

    refreshToken: localStorage.getItem('refreshToken') || '',
    signupToken: sessionStorage.getItem('signupToken') || '',
    pwResetToken: sessionStorage.getItem('pwResetToken') || '',
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

    // 이메일 중복확인 + 코드발송
    async checkEmail(email) {
      const { data } = await http.post('http://localhost:8080/auth/register/check', { email })
      return data
    },
    // 코드 검증 → signupToken 저장
    async verifySignup({ email, code }) {
      const { data } = await http.post('http://localhost:8080/auth/register/verify', { email, code })
      const token = data.resetToken
      this.signupToken = token
      sessionStorage.setItem('signupToken', token)
      const ttl = data.expiresInSec
      return { ...data, signupToken: token, signupTtlSec: ttl }
    },
    // 최종 회원가입 (X-Signup-Token 헤더 사용)
    async registerWithSignup({ email, password, name }) {
      const token = this.signupToken || sessionStorage.getItem('signupToken') || ''
      if (!token) { throw new Error('이메일 인증이 만료되었거나 토큰이 없습니다. 다시 인증해주세요.')}
      await http.post('http://localhost:8080/auth/register', { email, password, name }, { headers: { 'X-Signup-Token': token } })
      // 사용 후 폐기 (재사용 방지)
      this.signupToken = ''
      sessionStorage.removeItem('signupToken')
    },

    async login({ email, password }) {
      const { data } = await http.post('http://localhost:8080/auth/login', { email, password })
      this.setTokens(data)
      const u = data.user ?? data
      this.user = {
        userNo: u?.userNo ?? 0,
        name: u?.name ?? '',
      }
      localStorage.setItem('userName', this.user.name || '')
      localStorage.setItem('userNo', String(this.user.userNo ?? 0))
    },

    async refresh() {
      try {
        let data
        try {
          ({ data } = await http.post('http://localhost:8080/auth/refresh'))
        } catch (e) {
          if (!this.refreshToken) throw e
          ({ data } = await http.post('http://localhost:8080/auth/refresh', { refreshToken: this.refreshToken }))
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
      localStorage.removeItem('userName')
      localStorage.removeItem('userNo')
    },

    setPwResetToken(token) {
      this.pwResetToken = token || ''
      if (this.pwResetToken) {
        sessionStorage.setItem('pwResetToken', this.pwResetToken)
      } else {
        sessionStorage.removeItem('pwResetToken')
      }
    },

    // 비밀번호 찾기(리셋 토큰 발급)
    async requestPasswordReset(email) {
      const { data } = await http.post('http://localhost:8080/auth/password/find', { email })
      const token = data.resetToken ??  ''

      if (token) this.setPwResetToken(token)
      const ttl = data.expiresInSec ?? undefined

      return { ...data, resetToken: token, expiresInSec: ttl }
    },

    // 비밀번호 찾기: 코드 검증 → pwResetToken 저장
    async verifyPwCode({ email, code }) {
      const { data } = await http.post('http://localhost:8080/auth/password/verify', { email, code })
      const token = data.resetToken
      if (!token) throw new Error('리셋 토큰을 받지 못했습니다.')
      this.setPwResetToken(token)
      const ttl = data.expiresInSec
      return { ...data, pwResetToken: token, pwResetTtlSec: ttl }
    },

    async resetPassword({ resetToken, newPassword }) {
      // 전달 토큰 > 스토어 > 세션 저장소 순으로 사용
      const token = resetToken || this.pwResetToken || sessionStorage.getItem('pwResetToken') || ''

      if (!token) throw new Error('유효한 리셋 토큰이 없습니다. 이메일 링크로 다시 진입해주세요.')
      await http.post('http://localhost:8080/auth/password/reset', { resetToken: token, newPassword },)
      // 사용 후 폐기
      this.setPwResetToken('')
    },
  },
})
