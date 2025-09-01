<!-- components/Home/SearchBar.vue (대체) -->
<script setup>
const keyword = defineModel('keyword')
const categoryNo = defineModel('categoryNo')

const props = defineProps({
  categories: {
    type: Array,
    default: () => [
      { value: null, label: '전체 카테고리' },
      { value: 1, label: '한식' },
      { value: 2, label: '양식' },
      { value: 3, label: '중식' },
      { value: 4, label: '일식' },
      { value: 5, label: '디저트' },
    ],
  },
  loading: { type: Boolean, default: false },
})
const emit = defineEmits(['search'])

</script>

<template>
  <form @submit.prevent="emit('search')" class="w-full">
    <div class="card card-hover">
      <div class="flex flex-col md:flex-col gap-3">
        <!-- 키워드 인풋 -->
        <div class="relative flex-1">
          <svg class="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none">
            <path d="M21 21l-4.35-4.35M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <input v-model.trim="keyword" class="input pl-10 h-10 w-full text-xs" placeholder="레시피 제목을 검색해보세요" />
        </div>

        <div class="flex flex-col md:flex-col gap-3">
          <!-- 카테고리 -->
          <div class="relative md:w-full">
            <select v-model.number="categoryNo" class="select text-xs w-full h-10">
              <option v-for="c in props.categories" :key="String(c.value)" :value="c.value">
                {{ c.label }}
              </option>
            </select>
          </div>

          <!-- 검색버튼 -->
          <div class="flex gap-2 items-center">
            <button :disabled="props.loading" type="submit" class="btn-primary w-full h-9 ">
              {{ props.loading ? '검색중…' : '검색' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </form>
</template>
