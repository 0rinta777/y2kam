<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import NotificationBell from '@/components/NotificationBell.vue'
import LeopardBackground from '@/components/LeopardBackground.vue'
import { getProfile, avatarUrl, myAvatarId } from '@/composables/useProfile'

const { user, isLoggedIn, isAdmin, logout } = useAuth()
const router = useRouter()
const route = useRoute()

// Mobile menu (hamburger) open/closed
const menuOpen = ref(false)
watch(
  () => route.fullPath,
  () => (menuOpen.value = false), // close the menu after going to a page
)

// First letter of the username for the little avatar circle
const initial = computed(() => (user.value?.name || '?').charAt(0).toUpperCase())

// Load my profile picture for the nav whenever someone logs in (or out)
watch(
  () => user.value?.$id,
  async (id) => {
    myAvatarId.value = null
    if (!id) return
    try {
      const profile = await getProfile(id)
      myAvatarId.value = profile?.avatarId || null
    } catch (e) {
      console.error('nav avatar failed:', e) // no picture = the letter is shown
    }
  },
  { immediate: true },
)

async function onLogout() {
  await logout()
  router.push('/')
}
</script>

<template>
  <!-- Leopard print spots behind the page (decoration) -->
  <LeopardBackground />

  <header class="topbar">
    <RouterLink to="/" class="brand">y2kam</RouterLink>

    <!-- Hamburger button (only visible on small screens) -->
    <button
      type="button"
      class="menu-toggle"
      :aria-expanded="menuOpen"
      aria-controls="main-nav"
      aria-label="menu"
      @click="menuOpen = !menuOpen"
    >
      {{ menuOpen ? '✕' : '☰' }}
    </button>

    <nav id="main-nav" :class="{ open: menuOpen }" aria-label="main">
      <RouterLink to="/">home</RouterLink>
      <RouterLink to="/booth">booth</RouterLink>
      <RouterLink to="/about">about</RouterLink>
      <RouterLink to="/wall">wall</RouterLink>

      <!-- Only shown when logged in -->
      <RouterLink v-if="isLoggedIn" to="/gallery">my gallery</RouterLink>
      <RouterLink v-if="isLoggedIn" to="/settings">settings</RouterLink>
      <!-- Only shown to admins -->
      <RouterLink v-if="isAdmin" to="/admin">admin</RouterLink>

      <div v-if="isLoggedIn" class="user-area">
        <NotificationBell />
        <RouterLink :to="`/u/${user.$id}`" class="user-pill" aria-label="my profile">
          <!-- profile picture, or the first letter if there is none -->
          <img v-if="myAvatarId" :src="avatarUrl(myAvatarId)" alt="" class="avatar" />
          <span v-else class="avatar" aria-hidden="true">{{ initial }}</span>
          {{ user.name }}
        </RouterLink>
        <button type="button" class="logout" @click="onLogout">log out</button>
      </div>
      <RouterLink v-else to="/login" class="login-link">log in</RouterLink>
    </nav>
  </header>

  <!-- The current page appears here -->
  <div class="page">
    <RouterView />
  </div>
</template>

<style scoped>
/* Top bar from the Figma "Nav logged in" component */
.topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 72px;
  padding: 12px clamp(16px, 4vw, 56px);
  background: rgba(18, 5, 31, 0.6);
  border-bottom: 1.5px solid rgba(215, 184, 255, 0.5);
  backdrop-filter: blur(10px);
}

/* The y2kam logo */
.brand {
  font-family: var(--font-display);
  font-size: 32px;
  line-height: 1;
  text-decoration: none;
  background: linear-gradient(180deg, #ffffff, #d7b8ff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 0 12px rgba(199, 125, 255, 0.9));
}

nav {
  display: flex;
  align-items: center;
  gap: 24px;
}

nav > a {
  font-size: 15px;
  font-weight: 500;
  color: #eadcff;
  text-decoration: none;
}

nav > a:hover,
nav > a.router-link-exact-active {
  color: #ffffff;
  text-shadow: 0 0 10px rgba(199, 125, 255, 0.9);
}

.user-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* User pill: avatar + name (links to my profile) */
.user-pill {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 5px 16px 5px 5px;
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
  text-decoration: none;
  background: rgba(189, 153, 242, 0.18);
  border: 1px solid rgba(215, 184, 255, 0.6);
  border-radius: 999px;
}

.user-pill:hover {
  background: rgba(189, 153, 242, 0.3);
}

.avatar {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover; /* photo fills the circle */
  font-weight: 700;
  background: radial-gradient(circle at 35% 30%, #d08bff, #7b2fc9);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.7);
}

.logout {
  min-height: 36px;
  padding: 6px 14px;
  font-size: 13px;
}

.login-link {
  padding: 8px 20px;
  border: 2px solid #d7b8ff;
  border-radius: 999px;
}

.menu-toggle {
  display: none;
  min-height: 40px;
  padding: 6px 14px;
  font-size: 18px;
}

/* Page area under the top bar */
.page {
  position: relative;
  z-index: 1; /* above the leopard spots */
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px clamp(16px, 4vw, 40px) 64px;
}

/* ---------- Phones / small screens: hamburger menu ---------- */
@media (max-width: 900px) {
  .menu-toggle {
    display: inline-flex;
  }

  nav {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
    padding: 12px 16px 20px;
    background: rgba(18, 5, 31, 0.95);
    border-bottom: 1.5px solid rgba(215, 184, 255, 0.5);
  }

  nav.open {
    display: flex;
  }

  nav > a {
    padding: 12px 8px;
    font-size: 17px;
  }

  .user-area {
    flex-wrap: wrap;
    padding-top: 8px;
  }
}
</style>
