<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useProfile } from '@/composables/useProfile'

const { login, register, sendRecovery } = useAuth()
const { ensureProfile } = useProfile()
const router = useRouter()
const route = useRoute()

const mode = ref('login') // 'login' | 'signup' | 'forgot'
const name = ref('')
const email = ref('')
const password = ref('')
const repeat = ref('') // "repeat password" (sign up only)
const error = ref('')
const info = ref('') // success message (e.g. "check your email")
const loading = ref(false)

async function submit() {
  // Sign up: both passwords must match before we ask Appwrite
  if (mode.value === 'signup' && password.value !== repeat.value) {
    error.value = "passwords don't match"
    info.value = ''
    return
  }
  error.value = ''
  info.value = ''
  loading.value = true
  try {
    if (mode.value === 'login') {
      await login(email.value, password.value)
      router.push(route.query.redirect || '/gallery')
    } else if (mode.value === 'signup') {
      await register(name.value, email.value, password.value)
      // Create the profile. If the username is taken, send them to settings to pick another.
      const ok = await ensureProfile()
      router.push(ok ? route.query.redirect || '/gallery' : '/settings?taken=1')
    } else {
      await sendRecovery(email.value)
      // Same message whether the account exists or not, so nobody can check which emails are registered
      info.value =
        'if that email has an account, we sent you a reset link ♥ check your inbox (and spam).'
    }
  } catch (e) {
    error.value =
      mode.value === 'forgot' ? "couldn't send the email. try again in a minute." : e.message
  } finally {
    loading.value = false
  }
}

function switchTo(newMode) {
  mode.value = newMode
  error.value = ''
  info.value = ''
}
</script>

<template>
  <form @submit.prevent="submit">
    <h1>{{ mode === 'login' ? 'log in' : mode === 'signup' ? 'sign up' : 'forgot password' }}</h1>

    <p v-if="mode === 'forgot'">
      type your email and we'll send you a link to choose a new password.
    </p>

    <label v-if="mode === 'signup'">
      username
      <input v-model="name" required maxlength="50" />
    </label>

    <label>
      email
      <input v-model="email" type="email" required />
    </label>

    <label v-if="mode !== 'forgot'">
      password
      <input v-model="password" type="password" required minlength="8" />
    </label>

    <label v-if="mode === 'signup'">
      repeat password
      <input v-model="repeat" type="password" required minlength="8" />
    </label>

    <p v-if="error" role="alert">{{ error }}</p>
    <p v-if="info" role="status">{{ info }}</p>

    <button type="submit" :disabled="loading">
      {{
        loading
          ? 'please wait…'
          : mode === 'login'
            ? 'log in'
            : mode === 'signup'
              ? 'sign up'
              : 'send reset link'
      }}
    </button>

    <button v-if="mode === 'login'" type="button" @click="switchTo('forgot')">
      forgot password?
    </button>
    <button v-if="mode !== 'signup'" type="button" @click="switchTo('signup')">
      no account? sign up
    </button>
    <button v-if="mode !== 'login'" type="button" @click="switchTo('login')">back to log in</button>
  </form>
</template>
