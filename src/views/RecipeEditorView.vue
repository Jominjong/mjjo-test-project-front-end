<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRecipeStore } from '../stores/recipes'
import RecipeForm from '../components/Recipe/RecipeForm.vue'

const route = useRoute()
const router = useRouter()
const store = useRecipeStore()

const boardNo = computed(() => Number(route.params.boardNo))
const isEdit = computed(() => route.name === 'recipe-edit' && !Number.isNaN(boardNo.value))

const loading = ref(false)
const err = ref('')

onMounted(async () => {
  if (isEdit.value) {
    loading.value = true
    err.value = ''
    try {
      await store.fetchDetail(boardNo.value)
    } catch (e) {
      err.value = store.error || String(e)
    } finally {
      loading.value = false
    }
  }
})

async function handleSubmit(form) {
  try {
    if (isEdit.value) {
      const res = await store.updateRecipe(boardNo.value, form)
      await router.replace({ name: 'recipe-detail', params: { boardNo: res?.boardNo ?? boardNo.value } })
    } else {
      await store.createRecipe(form)
      await router.replace({ name: 'home' })
    }
  } catch (e) {
    // 필요시 err.value = store.error || String(e)
  }
}

async function handleCancel() {
  if (isEdit.value) {
    await router.replace({ name: 'recipe-detail', params: { boardNo: boardNo.value } })
  } else {
    await router.replace({ name: 'home' })
  }
}

async function handleDelete() {
  if (!isEdit.value) return
  if (!confirm('정말 삭제하시겠어요?')) return
  try {
    await store.deleteRecipe(boardNo.value)
    await router.replace({ name: 'home' })
  } catch (e) {}
}

const pageTitle = computed(() => (isEdit.value ? '레시피 수정' : '레시피 작성'))
</script>

<template>
  <section class="min-h-screen gradient-bg">
    <div class="mx-auto max-w-3xl px-4 py-8">
      <div class="card p-6 md:p-8 space-y-6">
        <!-- 헤더 -->
        <header class="flex items-center justify-between">
          <h1 class="text-3xl font-black leading-tight">
            <span class="gradient-text">{{ pageTitle }}</span>
          </h1>
          <div class="flex flex-row gap-2">
            <!-- 목록으로 -->
            <div class="flex gap-2">
              <button class="btn-outline" @click="handleCancel">← 목록으로</button>
            </div>

            <!-- 삭제 -->
            <div v-if="isEdit" class="flex justify-end">
              <button
                class="btn-outline border-red-300 text-red-600"
                @click="handleDelete"
                :disabled="store.saving"
                title="삭제하기"
              >
                삭제하기
              </button>
            </div>
          </div>
        </header>

        <!-- 에러 -->
        <div v-if="err" class="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {{ err }}
        </div>

        <!-- 로딩 스켈레톤 -->
        <div v-if="loading" class="animate-pulse space-y-4">
          <div class="h-5 w-2/5 rounded bg-white/70"></div>
          <div class="h-10 w-full rounded bg-white/70"></div>
          <div class="h-5 w-1/5 rounded bg-white/70"></div>
          <div class="h-40 w-full rounded bg-white/70"></div>
          <div class="h-5 w-1/5 rounded bg-white/70"></div>
          <div class="h-10 w-full rounded bg-white/70"></div>
        </div>

        <!-- 폼 -->
        <RecipeForm
          v-else
          :mode="isEdit ? 'edit' : 'create'"
          :initial="isEdit ? (store.selected || {}) : {}"
          :saving="store.saving"
          @submit="handleSubmit"
          @cancel="handleCancel"
        />

        <!-- 스토어 에러 -->
        <p v-if="store.error" class="text-sm text-red-600">{{ store.error }}</p>
      </div>
    </div>
  </section>
</template>
