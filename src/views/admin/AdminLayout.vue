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
/* Clean admin style from the Figma admin pages */
.admin {
  display: flex;
  min-height: calc(100vh - 160px);
  background: linear-gradient(160deg, #24103f, #110620);
  border: 1px solid rgba(215, 184, 255, 0.14);
  border-radius: 24px;
  overflow: hidden;
}
aside {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 230px;
  padding: 24px 18px;
  background: #140726;
  border-right: 1px solid rgba(215, 184, 255, 0.14);
}
.brand {
  margin: 0 0 8px;
  font-family: var(--font-display);
  font-size: 24px;
  color: #ffffff;
}
aside nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
aside nav a {
  padding: 10px 14px;
  font-weight: 500;
  color: #d7b8ff;
  text-decoration: none;
  border-radius: 12px;
}
aside nav a:hover {
  color: #ffffff;
  background: rgba(183, 99, 234, 0.12);
}
/* Current page in the sidebar */
aside nav a.active {
  font-weight: 600;
  color: #ffffff;
  background: rgba(183, 99, 234, 0.22);
}
aside > p {
  margin: auto 0 0;
  font-size: 14px;
  color: rgba(234, 220, 255, 0.7);
}
aside > a {
  font-size: 14px;
}
main {
  flex: 1;
  min-width: 0;
  padding: 32px;
}

/* ---- Flat buttons + headings for every admin page (inside this layout) ---- */
main :deep(h1) {
  margin-bottom: 20px;
  font-size: clamp(28px, 4vw, 36px);
  color: #ffffff;
  background: none;
  filter: none;
}
main :deep(button) {
  min-height: 38px;
  padding: 8px 16px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(215, 184, 255, 0.35);
  box-shadow: none;
}
main :deep(button:hover:not(:disabled)) {
  background: rgba(183, 99, 234, 0.18);
  box-shadow: none;
}
/* Primary = flat purple, no gloss */
main :deep(button[type='submit']),
main :deep(.primary) {
  background: #9b4fe0;
  border-color: #9b4fe0;
}
main :deep(button[type='submit']:hover:not(:disabled)),
main :deep(.primary:hover:not(:disabled)) {
  background: #a965ea;
}
main :deep(button[type='submit']::before) {
  display: none;
}
main :deep(button[aria-pressed='true']) {
  background: rgba(183, 99, 234, 0.3);
  border-color: #b763ea;
  box-shadow: none;
}
/* Delete / remove = pink outline */
main :deep(.danger) {
  color: #ffd3ea;
  background: transparent;
  border-color: rgba(255, 143, 200, 0.7);
}

/* Phones: sidebar on top */
@media (max-width: 800px) {
  .admin {
    flex-direction: column;
  }
  aside {
    width: auto;
    border-right: none;
    border-bottom: 1px solid rgba(215, 184, 255, 0.14);
  }
  aside nav {
    flex-direction: row;
    flex-wrap: wrap;
  }
  aside > p {
    margin: 0;
  }
  main {
    padding: 20px;
  }
}
</style>
