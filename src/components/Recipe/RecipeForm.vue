<script setup>
import { reactive, computed, watch } from 'vue'
import Loding from '../Home/Loding.vue'
import AuthErro from '../Home/AuthErro.vue'

const props = defineProps({
  mode: { type: String, default: 'create' }, // 'create' | 'edit'
  initial: { type: Object, default: () => ({}) },
  saving: { type: Boolean, default: false },
})
const emit = defineEmits(['submit', 'cancel'])

const CATEGORIES = Object.freeze([
  { cgNo: 1, cgName: '한식' },
  { cgNo: 2, cgName: '양식' },
  { cgNo: 3, cgName: '중식' },
  { cgNo: 4, cgName: '일식' },
  { cgNo: 5, cgName: '디저트' },
])

const form = reactive({
  title: '',
  content: '',
  categoryNo: null,
  ingredients: [{ name: '', amount: '' }],
})

function applyInitial(v = {}) {
  form.title = v?.title || ''
  form.content = v?.content || ''
  // 숫자/문자 섞여 들어와도 안전하게 Number 처리 (null은 유지)
  form.categoryNo = v?.categoryNo === null || v?.categoryNo === undefined
    ? null
    : Number(v.categoryNo)
  form.ingredients =
    Array.isArray(v?.ingredients) && v.ingredients.length
      ? v.ingredients.map(i => ({ name: i?.name || '', amount: i?.amount || '' }))
      : [{ name: '', amount: '' }]
}
// 최초 한 번 반영
applyInitial(props.initial)

// initial이 바뀌면 반영 (수정 모드에서 유용)
watch(() => props.initial, (v) => applyInitial(v), { deep: true })

function addIngredient() {
  form.ingredients.push({ name: '', amount: '' })
}
function removeIngredient(idx) {
  if (form.ingredients.length > 1) form.ingredients.splice(idx, 1)
}

// amount 입력칸에서 Enter 누르면 다음 줄 추가
function onAmountKeydown(e, idx) {
  if (e.key === 'Enter') {
    e.preventDefault()
    if (idx === form.ingredients.length - 1) addIngredient()
  }
}

const valid = computed(() =>
  form.title.trim() &&
  form.content.trim() &&
  form.categoryNo !== null &&
  form.ingredients.length > 0 &&
  form.ingredients.every(i => (i.name || '').trim() && (i.amount || '').trim())
)

const modeLabel = computed(() => (props.mode === 'edit' ? '수정' : '등록'))

function onSubmit() {
  if (props.saving) return // 중복 제출 가드
  if (!valid.value) return
  emit('submit', {
    title: form.title.trim(),
    content: form.content.trim(),
    categoryNo: Number(form.categoryNo), // ← 항상 숫자 보장
    ingredients: form.ingredients.map(i => ({
      name: i.name.trim(),
      amount: i.amount.trim(),
    })),
  })
}
</script>

<template>
  <div class="card p-6 space-y-6">
    <header>
      <h2 class="text-2xl font-extrabold leading-tight">레시피 {{ modeLabel }}</h2>
      <p class="mt-1 text-sm text-slate-600">필수 항목을 모두 입력해 주세요.</p>
    </header>

    <form class="space-y-6" @submit.prevent="onSubmit">
      <!-- 제목 -->
      <div>
        <label class="block text-sm font-medium text-slate-700">제목</label>
        <input v-model.trim="form.title" class="input mt-1" placeholder="레시피 제목" />
      </div>

      <!-- 내용 -->
      <div>
        <div class="flex items-center justify-between">
          <label class="block text-sm font-medium text-slate-700">내용</label>
          <span class="text-xs text-slate-500">{{ form.content.length }}자</span>
        </div>
        <textarea
          v-model="form.content"
          class="input mt-1 min-h-40"
          rows="8"
          placeholder="조리 방법, 팁 등"
        ></textarea>
      </div>

      <!-- 카테고리 -->
      <div>
        <label class="block text-sm font-medium text-slate-700">카테고리</label>
        <select v-model.number="form.categoryNo" class="select mt-1">
          <option :value="null" disabled>선택하세요</option>
          <option v-for="c in CATEGORIES" :key="c.cgNo" :value="c.cgNo">
            {{ c.cgName }}
          </option>
        </select>
      </div>

      <!-- 재료 -->
      <div>
        <div class="flex items-center justify-between">
          <label class="block text-sm font-medium text-slate-700">재료</label>
          <div class="flex items-center gap-2 text-xs text-slate-500">
            <span>{{ form.ingredients.length }}개</span>
            <button type="button" class="btn-ghost" @click="addIngredient">+ 추가</button>
          </div>
        </div>

        <div class="mt-2 space-y-2">
          <div
            v-for="(ing, idx) in form.ingredients"
            :key="idx"
            class="glass rounded-xl p-3 flex flex-col gap-2 md:flex-row md:items-center md:gap-2"
          >
            <div class="flex-1">
              <input v-model.trim="ing.name" class="input" placeholder="예: 새우" />
            </div>
            <div class="w-full md:w-40">
              <input
                v-model.trim="ing.amount"
                class="input"
                placeholder="예: 300g"
                @keydown="onAmountKeydown($event, idx)"
              />
            </div>
            <div class="shrink-0">
              <button
                type="button"
                class="btn-outline"
                @click="removeIngredient(idx)"
                :disabled="form.ingredients.length === 1"
                :aria-label="`재료 ${idx + 1} 삭제`"
                title="삭제"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 액션 -->
      <div class="flex flex-wrap gap-2">
        <button class="btn-primary" type="submit" :disabled="!valid || saving">
          {{ mode === 'create' ? '등록' : '수정' }}
        </button>
        <button class="btn-outline" type="button" @click="$emit('cancel')">취소</button>
        <span v-if="saving" class="inline-flex items-center gap-2 text-sm text-slate-600">
          <span class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent"></span>
          저장 중…
        </span>
      </div>

      <!-- 유효성 안내 -->
      <p v-if="!valid" class="text-xs text-slate-500">
        제목/내용/카테고리 및 모든 재료(이름·양)를 입력해야 제출할 수 있어요.
      </p>
    </form>

    <!-- 로딩 처리 -->
    <Loding />

    <!-- 인증에러 처리 -->
    <AuthErro />
  </div>
</template>
