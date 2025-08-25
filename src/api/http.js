import axios from 'axios'
import router from '../router'
import { useAuthStore } from '../stores/auth'

// 공용 인스턴스
const http = axios.create(({
  // baseURL: 'http://localhost:8080',
  // withCredentials: true, // 쿠키로 RT 쓰는 경우 대비(안 쓰면 놔둬도 무방)
}))

// 요청 인터셉터: access 토큰 자동 첨부
http.interceptors.request.use((config) => {
  const store = useAuthStore()
  const token = store.accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // 비번 리셋 전용 호출에 resetToken을 바디 대신 헤더로 넣고 싶을 때:
  // (이 파일에서는 안 다루고, 서비스단에서 헤더를 넘기게 할 겁니다)
  return config
})

// 응답 인터셉터: 401 → refresh 시도 후 1회 재시도
let refreshing = null
http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error
    if (!response) throw error

    // 이미 재시도한 요청이면 통과
    if (response.status === 401 && !config._retry && !config.url.includes('/auth/refresh')) {
      const store = useAuthStore()

      // 동시에 여러 요청이 401이 나면, refresh가 끝날 때까지 대기
      if (!refreshing) {
        refreshing = store.refresh().finally(() => { refreshing = null })
      }
      const ok = await refreshing
      if (ok) {
        config._retry = true
        // 새 access 토큰으로 재시도
        config.headers.Authorization = `Bearer ${store.accessToken}`
        return http(config)
      }
    }
    throw error
  }
)

export default http
