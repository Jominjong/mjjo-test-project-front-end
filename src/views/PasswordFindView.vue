<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'

const email = ref('')
const loading = ref(false)
const msg = ref('')
const err = ref('')
const resetToken = ref('') // 테스트용(메일 발송대신 토큰을 응답으로 주는 서버 대비)

const auth = useAuthStore()

const onSubmit = async () => {
  loading.value = true; err.value = ''; msg.value = ''; resetToken.value = ''
  try {
    const data = await auth.requestPasswordReset(email.value)
    msg.value = '비밀번호 리셋 안내를 전송했습니다.'
    if (data?.resetToken) {
      resetToken.value = data.resetToken // 개발/테스트 편의를 위해 보여줌
    }
  } catch (e) {
    err.value = e.response?.data?.message || '요청 실패'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div style="padding:16px; max-width:420px; margin:auto">
    <h2>비밀번호 찾기</h2>
    <p v-if="msg" style="color:green">{{ msg }}</p>
    <p v-if="err" style="color:red">{{ err }}</p>

    <form @submit.prevent="onSubmit">
      <input v-model="email" placeholder="이메일" type="email" required style="display:block; width:100%; margin:8px 0" />
      <button :disabled="loading" type="submit">리셋 메일 보내기</button>
    </form>

    <div v-if="resetToken" style="margin-top:12px">
      <div><b>개발용 리셋 토큰</b></div>
      <textarea :value="resetToken" rows="4" style="width:100%"></textarea>
      <p style="font-size:12px">테스트 시 이 토큰으로 /password/reset 화면에서 비밀번호 변경하세요.</p>
    </div>
  </div>
</template>
