<script setup>
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const { user, logout } = useAuth()
const router = useRouter()

async function onLogout() {
  await logout()
  router.push('/admin/login')
}
</script>

<template>
  <div class="admin">
    <aside>
      <p class="brand">y2kam admin</p>
      <nav aria-label="admin">
        <RouterLink to="/admin" exact-active-class="active">dashboard</RouterLink>
        <RouterLink to="/admin/catalog" active-class="active">filters & frames</RouterLink>
        <RouterLink to="/admin/reports" active-class="active">reports</RouterLink>
        <RouterLink to="/admin/messages" active-class="active">messages</RouterLink>
      </nav>
      <p>{{ user?.name }}</p>
      <button @click="onLogout">log out</button>
      <RouterLink to="/">← back to site</RouterLink>
    </aside>

    <!-- The current admin page appears here -->
    <main>
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.admin {
  display: flex;
  min-height: 100vh;
}
aside {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 220px;
  padding: 16px;
  border-right: 1px solid #ddd;
}
aside nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.active {
  font-weight: bold;
}
main {
  flex: 1;
  padding: 16px;
}
</style>
