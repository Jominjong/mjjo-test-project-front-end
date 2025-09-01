<!-- HomeView.vue (기존 파일 대체) -->
<script setup>
import { onMounted, ref } from 'vue'
import { useRecipeStore } from '../stores/recipes'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

import RecipeList from '../components/Home/RecipeList.vue'
import Pagination from '../components/Home/Pagination.vue'
import Loding from '../components/Home/Loding.vue'
import AuthErro from '../components/Home/AuthErro.vue'

const auth = useAuthStore()
const router = useRouter()
const doLogout = () => { auth.logout(); router.push({ name: 'login' }) }

const store = useRecipeStore()
const keyword = ref(store.keyword)
const categoryNo = ref(store.categoryNo)

onMounted(() => {
  store.fetchList({ page: 1, size: 11 })
})

const goDetail = (boardNo) => {
  router.push({ name: 'recipe-detail', params: { boardNo } })
}

const onSearch = async () => {
  await store.search({ keyword: keyword.value, categoryNo: categoryNo.value })
}
</script>

<template>
  <section class="min-h-screen w-full gradient-bg">

    <!-- 로딩 처리 -->
    <Loding />

    <!-- 인증에러 처리 -->
    <AuthErro />

    <div class="mx-auto max-w-8xl px-4 py-8 lg:py-12 grid grid-cols-1 lg:grid-cols-[20rem_minmax(0,1fr)] gap-6">
      <!-- Sidebar -->
      <aside class="glass rounded-3xl p-6 sticky top-6 h-min">
        <div class="mb-6">
          <div class="text-4xl font-black leading-none">
            <span class="gradient-text">Cookhub</span>
          </div>
          <p class="mt-2 text-sm text-slate-600">나만의 레시피를 모으는 가장 쉬운 방법</p>
        </div>

        <div class="card mb-6">
          <div v-if="auth.isAuthed" class="mb-3">
            <p class="text-sm text-slate-500">환영합니다!</p>
            <p class="text-lg font-semibold">{{ auth.user?.name }}님</p>
          </div>
          <button @click="doLogout" class="btn-outline w-full">로그아웃</button>
        </div>

        <nav class="space-y-2">
          <router-link class="btn-ghost w-full border-1 border-slate-300 " :to="{ name: 'recipe-new' }">📒 내 레시피 추가</router-link>
        </nav>
      </aside>

      <!-- Main -->
      <main class="space-y-6">
        <div class="glass rounded-3xl p-4 lg:p-6">
          <RecipeList
            v-if="!store.loading && !store.error"
            :items="store.list"
            @select="goDetail"
          />
          <div v-else class="p-10 text-center text-slate-500">불러오는 중…</div>
        </div>

        <div class="glass rounded-3xl p-3 lg:p-4 flex items-center justify-center">
          <Pagination
            :page="store.page"
            :total-pages="store.totalPages"
            :has-prev="store.hasPrev"
            :has-next="store.hasNext"
            :total="store.total"
            @first="() => store.goTo(1)"
            @prev="store.prev"
            @go="(p) => store.goTo(p)"
            @next="store.next"
            @last="() => store.goTo(store.totalPages)"
          />
        </div>
      </main>
    </div>
  </section>
</template>
