<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'

const resetToken = ref('')
const newPassword = ref('')
const loading = ref(false)
const msg = ref('')
const err = ref('')

const auth = useAuthStore()

const onSubmit = async () => {
  loading.value = true; err.value=''; msg.value=''
  try {
    if (!resetToken.value) throw new Error('리셋 토큰을 입력하세요')
    await auth.resetPassword({ resetToken: resetToken.value, newPassword: newPassword.value })
    msg.value = '비밀번호가 변경되었습니다. 로그인 해주세요.'
  } catch (e) {
    err.value = e.response?.data?.message || e.message || '리셋 실패'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div style="padding:16px; max-width:420px; margin:auto">
    <h2>비밀번호 재설정</h2>
    <p v-if="msg" style="color:green">{{ msg }}</p>
    <p v-if="err" style="color:red">{{ err }}</p>
    <form @submit.prevent="onSubmit">
      <input v-model="resetToken" placeholder="리셋 토큰" style="display:block; width:100%; margin:8px 0" />
      <input v-model="newPassword" placeholder="새 비밀번호" type="password" required style="display:block; width:100%; margin:8px 0" />
      <button :disabled="loading" type="submit">변경</button>
    </form>
  </div>
</template>
