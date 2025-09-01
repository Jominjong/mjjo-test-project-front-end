<!-- components/Home/RecipeList.vue (대체) -->
<script setup>
import RecipeCard from './RecipeCard.vue'
import SearchBar from './SearchBar.vue'
import { computed, ref } from 'vue'
import { useRecipeStore } from '../../stores/recipes'

const store = useRecipeStore()
const keyword = ref(store.keyword)
const categoryNo = ref(store.categoryNo)
const onSearch = async () => { await store.search({ keyword: keyword.value, categoryNo: categoryNo.value }) }

const props = defineProps({
  items: { type: Array, default: () => [] },
  emptyText: { type: String, default: '검색 결과가 없습니다.' },
  placeholder: { type: String, default: '검색창' },
})
const emit = defineEmits(['select'])

const rows = computed(() =>
  (props.items || []).map(r => ({
    id: r.boardNo,
    title: r.title,
    category: r.categoryNo,
    createdAt: r.createdAt,
    raw: r,
  }))
)

const q = ref('')

const cols = computed(() => {
  const filtered = rows.value.filter(it =>
    !q.value || String(it.title).toLowerCase().includes(q.value.toLowerCase())
  )
  return [
    filtered.slice(0, 4),
    filtered.slice(4, 7),
    filtered.slice(7, 11),
  ]
})

const onClick = (item) => emit('select', item.id)
</script>

<template>
  <div class="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- 왼쪽 -->
    <div class="space-y-6">
      <RecipeCard v-for="it in cols[0]" :key="`L-${it.id}`" :item="it" @select="onClick"/>
    </div>

    <!-- 가운데 (검색 + 카드) -->
    <div class="space-y-6">
      <div class="glass rounded-2xl p-3">
        <SearchBar v-model:keyword="keyword" v-model:categoryNo="categoryNo" :loading="store.loading" @search="onSearch"/>
      </div>

      <div v-if="rows.length === 0" class="glass rounded-2xl p-10 text-center text-slate-500">
        <div class="mx-auto mb-3 h-12 w-12 rounded-full bg-gradient-to-br from-indigo-400/40 to-cyan-400/40 grid place-items-center">
          🔎
        </div>
        <p class="font-semibold">{{ emptyText }}</p>
      </div>

      <RecipeCard v-for="it in cols[1]" :key="`C-${it.id}`" :item="it" @select="onClick"/>
    </div>

    <!-- 오른쪽 -->
    <div class="space-y-6">
      <RecipeCard v-for="it in cols[2]" :key="`R-${it.id}`" :item="it" @select="onClick"/>
    </div>
  </div>
</template>
