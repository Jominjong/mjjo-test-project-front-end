<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// 3-step: 1) 이메일, 2) 코드 인증, 3) 정보 입력
const step = ref<1 | 2 | 3>(1)

const email = ref('')
const emailDisabled = ref(false)

const code = ref('')
const codeDisabled = ref(false)

const name = ref('')
const pw = ref('')
const pw2 = ref('')

const loading = ref(false)
const err = ref('')
const notice = ref('')

// 타이머(유효시간, 재발송 쿨다운)
const ttlLeftSec = ref(0)
const cooldownLeftSec = ref(0)
let ttlTimer: number | undefined
let cooldownTimer: number | undefined

const router = useRouter()
const auth = useAuthStore()

const fmt = (sec: number) => {
  const m = Math.floor(Math.max(0, sec) / 60)
  const s = Math.max(0, sec) % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const startTtl = (sec: number) => {
  stopTtl()
  ttlLeftSec.value = sec | 0
  ttlTimer = window.setInterval(() => {
    ttlLeftSec.value = Math.max(0, ttlLeftSec.value - 1)
    if (ttlLeftSec.value <= 0) stopTtl()
  }, 1000)
}
const stopTtl = () => {
  if (ttlTimer) {
    clearInterval(ttlTimer)
    ttlTimer = undefined
  }
}

const startCooldown = (sec: number) => {
  stopCooldown()
  cooldownLeftSec.value = sec | 0
  if (cooldownLeftSec.value <= 0) return
  cooldownTimer = window.setInterval(() => {
    cooldownLeftSec.value = Math.max(0, cooldownLeftSec.value - 1)
    if (cooldownLeftSec.value <= 0) stopCooldown()
  }, 1000)
}
const stopCooldown = () => {
  if (cooldownTimer) {
    clearInterval(cooldownTimer)
    cooldownTimer = undefined
  }
}

onUnmounted(() => {
  stopTtl()
  stopCooldown()
})

const isCodeExpired = computed(() => ttlLeftSec.value <= 0)
const canResend = computed(() => step.value === 2 && cooldownLeftSec.value <= 0 && !loading.value)
const pwMismatch = computed(() => pw.value && pw2.value && pw.value !== pw2.value)

// 숫자 6자리만
const onCodeInput = (e: Event) => {
  const t = e.target as HTMLInputElement
  code.value = t.value.replace(/\D/g, '').slice(0, 6)
}

const resetAll = () => {
  step.value = 1
  emailDisabled.value = false
  codeDisabled.value = false
  email.value = ''
  code.value = ''
  name.value = ''
  pw.value = ''
  pw2.value = ''
  err.value = ''
  notice.value = ''
  stopTtl(); ttlLeftSec.value = 0
  stopCooldown(); cooldownLeftSec.value = 0
}

const checkEmail = async () => {
  err.value = ''
  notice.value = ''
  if (!email.value) { err.value = '이메일을 입력해주세요.'; return }
  loading.value = true
  try {
    const data = await auth.checkEmail(email.value)
    if (!data.available) {
      err.value = '이미 사용중인 이메일입니다.'
      return
    }
    if (data.codeSent) {
      emailDisabled.value = true
      step.value = 2
      notice.value = '인증코드를 이메일로 전송했습니다.'
      startTtl(Number(data.codeTtlSec || 600))
      startCooldown(Number(data.cooldownRemainSec || 60))
    } else {
      const remain = Number(data.cooldownRemainSec || 0)
      if (remain > 0) {
        startCooldown(remain)
        err.value = `잠시 후 다시 시도해주세요. (남은 시간 ${fmt(remain)})`
      } else {
        err.value = '코드 발송에 실패했습니다.'
      }
    }
  } catch (e: any) {
    err.value = e?.response?.data?.message || String(e)
  } finally {
    loading.value = false
  }
}

const resendCode = async () => {
  if (!canResend.value) return
  await checkEmail() // 동일 이메일로 재호출
  if (!err.value) notice.value = '인증코드를 다시 전송했습니다.'
}

const verifyCode = async () => {
  err.value = ''
  notice.value = ''
  if (code.value.length !== 6) { err.value = '6자리 코드를 입력해주세요.'; return }
  if (isCodeExpired.value) { err.value = '코드 유효시간이 만료되었습니다. 재전송 해주세요.'; return }
  loading.value = true
  try {
    await auth.verifySignup({ email: email.value, code: code.value })
    codeDisabled.value = true
    stopTtl()
    step.value = 3
    notice.value = '이메일 인증이 완료되었습니다. 정보를 입력해주세요.'
  } catch (e: any) {
    err.value = e?.response?.data?.message || '코드가 틀렸습니다.'
  } finally {
    loading.value = false
  }
}

const doRegister = async () => {
  err.value = ''
  notice.value = ''
  if (!name.value) { err.value = '이름을 입력해주세요.'; return }
  if (!pw.value || pw.value.length < 4) { err.value = '비밀번호는 4자 이상이어야 합니다.'; return }
  if (pwMismatch.value) { err.value = '비밀번호가 서로 다릅니다.'; return }
  loading.value = true
  try {
    await auth.registerWithSignup({ email: email.value, password: pw.value, name: name.value })
    notice.value = '회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.'
    setTimeout(() => router.push({ name: 'login', query: { email: email.value } }), 600)
  } catch (e: any) {
    err.value = e?.response?.data?.message || '회원가입에 실패했습니다.'
  } finally {
    loading.value = false
  }
}

</script>
<template>
  <section class="min-h-screen gradient-bg">
    <div class="mx-auto max-w-md px-4 py-10">
      <div class="card p-6 md:p-8">

        <!-- 헤더 -->
        <header class="mb-6">
          <h1 class="text-3xl font-black leading-tight">
            <span class="gradient-text">회원가입</span>
          </h1>
          <p class="mt-1 text-sm text-slate-600">이메일 인증 후 정보를 입력해 주세요.</p>
        </header>

        <!-- 스텝 진행도 -->
        <div class="mb-5">
          <div class="relative h-1 w-full rounded-full bg-white/60">
            <div class="absolute left-0 top-0 h-1 rounded-full"
              style="background-image: linear-gradient(90deg,#6366f1,#06b6d4);"
              :style="{ width: progress }">
            </div>
          </div>
          <div class="mt-2 flex justify-between text-[11px] font-bold text-slate-500">
            <span :class="step === 1 ? 'text-slate-800' : ''">1. 이메일</span>
            <span :class="step === 2 ? 'text-slate-800' : ''">2. 코드 인증</span>
            <span :class="step === 3 ? 'text-slate-800' : ''">3. 정보 입력</span>
          </div>
        </div>

        <!-- 공통 알림 -->
        <div v-if="err" class="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">
          {{ err }}
        </div>
        <div v-if="notice" class="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700" role="status" aria-live="polite">
          {{ notice }}
        </div>

        <transition name="fade" mode="out-in">
          <div :key="step" class="space-y-4">
            <!-- STEP 1: 이메일 입력 -->
            <div v-if="step === 1" class="space-y-3">

              <label class="block">
                <span class="text-xs font-semibold text-slate-700">이메일 입력</span>
                <input class="input mt-1 text-md" type="email" v-model.trim="email" :disabled="emailDisabled || loading"
                  placeholder="example@example.com" autocomplete="email"/>
              </label>

              <button class="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="loading || !email" @click="checkEmail"> 중복확인 & 코드 발송</button>
            </div>

            <!-- STEP 2: 코드 인증 -->
            <div v-else-if="step === 2" class="space-y-3">
              <label class="block">
                <span class="text-xs font-semibold text-slate-700">이메일</span>
                <input class="input mt-1 bg-white/60" type="email" v-model="email" disabled />
              </label>

              <label class="block">
                <div class="mb-1 flex items-center justify-between">
                  <span class="text-xs font-semibold text-slate-700">인증코드 (6자리)</span>
                  <span class="text-xs" :class="ttlLeftSec > 0 ? 'text-slate-500' : 'text-red-600'">
                    {{ ttlLeftSec > 0 ? `유효시간 ${fmt(ttlLeftSec)}` : '만료됨' }}
                  </span>
                </div>
                <input
                  class="input mt-1 text-center tracking-[0.3em] text-lg"
                  :class="{ 'bg-white/60': codeDisabled }"
                  type="text"
                  inputmode="numeric"
                  autocomplete="one-time-code"
                  :disabled="codeDisabled || loading"
                  :value="code"
                  maxlength="6"
                  @input="onCodeInput"
                />
              </label>

              <div class="flex gap-2">
                <button class="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="loading || code.length !== 6 || isCodeExpired || codeDisabled" @click="verifyCode">인증하기</button>
                <button class="btn-outline disabled:opacity-50 disabled:cursor-not-allowed" :disabled="!canResend" @click="resendCode">
                  코드 재전송<span v-if="cooldownLeftSec > 0" class="ml-1 text-xs text-slate-500">{{ fmt(cooldownLeftSec) }}</span>
                </button>
              </div>

              <button class="btn-ghost w-full text-sm" :disabled="loading" @click="resetAll">
                이메일 변경하기
              </button>
            </div>

            <!-- STEP 3: 이름/비밀번호 -->
            <div v-else class="space-y-3">
              <label class="block">
                <span class="text-xs font-semibold text-slate-700">이메일</span>
                <input class="input mt-1 bg-white/60" type="email" v-model="email" disabled />
              </label>

              <label class="block">
                <span class="text-xs font-semibold text-slate-700">이름</span>
                <input class="input mt-1" type="text" v-model.trim="name" autocomplete="name" placeholder="홍길동" />
              </label>

              <label class="block">
                <span class="text-xs font-semibold text-slate-700">비밀번호</span>
                <input class="input mt-1" type="password" v-model="pw" autocomplete="new-password" placeholder="4자리 이상 권장" />
                <p class="mt-1 text-xs text-slate-500">영문/숫자/특수문자 조합을 권장합니다.</p>
              </label>

              <label class="block">
                <div class="mb-1 flex items-center justify-between">
                  <span class="text-xs font-semibold text-slate-700">비밀번호 확인</span>
                  <span v-if="pwMismatch" class="text-xs text-red-600">비밀번호가 서로 다릅니다.</span>
                </div>
                <input class="input mt-1" type="password" v-model="pw2" autocomplete="new-password" />
              </label>

              <button class="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="loading || !name || !pw || !pw2 || pwMismatch" @click="doRegister">회원가입 완료</button>
            </div>

            <!-- 로그인으로 돌아가기 -->
            <div class="pt-2 text-center text-sm text-slate-600">
              <button class="underline underline-offset-2" @click="router.push({ name: 'login' })">로그인으로 돌아가기</button>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </section>
</template>


<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>