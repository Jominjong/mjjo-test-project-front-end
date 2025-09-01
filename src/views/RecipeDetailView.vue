<script setup>
import { onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRecipeStore } from '../stores/recipes'
import AuthErro from '../components/Home/AuthErro.vue'
import Loding from '../components/Home/Loding.vue'


const router = useRouter()
const route = useRoute()
const store = useRecipeStore()

onMounted(() => {
  store.fetchDetail(route.params.boardNo)
})

const goHome = () => router.push({ name: 'home' })

// 상세 응답의 필드 이름이 섞여 들어와도 안전하게 매핑
const rec = computed(() => {
  const r = store.selected || {}
  return {
    id: r.boardNo ?? r.id ?? r.no ?? r.board_id ?? null,
    title: r.boardTitle ?? r.title ?? r.name ?? '',
    content: r.boardContent ?? r.content ?? r.body ?? r.boardCon ?? '',
    categoryNo: r.categoryNo ?? r.cgNo ?? r.category ?? null,
    createdAt: r.createdAt ?? r.created_at ?? r.createdDate ?? r.created ?? null,
    updatedAt: r.updatedAt ?? r.updated_at ?? null,
    ingredients: r.ingredients ?? r.ingredientList ?? [],
  }
})

const cat = computed(() => {
  const map = {
    1: { label: '한식',   cls: 'badge badge-kor' },
    2: { label: '양식',   cls: 'badge badge-west' },
    3: { label: '중식',   cls: 'badge badge-ch' },
    4: { label: '일식',   cls: 'badge badge-jp' },
    5: { label: '디저트', cls: 'badge badge-dessert' },
  }
  const k = Number(rec.value.categoryNo)
  return map[k] ?? { label: rec.value.categoryNo ?? '카테고리', cls: 'badge badge-kor' }
})

// yyyy-mm-dd 포맷
const fmtDate = (v) => {
  if (!v) return ''
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return v.slice(0, 10)
  const d = new Date(v)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
const boardNo = computed(() => Number(route.params.boardNo))
async function handleDelete() {
  if (!boardNo.value) return
  if (!confirm('정말 삭제하시겠어요?')) return
  try {
    await store.deleteRecipe(boardNo.value)
    await router.replace({ name: 'home' })
  } catch (e) {}
}
</script>

<template>
  <section class="min-h-screen w-full gradient-bg">
    <!-- 로딩 처리 -->
    <Loding />

    <!-- 인증에러 처리 -->
    <AuthErro />

    <div class="mx-auto max-w-5xl px-4 py-8 lg:py-12 space-y-6">
      <!-- 헤더 + 액션 -->
      <div class="flex items-center justify-between">
        <h1 class="text-3xl font-black leading-tight">
          <span class="gradient-text">Recipe Detail</span>
        </h1>
        <div class="flex gap-2">
          <button class="btn-outline" @click="goHome">← 목록으로</button>
          <router-link class="btn text-white bg-blue-500/70 hover:bg-blue-400/70" :to="{ name: 'recipe-edit', params: { boardNo: $route.params.boardNo } }">✏️ 수정</router-link>

          <button class="btn text-white bg-rose-500/80 hover:bg-rose-400/80 disabled:opacity-50 disabled:cursor-not-allowed" 
            @click="handleDelete" :disabled="store.saving" title="삭제하기">🗑 삭제
          </button>
        </div>
      </div>
      <div
        v-if="store.selected"
        class="glass rounded-3xl p-5 md:p-6 flex flex-col gap-4"
      >
        <!-- 타이틀 + 배지 -->
        <div class="flex flex-wrap items-center gap-3">
          <span class="badge bg-slate-800/80">#{{ rec.id }}</span>
          <span :class="cat.cls">{{ cat.label }}</span>
        </div>
        <h2 class="text-2xl md:text-3xl font-extrabold leading-tight">
          {{ rec.title || '제목 없음' }}
        </h2>

        <!-- 작성일/ 수정일 -->
        <div class="flex flex-wrap items-center gap-4 text-sm text-slate-600">
          <div class="inline-flex items-center gap-2">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path d="M8 7V3m8 4V3M4 11h16M7 20h10a3 3 0 0 0 3-3V8H4v9a3 3 0 0 0 3 3Z"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>작성: {{ fmtDate(rec.createdAt) }}</span>
          </div>

          <div v-if="rec.updatedAt" class="inline-flex items-center gap-2">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path d="M21 12a9 9 0 1 1-9-9v4" 
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>{{ fmtDate(rec.updatedAt) }}</span>
          </div>
        </div>
      </div>

      <!-- 로딩 -->
      <div v-if="store.loading" class="glass rounded-3xl p-6 animate-pulse">
        <div class="h-6 w-2/5 rounded bg-white/70 mb-4"></div>
        <div class="space-y-3">
          <div class="h-5 w-3/4 rounded bg-white/70"></div>
          <div class="h-5 w-2/4 rounded bg-white/70"></div>
          <div class="h-32 w-full rounded bg-white/70"></div>
        </div>
      </div>

      <!-- 에러 -->
      <div v-else-if="store.error" class="glass rounded-3xl p-6 border border-red-300 text-red-700">
        {{ store.error }}
      </div>

      <!-- 본문 -->
      <div v-else-if="store.selected" class="space-y-6">
        <!-- 내용 -->
        <article class="card">
          <div class="prose max-w-none text-slate-700 whitespace-pre-wrap">
            {{ rec.content || '내용이 없습니다.' }}
          </div>
        </article>

        <!-- 재료 -->
        <section v-if="rec.ingredients?.length" class="card">
          <h3 class="text-lg font-bold mb-3">재료</h3>
          <ul class="flex flex-wrap gap-2">
            <li
              v-for="(ing, i) in rec.ingredients"
              :key="i"
              class="badge bg-slate-800/80 text-white/90"
            >
              <template v-if="typeof ing === 'string'">
                {{ ing }}
              </template>
              <template v-else>
                {{ ing.name ?? ing.ingredient ?? '재료' }}
                <span v-if="ing.amount"> · {{ ing.amount }}</span>
              </template>
            </li>
          </ul>
        </section>
      </div>

      <!-- 데이터 없음 -->
      <div v-else class="glass rounded-3xl p-6 text-center text-slate-500">
        데이터가 없습니다.
      </div>
    </div>
  </section>
</template>