<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const email = ref('')
const password = ref('')
const loading = ref(false)
const err = ref('')

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const onSubmit = async () => {
  loading.value = true; err.value = ''
  try {
    await auth.login({ email: email.value, password: password.value })
    const redirect = route.query.redirect || '/'
    router.replace(redirect)
  } catch (e) {
    err.value = e.response?.data?.message || '로그인 실패'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div style="padding:16px; max-width:420px; margin:auto">
    <h2>로그인</h2>
    <p v-if="err" style="color:red">{{ err }}</p>
    <form @submit.prevent="onSubmit">
      <input v-model="email" placeholder="이메일" type="email" required style="display:block; width:100%; margin:8px 0" />
      <input v-model="password" placeholder="비밀번호" type="password" required style="display:block; width:100%; margin:8px 0" />
      <button :disabled="loading" type="submit">로그인</button>
    </form>

    <div style="margin-top:8px">
      <router-link to="/register">회원가입</router-link>
      &nbsp;|&nbsp;
      <router-link to="/password/find">비밀번호 찾기</router-link>
    </div>
  </div>
</template>
