<!-- src/pages/Home.vue -->
<!-- <script setup>
import { onMounted } from 'vue'
import { useRecipeStore } from '../stores/recipes'
import { RouterLink } from 'vue-router'

const store = useRecipeStore()

onMounted(async () => {
  store.resetPagination()      // 홈 진입마다 첫 페이지로
  await store.fetchList()      // 전체 목록 1페이지
})
</script>

<template>
  <div style="padding:16px">
    <h1>전체 레시피</h1>

    <p v-if="store.loading">Loading...</p>
    <p v-else-if="store.error" style="color:red">{{ store.error }}</p>

    <ul v-else>
      <li v-for="it in store.list" :key="it.boardNo">
        <RouterLink :to="`/recipes/${it.boardNo}`">{{ it.title }}</RouterLink>
        <small> (카테고리: {{ it.categoryNo }}, 작성자: {{ it.userNo }})</small>
      </li>
    </ul>

    <button v-if="store.hasNext && !store.loading" @click="store.loadNext()">더 보기</button>
  </div>
</template> -->

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
</template>
