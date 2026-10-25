import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

// All pages in the app.
// component: () => import(...) loads a page only when it's visited (faster start).
// meta tells the guard which pages need protecting.
const routes = [
  // Public pages: anyone can visit
  { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
  { path: '/booth', name: 'booth', component: () => import('@/views/BoothView.vue') },
  { path: '/wall', name: 'wall', component: () => import('@/views/WallView.vue') },
  { path: '/wall', name: 'wall', component: () => import('@/views/WallView.vue') },
  { path: '/wall/:id', name: 'strip', component: () => import('@/views/StripDetailView.vue') },
  { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue') },

  // Logged-in users only
  {
    path: '/gallery',
    name: 'gallery',
    component: () => import('@/views/GalleryView.vue'),
    meta: { requiresAuth: true },
  },

  // Admin login page (public, so admins can reach it)
  {
    path: '/admin/login',
    name: 'admin-login',
    component: () => import('@/views/admin/AdminLoginView.vue'),
  },

  // Admins only
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/views/admin/AdminDashboardView.vue'),
    meta: { requiresAdmin: true },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // normal URLs like /gallery
  routes,
})

// Navigation guard: runs before EVERY page change
router.beforeEach(async (to) => {
  const { ready, loadUser, isLoggedIn, isAdmin } = useAuth()

  // First visit: ask Appwrite who is logged in (only happens once)
  if (!ready.value) await loadUser()

  // Page needs a login, but nobody is logged in → send to login,
  // and remember where they wanted to go
  if (to.meta.requiresAuth && !isLoggedIn.value) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // Page needs an admin, but the user isn't one → send to admin login
  if (to.meta.requiresAdmin && !isAdmin.value) {
    return { name: 'admin-login' }
  }

  // Otherwise: allow the page change (returning nothing = go ahead)
})

export default router
