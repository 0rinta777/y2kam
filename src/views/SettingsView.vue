<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useAccount } from '@/composables/useAccount'

const router = useRouter()
const { user } = useAuth()
const { changeName, changePassword, deleteAccount } = useAccount()

// --- Username ---
const name = ref(user.value?.name || '')
const nameMsg = ref('')
const nameError = ref('')
const savingName = ref(false)

async function saveName() {
  nameMsg.value = ''
  nameError.value = ''
  if (!name.value.trim()) {
    nameError.value = "username can't be empty"
    return
  }
  savingName.value = true
  try {
    await changeName(name.value.trim())
    nameMsg.value = 'username saved ♥'
  } catch (e) {
    console.error('name failed:', e)
    nameError.value = "couldn't save your username. try again."
  } finally {
    savingName.value = false
  }
}

// --- Password ---
const oldPassword = ref('')
const newPassword = ref('')
const repeat = ref('')
const pwMsg = ref('')
const pwError = ref('')
const savingPw = ref(false)

async function savePassword() {
  pwMsg.value = ''
  pwError.value = ''
  if (newPassword.value.length < 8) {
    pwError.value = 'use at least 8 characters'
    return
  }
  if (newPassword.value !== repeat.value) {
    pwError.value = "passwords don't match"
    return
  }
  savingPw.value = true
  try {
    await changePassword(oldPassword.value, newPassword.value)
    pwMsg.value = 'password changed ♥'
    oldPassword.value = newPassword.value = repeat.value = ''
  } catch (e) {
    console.error('password failed:', e)
    pwError.value =
      e.code === 401
        ? 'your current password is wrong'
        : "couldn't change your password. try again."
  } finally {
    savingPw.value = false
  }
}

// --- Delete account ---
const confirmText = ref('')
const deleting = ref(false)
const deleteError = ref('')

async function removeAccount() {
  deleting.value = true
  deleteError.value = ''
  try {
    await deleteAccount()
    router.push('/')
  } catch (e) {
    console.error('delete account failed:', e)
    deleteError.value = "couldn't delete your account. try again."
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <main class="settings">
    <h1>settings</h1>
    <p>logged in as {{ user?.email }}</p>

    <!-- Username -->
    <form @submit.prevent="saveName">
      <h2>username</h2>
      <label>
        username
        <input v-model="name" maxlength="50" required />
      </label>
      <p v-if="nameError" class="field-error" role="alert">{{ nameError }}</p>
      <p v-if="nameMsg" role="status">{{ nameMsg }}</p>
      <button type="submit" :disabled="savingName">
        {{ savingName ? 'saving…' : 'save username' }}
      </button>
    </form>

    <!-- Password -->
    <form @submit.prevent="savePassword">
      <h2>password</h2>
      <label>
        current password
        <input v-model="oldPassword" type="password" required />
      </label>
      <label>
        new password
        <input v-model="newPassword" type="password" required minlength="8" />
      </label>
      <label>
        repeat new password
        <input v-model="repeat" type="password" required />
      </label>
      <p v-if="pwError" class="field-error" role="alert">{{ pwError }}</p>
      <p v-if="pwMsg" role="status">{{ pwMsg }}</p>
      <button type="submit" :disabled="savingPw">
        {{ savingPw ? 'saving…' : 'change password' }}
      </button>
    </form>

    <!-- Danger zone -->
    <form class="danger" @submit.prevent="removeAccount">
      <h2>delete account</h2>
      <p>this deletes all your strips and comments and closes your account. it can't be undone.</p>
      <label>
        type <strong>delete</strong> to confirm
        <input v-model="confirmText" autocomplete="off" />
      </label>
      <p v-if="deleteError" class="field-error" role="alert">{{ deleteError }}</p>
      <button type="submit" :disabled="confirmText !== 'delete' || deleting">
        {{ deleting ? 'deleting…' : 'delete my account' }}
      </button>
    </form>
  </main>
</template>

<style scoped>
.settings {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 16px;
  max-width: 480px;
}
form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  border: 1px solid #eee;
  border-radius: 12px;
}
form h2 {
  margin: 0;
}
.danger {
  border-color: #f3b4cf;
}
.field-error {
  margin: 0;
  color: #c0145b;
}
</style>
