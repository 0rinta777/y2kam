<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const { login, logout, isAdmin } = useAuth()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await login(email.value, password.value)
    // Logged in, but not in the admin team → log them out again
    if (!isAdmin.value) {
      await logout()
      error.value = 'this account is not an admin'
      return
    }
    router.push('/admin')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form @submit.prevent="submit">
    <h1>admin login</h1>

    <label>
      email
      <input v-model="email" type="email" required />
    </label>

    <label>
      password
      <input v-model="password" type="password" required />
    </label>

    <p v-if="error" role="alert">{{ error }}</p>

    <button type="submit" :disabled="loading">
      {{ loading ? 'please wait…' : 'log in' }}
    </button>
  </form>
</template>