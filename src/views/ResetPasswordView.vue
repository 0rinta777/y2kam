<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const { resetPassword } = useAuth()

// The email link looks like /reset-password?userId=...&secret=...
const userId = route.query.userId
const secret = route.query.secret
const validLink = !!(userId && secret)

const password = ref('')
const repeat = ref('')
const error = ref('')
const loading = ref(false)
const done = ref(false)

async function submit() {
  error.value = ''
  if (password.value.length < 8) {
    error.value = 'use at least 8 characters'
    return
  }
  if (password.value !== repeat.value) {
    error.value = "passwords don't match"
    return
  }
  loading.value = true
  try {
    await resetPassword(userId, secret, password.value)
    done.value = true
  } catch (e) {
    console.error('reset failed:', e)
    error.value = 'this link has expired or was already used. ask for a new one.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main>
    <h1>choose a new password</h1>

    <!-- Opened without the email link -->
    <div v-if="!validLink" role="alert">
      <p>this link isn't complete. use the link from your email, or ask for a new one.</p>
      <RouterLink to="/login">back to log in</RouterLink>
    </div>

    <!-- Success -->
    <div v-else-if="done" role="status">
      <p>password changed ♥</p>
      <RouterLink to="/login">log in with your new password</RouterLink>
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="submit">
      <label>
        new password
        <input v-model="password" type="password" required minlength="8" />
      </label>
      <label>
        repeat new password
        <input v-model="repeat" type="password" required />
      </label>
      <p v-if="error" role="alert">{{ error }}</p>
      <button type="submit" :disabled="loading">
        {{ loading ? 'saving…' : 'save new password' }}
      </button>
    </form>
  </main>
</template>
