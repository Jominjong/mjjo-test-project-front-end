<script setup>
import LoginForm from '../components/Login/LoginForm.vue'
</script>

<template>
  <section class="min-h-screen w-full gradient-bg grid place-items-center px-4">
    <div class="glass rounded-3xl w-full max-w-md p-6 md:p-8">
      <header class="mb-6 text-center">
        <h1 class="text-3xl font-black leading-tight">
          <span class="gradient-text">로그인</span>
        </h1>
        <p class="mt-1 text-sm text-slate-600">Cookhub에 다시 오신 걸 환영해요!</p>
      </header>
      
      <LoginForm />
    </div>
  </section>
</template>
