import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

// All pages in the app.
// meta.title = text in the browser tab
// meta.requiresAuth / requiresAdmin = which pages the guard protects
const routes = [
  // Public pages
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: 'home' },
  },
  {
    path: '/booth',
    name: 'booth',
    component: () => import('@/views/BoothView.vue'),
    meta: { title: 'booth' },
  },
  {
    path: '/wall',
    name: 'wall',
    component: () => import('@/views/WallView.vue'),
    meta: { title: 'the wall' },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: 'log in' },
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('@/views/ResetPasswordView.vue'),
    meta: { title: 'new password' },
  },

  // Logged-in users only
  {
    path: '/wall/:id',
    name: 'strip',
    component: () => import('@/views/StripDetailView.vue'),
    meta: { requiresAuth: true, title: 'strip' },
  },
  {
    path: '/gallery',
    name: 'gallery',
    component: () => import('@/views/GalleryView.vue'),
    meta: { requiresAuth: true, title: 'my gallery' },
  },

  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: { requiresAuth: true, title: 'settings' },
  },

  // Admin login page (public, so admins can reach it)
  {
    path: '/admin/login',
    name: 'admin-login',
    component: () => import('@/views/admin/AdminLoginView.vue'),
    meta: { title: 'admin login' },
  },

  // Admins only: one layout (sidebar) with the admin pages inside it
  {
    path: '/admin',
    component: () => import('@/views/admin/AdminLayout.vue'),
    meta: { requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'admin',
        component: () => import('@/views/admin/AdminDashboardView.vue'),
        meta: { title: 'admin · dashboard' },
      },
      {
        path: 'catalog',
        name: 'admin-catalog',
        component: () => import('@/views/admin/AdminCatalogView.vue'),
        meta: { title: 'admin · filters & frames' },
      },
      {
        path: 'reports',
        name: 'admin-reports',
        component: () => import('@/views/admin/AdminReportsView.vue'),
        meta: { title: 'admin · reports' },
      },
    ],
  },

  // 404: any URL that didn't match above (must be LAST)
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: 'page not found' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Navigation guard: runs before EVERY page change
router.beforeEach(async (to) => {
  const { ready, loadUser, isLoggedIn, isAdmin } = useAuth()

  // First visit: ask Appwrite who is logged in (only happens once)
  if (!ready.value) await loadUser()

  // Needs login, but nobody is logged in → login page, remember where they wanted to go
  if (to.meta.requiresAuth && !isLoggedIn.value) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // Needs admin, but the user isn't one → admin login
  if (to.meta.requiresAdmin && !isAdmin.value) {
    return { name: 'admin-login' }
  }
})

// After every page change: update the browser tab title
router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · y2kam` : 'y2kam'
})

export default router
