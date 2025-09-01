<script setup>
  import { useRecipeStore } from '../../stores/recipes'

  const store = useRecipeStore()
</script>

<template>
  <!-- 로딩 모달 -->
  <teleport to="body">
    <div v-if="store.loading" class="fixed inset-0 z-[9999] flex items-center justify-center">
      <div class="absolute inset-0 bg-black/30 backdrop-blur-xs"></div>
      <div class="relative bg-white rounded-xl shadow-lg w-[90%] max-w-sm p-6 text-center">
        <div class="mx-auto mb-3 h-10 w-10 rounded-full border-4 border-gray-300 border-t-transparent animate-spin"></div>
        <p class="text-gray-700 font-semibold">Loading…</p>
      </div>
    </div>
  </teleport>
</template>