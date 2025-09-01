<script setup>
import { useRecipeStore } from '../../stores/recipes'
import { useRouter } from 'vue-router'

const router = useRouter()
const store = useRecipeStore()

const goLogin = () => router.push({ name: 'login' })
// const closeError = () => { 
//   // Pinia 상태에 직접 기록
//   try { store.error = '' } catch (_) {}
// }
</script>

<template>
  <!-- 에러 모달 store.error-->
  <teleport to="body">
    <div v-if="store.error" class="fixed inset-0 z-[10000] flex items-center justify-center">
      <div class="absolute inset-0 bg-black/30 backdrop-blur-xs" ></div> <!--@click="closeError" -->
      <div class="relative bg-white rounded-xl shadow-lg w-[90%] max-w-md p-6">
        <h3 class="text-lg font-bold text-red-600 mb-2">오류</h3>
        <p class="text-gray-800 mb-6 whitespace-pre-line">{{ store.error }}</p>
        <div class="flex gap-2 justify-end">
          <!-- <button class="px-4 py-2 rounded-md border" @click="closeError">닫기</button> -->
          <!-- ✅ 로그인 페이지 이동 -->
          <button class="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-800" @click="goLogin">
            로그인 페이지로
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>