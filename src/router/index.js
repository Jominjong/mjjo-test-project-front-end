import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// 페이지
const HomeView = () => import('../views/HomeView.vue')
const RecipeDetailView = () => import('../views/RecipeDetailView.vue')

const LoginView = () => import('../views/LoginView.vue')
const RegisterView = () => import('../views/RegisterView.vue')
const PasswordFindView = () => import('../views/PasswordFindView.vue')
const RecipeEditorView = () => import('../views/RecipeEditorView.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { requiresAuth: true } },
    { path: '/recipes/:boardNo', name: 'recipe-detail', component: RecipeDetailView, props: true, meta: { requiresAuth: true } },
    { path: '/recipes/:boardNo/edit', name: 'recipe-edit', component: RecipeEditorView, props: true, meta: { requiresAuth: true } },
    { path: '/recipes/new', name: 'recipe-new', component: RecipeEditorView, meta: { requiresAuth: true } },

    { path: '/login', name: 'login', component: LoginView, meta: { guestOnly: true } },
    { path: '/register', name: 'register', component: RegisterView, meta: { guestOnly: true } },
    { path: '/auth/password/find', name: 'password-find', component: PasswordFindView, meta: { guestOnly: true } },

    // 백워드 호환 리다이렉트 (경고 제거)
    // { path: '/auth/login', redirect: { name: 'login' } },
    // { path: '/auth/register', redirect: { name: 'register' } },
    // { path: '/auth/password/find', redirect: { name: 'pwd-find' } },
    // { path: '/auth/password/reset', redirect: { name: 'pwd-reset' } },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthed) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.guestOnly && auth.isAuthed) {
    return { name: 'home' }
  }
})

export default router
