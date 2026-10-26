<script setup>
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import NotificationBell from '@/components/NotificationBell.vue'

const { user, isLoggedIn, isAdmin, logout } = useAuth()
const router = useRouter()

async function onLogout() {
  await logout()
  router.push('/')
}
</script>

<template>
  <nav>
    <RouterLink to="/">home</RouterLink>
    <RouterLink to="/booth">booth</RouterLink>
    <RouterLink to="/about">about</RouterLink>
    <RouterLink to="/wall">wall</RouterLink>

    <!-- Only shown when logged in -->
    <RouterLink v-if="isLoggedIn" to="/gallery">my gallery</RouterLink>
    <RouterLink v-if="isLoggedIn" to="/settings">settings</RouterLink>
    <RouterLink v-if="isLoggedIn" :to="`/u/${user.$id}`">my profile</RouterLink>
    <NotificationBell v-if="isLoggedIn" />
    <!-- Only shown to admins -->
    <RouterLink v-if="isAdmin" to="/admin">admin</RouterLink>

    <RouterLink v-if="!isLoggedIn" to="/login">log in</RouterLink>
    <button v-else @click="onLogout">log out ({{ user.name }})</button>
  </nav>

  <!-- The current page appears here -->
  <RouterView />
</template>
