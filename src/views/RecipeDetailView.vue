<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useRecipeStore } from '../stores/recipes'

const route = useRoute()
const store = useRecipeStore()

onMounted(() => {
  store.fetchDetail(route.params.boardNo)
})
</script>

<template>
  <div style="padding:16px">
    <h1>Recipe Detail</h1>

    <p v-if="store.loading">Loading...</p>
    <p v-else-if="store.error" style="color:red">{{ store.error }}</p>
    <pre v-else-if="store.selected">{{ store.selected }}</pre>
    <p v-else>데이터가 없습니다.</p>
  </div>
</template>
