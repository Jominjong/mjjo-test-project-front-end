<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRecipeStore } from '../stores/recipes'
import { useRouter } from 'vue-router'

const store = useRecipeStore()
const router = useRouter()

// 폼 바인딩용
const keyword = ref(store.keyword)
const categoryNo = ref(store.categoryNo)

// 페이지 버튼(최대 5개) 계산
const visiblePages = computed(() => {
  const pages = []
  const total = store.totalPages || 1
  const cur = store.page || 1

  const start = Math.max(1, cur - 2)
  const end = Math.min(total, start + 4)
  const realStart = Math.max(1, end - 4)

  for (let p = realStart; p <= end; p++) pages.push(p)
  return pages
})

onMounted(() => {
  // 첫 진입 기본 조회
  store.fetchList({ page: 1, size: 10 })
})

const goDetail = (boardNo) => {
  router.push({ name: 'recipe-detail', params: { boardNo } })
}

const onSearch = async () => {
  await store.search({ keyword: keyword.value, categoryNo: categoryNo.value })
}
</script>

<template>
  <div style="padding:16px; max-width:920px; margin:auto">
    <h1>Recipes</h1>

    <!-- 검색 바 -->
    <form @submit.prevent="onSearch" style="display:flex; gap:8px; align-items:center; margin:12px 0;">
      <!-- 카테고리는 숫자라고 가정; 실제 값에 맞게 옵션 채우세요 -->
      <select v-model.number="categoryNo">
        <option :value="null">전체 카테고리</option>
        <option :value="1">한식</option>
        <option :value="2">양식</option>
        <option :value="3">중식</option>
        <option :value="4">일식</option>
      </select>

      <input
        v-model.trim="keyword"
        placeholder="제목 검색"
        style="flex:1; padding:6px 8px;"
      />
      <button type="submit">검색</button>
    </form>

    <p v-if="store.loading">Loading...</p>
    <p v-if="store.error" style="color:red">{{ store.error }}</p>

    <!-- 목록 -->
    <ul v-if="!store.loading && !store.error">
      <li
        v-for="r in store.list"
        :key="r.boardNo ?? r.id"
        style="cursor:pointer; margin:6px 0"
        @click="goDetail(r.boardNo ?? r.id)"
      >
        {{ r.title ?? r.boardTitle ?? r.name }}
        <small> #{{ r.boardNo ?? r.id }} / 카테고리: {{ r.categoryNo ?? r.cgNo }} / 작성자: {{ r.userNo }}</small>
      </li>
      <li v-if="store.list.length === 0" style="color:#666">검색 결과가 없습니다.</li>
    </ul>

    <!-- 페이지네이션 -->
    <div v-if="store.totalPages > 1" style="display:flex; gap:6px; margin-top:12px; align-items:center;">
      <button :disabled="store.page === 1" @click="store.goTo(1)">« 처음</button>
      <button :disabled="!store.hasPrev" @click="store.prev">‹ 이전</button>

      <button
        v-for="p in visiblePages"
        :key="p"
        @click="store.goTo(p)"
        :disabled="p === store.page"
        :style="p === store.page ? 'font-weight:bold; text-decoration:underline' : ''"
      >
        {{ p }}
      </button>

      <button :disabled="!store.hasNext" @click="store.next">다음 ›</button>
      <button :disabled="store.page === store.totalPages" @click="store.goTo(store.totalPages)">마지막 »</button>

      <span style="margin-left:8px; color:#666">
        총 {{ store.total }}건 / {{ store.page }} / {{ store.totalPages }} 페이지
      </span>
    </div>
  </div>
</template>

<!-- 
<script setup>
import { onMounted } from 'vue'
import { useRecipeStore } from '../stores/recipes'
import { useRouter } from 'vue-router'

const store = useRecipeStore()
const router = useRouter()

onMounted(() => {
  store.fetchList({ page: 1, size: 10 })
})

const goDetail = (boardNo) => {
  router.push({ name: 'recipe-detail', params: { boardNo } })
}
</script>

<template>
  <div style="padding:16px">
    <h1>Recipes</h1>

    <p v-if="store.loading">Loading...</p>
    <p v-if="store.error" style="color:red">{{ store.error }}</p>

    <ul v-if="!store.loading">
      <li
        v-for="r in store.list"
        :key="r.boardNo ?? r.id"
        style="cursor:pointer; margin:6px 0"
        @click="goDetail(r.boardNo ?? r.id)"
      >
        {{ r.title ?? r.boardTitle ?? r.name }} (#{{ r.boardNo ?? r.id }})
      </li>
    </ul>
  </div>
</template> -->
