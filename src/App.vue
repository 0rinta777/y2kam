<script setup>
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

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
    <RouterLink to="/wall">wall</RouterLink>

    <!-- Only shown when logged in -->
    <RouterLink v-if="isLoggedIn" to="/gallery">my gallery</RouterLink>
    <!-- Only shown to admins -->
    <RouterLink v-if="isAdmin" to="/admin">admin</RouterLink>

    <RouterLink v-if="!isLoggedIn" to="/login">log in</RouterLink>
    <button v-else @click="onLogout">log out ({{ user.name }})</button>
  </nav>

  <!-- The current page appears here -->
  <RouterView />
</template>