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

<style scoped>
/* Clean admin login card */
form {
  max-width: 420px;
  margin: 48px auto;
  padding: 36px;
  background: rgba(28, 11, 51, 0.92);
  border: 1px solid rgba(215, 184, 255, 0.14);
  border-radius: 18px;

}
form h1 {
  margin: 0 0 4px;
  font-size: 34px;
  text-align: center;
  color: #ffffff;
  background: none;
  filter: none;
}
form button[type='submit'] {
  background: #9b4fe0;
  border-color: #9b4fe0;
  box-shadow: none;
}
form button[type='submit']::before {
  display: none;
}
@media (max-width: 600px) {
  form {
    margin: 16px auto;
    padding: 24px;
  }
}
</style>
