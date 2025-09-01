<script setup>
import { ref, computed, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

// 3-step: 1) 이메일, 2) 코드 인증, 3) 새 비밀번호
const step = ref(1)

const email = ref(String(route.query.email || ''))
const code = ref('')
const pw = ref('')
const pw2 = ref('')
const loading = ref(false)
const err = ref('')
const notice = ref('')

// 타이머(유효시간, 재발송 쿨다운)
const ttlLeftSec = ref(0)
const cooldownLeftSec = ref(0)
let ttlTimer
let cooldownTimer

const fmt = (sec) => {
  const m = Math.floor(Math.max(0, sec) / 60)
  const s = Math.max(0, sec) % 60
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}
const startTtl = (sec) => {
  stopTtl()
  ttlLeftSec.value = sec | 0
  ttlTimer = window.setInterval(() => {
    ttlLeftSec.value = Math.max(0, ttlLeftSec.value - 1)
    if (ttlLeftSec.value <= 0) stopTtl()
  }, 1000)
}
const stopTtl = () => { if (ttlTimer) { clearInterval(ttlTimer); ttlTimer = undefined } }

const startCooldown = (sec) => {
  stopCooldown()
  cooldownLeftSec.value = sec | 0
  if (cooldownLeftSec.value <= 0) return
  cooldownTimer = window.setInterval(() => {
    cooldownLeftSec.value = Math.max(0, cooldownLeftSec.value - 1)
    if (cooldownLeftSec.value <= 0) stopCooldown()
  }, 1000)
}
const stopCooldown = () => { if (cooldownTimer) { clearInterval(cooldownTimer); cooldownTimer = undefined } }

onUnmounted(() => { stopTtl(); stopCooldown() })

// 상태
const isCodeExpired = computed(() => ttlLeftSec.value <= 0)
const canResend = computed(() => step.value === 2 && cooldownLeftSec.value <= 0 && !loading.value)
const pwMismatch = computed(() => pw.value && pw2.value && pw.value !== pw2.value)
const progress = computed(() => (step.value === 1 ? '33%' : step.value === 2 ? '66%' : '100%'))

// 숫자 6자리만
const onCodeInput = (e) => {
  const t = e.target
  code.value = String(t.value || '').replace(/\D/g, '').slice(0, 6)
}

// 1) 이메일 → 코드 발송
const checkEmail = async () => {
  err.value = ''; notice.value = ''
  if (!email.value) { err.value = '이메일을 입력해주세요.'; return }
  loading.value = true
  try {
    const data = await auth.requestPasswordReset(email.value)
    // 운영 환경: 토큰 없이 메일만 발송 → step=2로 이동해 코드 입력
    step.value = 2
    notice.value = '인증코드를 이메일로 전송했습니다.'
    startTtl(Number(data.codeTtlSec || 600))
    startCooldown(Number(data.cooldownRemainSec || 60))
  } catch (e) {
    err.value = e?.response?.data?.message || String(e)
  } finally {
    loading.value = false
  }
}

// 2) 코드 인증 → pwResetToken 저장
const verifyCode = async () => {
  err.value = ''; notice.value = ''
  if (code.value.length !== 6) { err.value = '6자리 코드를 입력해주세요.'; return }
  if (isCodeExpired.value) { err.value = '코드 유효시간이 만료되었습니다. 재전송 해주세요.'; return }
  loading.value = true
  try {
    await auth.verifyPwCode({ email: email.value, code: code.value })
    stopTtl()
    step.value = 3
    notice.value = '코드 인증 완료! 새 비밀번호를 설정해 주세요.'
  } catch (e) {
    err.value = e?.response?.data?.message || '코드가 틀렸습니다.'
  } finally {
    loading.value = false
  }
}

// 재전송
const resendCode = async () => {
  if (!canResend.value) return
  await checkEmail()
  if (!err.value) notice.value = '인증코드를 다시 전송했습니다.'
}

// 3) 최종 변경
const doReset = async () => {
  err.value = ''; notice.value = ''
  if (!pw.value || pw.value.length < 4) { err.value = '비밀번호는 4자 이상이어야 합니다.'; return }
  if (pwMismatch.value) { err.value = '비밀번호가 서로 다릅니다.'; return }
  loading.value = true
  try {
    await auth.resetPassword({ newPassword: pw.value }) // 토큰은 스토어에서 자동 적용
    notice.value = '비밀번호가 변경되었습니다. 로그인 페이지로 이동합니다.'
    await router.replace({ name: 'login', query: { email: email.value } })
  } catch (e) {
    err.value = e?.response?.data?.message || '비밀번호 변경에 실패했습니다.'
  } finally {
    loading.value = false
  }
}

// (옵션) 메일 링크가 ?token=... 으로 들어오면 자동 3단계 지원
watch(() => route.query, (q) => {
  const t = String(q.token || q.resetToken || '')
  if (t) { auth.setPwResetToken(t); step.value = 3 }
})
</script>

<template>
  <section class="min-h-screen gradient-bg">
    <div class="mx-auto max-w-md px-4 py-10">
      <div class="card p-6 md:p-8 space-y-6">
        <!-- 헤더 -->
        <header>
          <h1 class="text-3xl font-black leading-tight">
            <span class="gradient-text">비밀번호 찾기</span>
          </h1>
          <p class="mt-1 text-sm text-slate-600">이메일 인증 후 새 비밀번호를 설정해 주세요.</p>
        </header>

        <!-- 진행도 -->
        <div>
          <div class="relative h-1 w-full rounded-full bg-white/60">
            <div class="absolute left-0 top-0 h-1 rounded-full" style="background-image:linear-gradient(90deg,#6366f1,#06b6d4);" :style="{ width: progress }"></div>
          </div>
          <div class="mt-2 flex justify-between text-[11px] font-bold text-slate-500">
            <span :class="step===1 ? 'text-slate-800' : ''">1. 이메일</span>
            <span :class="step===2 ? 'text-slate-800' : ''">2. 코드 인증</span>
            <span :class="step===3 ? 'text-slate-800' : ''">3. 새 비밀번호</span>
          </div>
        </div>

        <!-- 알림 -->
        <div v-if="err" class="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">{{ err }}</div>
        <div v-if="notice" class="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700" role="status" aria-live="polite">{{ notice }}</div>

        <!-- STEP 1 -->
        <div v-if="step===1" class="space-y-3">
          <label class="block">
            <span class="text-xs font-semibold text-slate-700">이메일</span>
            <input class="input mt-1" type="email" v-model.trim="email" autocomplete="email" placeholder="example@example.com" :disabled="loading" />
          </label>
          <button class="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed" :disabled="loading || !email" @click="checkEmail">
            {{ loading ? '전송 중…' : '코드 발송' }}
          </button>
          <p class="pt-1 text-center text-sm text-slate-600">
            <router-link class="underline underline-offset-2" :to="{ name: 'login', query: { email } }">로그인으로 돌아가기</router-link>
          </p>
        </div>

        <!-- STEP 2 -->
        <div v-else-if="step===2" class="space-y-3">
          <label class="block">
            <span class="text-xs font-semibold text-slate-700">이메일</span>
            <input class="input mt-1 bg-white/60" type="email" :value="email" disabled />
          </label>

          <label class="block">
            <div class="mb-1 flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-700">인증코드 (6자리)</span>
              <span class="text-xs" :class="ttlLeftSec>0 ? 'text-slate-500':'text-red-600'">
                {{ ttlLeftSec>0 ? `유효시간 ${fmt(ttlLeftSec)}` : '만료됨' }}
              </span>
            </div>
            <input class="input mt-1 text-center tracking-[0.3em] text-lg" type="text" inputmode="numeric" autocomplete="one-time-code" :disabled="loading" :value="code" maxlength="6" @input="onCodeInput" />
          </label>

          <div class="flex gap-2">
            <button class="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="loading || code.length!==6 || isCodeExpired" @click="verifyCode">인증하기</button>
            <button class="btn-outline disabled:opacity-50 disabled:cursor-not-allowed" :disabled="!canResend" @click="resendCode">
              코드 재전송<span v-if="cooldownLeftSec>0" class="ml-1 text-xs text-slate-500">{{ fmt(cooldownLeftSec) }}</span>
            </button>
          </div>

          <button class="btn-ghost w-full text-sm" :disabled="loading" @click="step=1">이메일 변경하기</button>
        </div>

        <!-- STEP 3 -->
        <div v-else class="space-y-3">
          <label class="block">
            <span class="text-xs font-semibold text-slate-700">새 비밀번호</span>
            <input class="input mt-1" type="password" v-model="pw" autocomplete="new-password" placeholder="4자리 이상" :disabled="loading" />
          </label>

          <label class="block">
            <div class="mb-1 flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-700">비밀번호 확인</span>
              <span v-if="pwMismatch" class="text-xs text-red-600">비밀번호가 서로 다릅니다.</span>
            </div>
            <input class="input mt-1" type="password" v-model="pw2" autocomplete="new-password" :disabled="loading" />
          </label>

          <button class="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed" :disabled="loading || !pw || !pw2 || pwMismatch" @click="doReset">
            {{ loading ? '변경 중…' : '비밀번호 변경' }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
