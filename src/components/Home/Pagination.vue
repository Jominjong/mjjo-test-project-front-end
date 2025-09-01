<!-- components/Home/Pagination.vue (대체) -->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  page: { type: Number, default: 1 },
  totalPages: { type: Number, default: 1 },
  hasPrev: { type: Boolean, default: false },
  hasNext: { type: Boolean, default: false },
  total: { type: Number, default: 0 },
})
const emit = defineEmits(['first', 'prev', 'go', 'next', 'last'])

const visiblePages = computed(() => {
  const pages = []
  const total = Math.max(1, props.totalPages)
  const cur = Math.min(Math.max(1, props.page), total)
  const start = Math.max(1, cur - 2)
  const end = Math.min(total, start + 4)
  const realStart = Math.max(1, end - 4)
  for (let p = realStart; p <= end; p++) pages.push(p)
  return pages
})
</script>

<template>
  <div v-if="props.totalPages > 0" class="flex flex-wrap gap-2 items-center">
    <button :disabled="props.page === 1" @click="emit('first')" class="btn-ghost" aria-label="첫 페이지">«</button>
    <button :disabled="!props.hasPrev" @click="emit('prev')" class="btn-ghost" aria-label="이전 페이지">‹</button>

    <button
      v-for="p in visiblePages"
      :key="p"
      @click="emit('go', p)"
      :disabled="p === props.page"
      :class="[
        'px-4 py-2 rounded-full text-sm font-semibold transition',
        p === props.page
          ? 'text-white shadow-md'
          : 'bg-white/80 hover:bg-white',
      ]"
      :style="p === props.page ? 'background-image: linear-gradient(135deg, #6366f1, #06b6d4);' : ''"
      :aria-current="p === props.page ? 'page' : undefined"
    >
      {{ p }}
    </button>

    <button :disabled="!props.hasNext" @click="emit('next')" class="btn-ghost" aria-label="다음 페이지">›</button>
    <button :disabled="props.page === props.totalPages" @click="emit('last')" class="btn-ghost" aria-label="마지막 페이지">»</button>

    <span class="ml-2 text-sm text-slate-600">
      총 <strong>{{ props.total }}</strong>건 · <strong>{{ props.page }}</strong> / {{ props.totalPages }}
    </span>
  </div>
</template>
