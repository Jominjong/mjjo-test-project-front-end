<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const email = ref('')
const password = ref('')
const showPw = ref(false)
const loading = ref(false)
const err = ref('')

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

onMounted(() => {
  const qEmail = String(route.query.email || '')
  if (qEmail) email.value = qEmail
})

const onSubmit = async () => {
  loading.value = true; err.value = ''
  try {
    await auth.login({ email: email.value, password: password.value })
    const redirect = route.query.redirect || '/'
    router.replace(redirect)
  } catch (e) {
    err.value = e?.response?.data?.message || '로그인 실패'
  } finally {
    loading.value = false
  }
}

const canSubmit = computed(() => !!email.value && !!password.value && !loading.value)
</script>

<template>
  <form @submit.prevent="onSubmit" class="space-y-4">
    <!-- 에러 메시지 -->
    <p v-if="err" class="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
      {{ err }}
    </p>

    <!-- 이메일 -->
    <label class="block">
      <span class="text-xs font-semibold text-slate-700">이메일</span>
      <input
        class="input mt-1 text-slate-500"
        type="email"
        v-model.trim="email"
        autocomplete="email"
        placeholder="example@example.com"
        :disabled="loading"
        required
      />
    </label>

    <!-- 비밀번호 + 토글 -->
    <label class="block">
      <div class="mb-1 flex items-center justify-between">
        <span class="text-xs font-semibold text-slate-700">비밀번호</span>
        <button
          type="button"
          class="text-xs text-slate-500 hover:underline"
          @click="showPw = !showPw"
        >
          {{ showPw ? '숨기기' : '표시' }}
        </button>
      </div>

      <div class="relative">
        <input class="input pr-10 text-slate-500"
          :type="showPw ? 'text' : 'password'"
          v-model="password"
          autocomplete="current-password"
          placeholder="••••••••"
          :disabled="loading"
          required
        />
        <!-- 작은 눈 아이콘 -->
        <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer"
          :aria-pressed="showPw" :aria-label="showPw ? '비밀번호 숨기기' : '비밀번호 표시'" :title="showPw ? '비밀번호 숨기기' : '비밀번호 표시'" :disabled="loading" @click="showPw = !showPw">          <!-- 눈 아이콘: show/hide에 따라 교체 -->
          <svg v-if="!showPw" class="h-5 w-5 text-slate-500" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
          </svg>
          <!-- 눈 감김 아이콘 -->
          <svg v-else class="h-5 w-5 text-slate-500" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 3l18 18M2.5 12s3.5-7 9.5-7c2.1 0 3.9.6 5.3 1.4M21.5 12s-3.5 7-9.5 7c-2.1 0-3.9-.6-5.3-1.4"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9.9 9.9A3 3 0 0012 15a3 3 0 002.1-.9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </label>

    <!-- 제출 -->
    <button
      class="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      type="submit"
      :disabled="!canSubmit"
    >
      <span v-if="!loading">로그인</span>
      <span v-else class="inline-flex items-center gap-2">
        <span class="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent"></span>
        로그인 중…
      </span>
    </button>

    <!-- 하단 링크 -->
    <div class="pt-1 text-center text-sm text-slate-600">
      <router-link class="underline underline-offset-2" to="/register">회원가입</router-link>
      <span class="mx-2 text-slate-400">|</span>
      <router-link class="underline underline-offset-2" to="/auth/password/find">비밀번호 찾기</router-link>
    </div>
  </form>
</template>
