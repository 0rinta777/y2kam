<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const { login, register } = useAuth()
const router = useRouter() // lets us change page from code
const route = useRoute() // the current page's info (e.g. ?redirect=/gallery)

// Form state
const mode = ref('login') // 'login' or 'signup'
const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('') // message shown if something goes wrong
const loading = ref(false) // true while waiting for Appwrite

async function submit() {
  error.value = ''
  loading.value = true
  try {
    if (mode.value === 'login') {
      await login(email.value, password.value)
    } else {
      await register(name.value, email.value, password.value)
    }
    // Go back to the page they wanted, or to the gallery
    router.push(route.query.redirect || '/gallery')
  } catch (e) {
    // Appwrite's error message, e.g. "Invalid credentials"
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function toggleMode() {
  mode.value = mode.value === 'login' ? 'signup' : 'login'
  error.value = ''
}
</script>

<template>
  <form @submit.prevent="submit">
    <h1>{{ mode === 'login' ? 'log in' : 'sign up' }}</h1>

    <!-- Username only when signing up -->
    <label v-if="mode === 'signup'">
      username
      <input v-model="name" required maxlength="50" />
    </label>

    <label>
      email
      <input v-model="email" type="email" required />
    </label>

    <label>
      password
      <input v-model="password" type="password" required minlength="8" />
    </label>

    <!-- Error message (role="alert" lets screen readers announce it) -->
    <p v-if="error" role="alert">{{ error }}</p>

    <button type="submit" :disabled="loading">
      {{ loading ? 'please wait…' : mode === 'login' ? 'log in' : 'sign up' }}
    </button>

    <button type="button" @click="toggleMode">
      {{ mode === 'login' ? 'no account? sign up' : 'have an account? log in' }}
    </button>
  </form>
</template>