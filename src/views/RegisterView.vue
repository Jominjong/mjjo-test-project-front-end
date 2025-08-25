<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const email = ref('')
const name = ref('')
const password = ref('')
const loading = ref(false)
const msg = ref('')
const err = ref('')

const auth = useAuthStore()
const router = useRouter()

const onSubmit = async () => {
  loading.value = true; err.value = ''; msg.value = ''
  try {
    await auth.register({ email: email.value, password: password.value, name: name.value })
    msg.value = '가입이 완료되었습니다. 로그인 해주세요.'
    setTimeout(() => router.push({ name: 'login' }), 800)
  } catch (e) {
    err.value = e.response?.data?.message || '회원가입 실패'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div style="padding:16px; max-width:420px; margin:auto">
    <h2>회원가입</h2>
    <p v-if="msg" style="color:green">{{ msg }}</p>
    <p v-if="err" style="color:red">{{ err }}</p>
    <form @submit.prevent="onSubmit">
      <input v-model="email" placeholder="이메일" type="email" required style="display:block; width:100%; margin:8px 0" />
      <input v-model="name" placeholder="이름" required style="display:block; width:100%; margin:8px 0" />
      <input v-model="password" placeholder="비밀번호" type="password" required style="display:block; width:100%; margin:8px 0" />
      <button :disabled="loading" type="submit">가입</button>
    </form>
  </div>
</template>
