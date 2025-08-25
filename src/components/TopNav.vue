<script setup>
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
const auth = useAuthStore()
const router = useRouter()
const doLogout = () => { auth.logout(); router.push({ name: 'login' }) }
</script>

<template>
  <nav style="display:flex; gap:12px; padding:8px; border-bottom:1px solid #eee">
    <router-link to="/">홈</router-link>
    <router-link to="/password/find">비번찾기</router-link>
    <router-link to="/password/reset">비번리셋</router-link>
    <span style="margin-left:auto"></span>
    <template v-if="auth.isAuthed">
      <span>{{ auth.user?.email }}</span>
      <button @click="doLogout">로그아웃</button>
    </template>
    <template v-else>
      <router-link to="/login">로그인</router-link>
      <router-link to="/register">회원가입</router-link>
    </template>
  </nav>
</template>
