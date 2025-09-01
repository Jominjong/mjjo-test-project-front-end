<!-- components/Home/RecipeCard.vue (대체) -->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  item: { type: Object, required: true },
})
const emit = defineEmits(['select'])
const click = () => emit('select', props.item)
const onKey = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); click() } }

// 배지 색상 맵
const cat = computed(() => {
  const m = {
    1: { label: '한식', cls: 'badge badge-kor' },
    2: { label: '양식', cls: 'badge badge-west' },
    3: { label: '중식', cls: 'badge badge-ch' },
    4: { label: '일식', cls: 'badge badge-jp' },
    5: { label: '디저트', cls: 'badge badge-dessert' },
  }
  const k = Number(props.item.category)
  return m[k] ?? { label: props.item.category ?? '', cls: 'badge badge-kor' }
})

// 날짜 표기 yyyy-mm-dd
const dateText = computed(() => {
  const v = props.item.createdAt
  if (!v) return ''
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return v.slice(0, 10)
  const d = new Date(v)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
})
</script>

<template>
  <div
    class="card card-hover cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
    role="button" tabindex="0" @click="click" @keydown="onKey"
    aria-label="레시피 상세 보기"
  >
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0">
        <p class="text-xs text-slate-400 font-bold">#{{ item.id }}</p>
        <h3 class="mt-2 text-lg font-extrabold tracking-tight line-clamp-2">{{ item.title }}</h3>
      </div>
      <span :class="cat.cls">{{ cat.label }}</span>
    </div>

    <div class="mt-3 flex items-center gap-2 text-xs text-slate-500">
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none">
        <path d="M8 7V3m8 4V3M4 11h16M7 20h10a3 3 0 0 0 3-3V8H4v9a3 3 0 0 0 3 3Z"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>{{ dateText }}</span>
    </div>
  </div>
</template>
