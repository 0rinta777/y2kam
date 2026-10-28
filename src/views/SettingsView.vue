<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useAccount } from '@/composables/useAccount'
import { useProfile, getProfile, avatarUrl } from '@/composables/useProfile'

const router = useRouter()
const route = useRoute()
const { user } = useAuth()
const { changeName, changePassword, deleteAccount } = useAccount()
const { saveProfile, changeAvatar } = useProfile()

// --- Profile ---
const name = ref(user.value?.name || '')
const bio = ref('')
const avatarId = ref(null)
const profileMsg = ref('')
const profileError = ref(
  route.query.taken ? 'your username is already taken. pick a new one ♥' : '',
)
const savingProfile = ref(false)
const uploadingAvatar = ref(false)

onMounted(async () => {
  try {
    const profile = await getProfile(user.value.$id)
    if (profile) {
      name.value = profile.username
      bio.value = profile.bio || ''
      avatarId.value = profile.avatarId || null
    }
  } catch (e) {
    console.error('profile load failed:', e)
  }
})

async function onAvatarChange(event) {
  const file = event.target.files[0]
  if (!file) return
  uploadingAvatar.value = true
  profileError.value = ''
  try {
    avatarId.value = await changeAvatar(file, avatarId.value)
    profileMsg.value = 'new profile picture ♥'
  } catch (e) {
    console.error('avatar failed:', e)
    profileError.value = "couldn't upload the picture. try a jpg or png under 5 MB."
  } finally {
    uploadingAvatar.value = false
  }
}

async function saveProfileForm() {
  profileMsg.value = ''
  profileError.value = ''
  const newName = name.value.trim()
  if (!newName) {
    profileError.value = "username can't be empty"
    return
  }
  savingProfile.value = true
  try {
    if (newName !== user.value.name) await changeName(newName)
    await saveProfile({ bio: bio.value.trim() })
    profileMsg.value = 'profile saved ♥'
  } catch (e) {
    console.error('profile failed:', e)
    profileError.value =
      e.code === 409 ? 'that username is taken, try another one' : "couldn't save. try again."
  } finally {
    savingProfile.value = false
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

    <!-- Profile -->
    <form @submit.prevent="saveProfileForm">
      <h2>profile</h2>

      <div class="avatar-row">
        <img v-if="avatarId" :src="avatarUrl(avatarId)" alt="your profile picture" class="avatar" />
        <div v-else class="avatar placeholder" aria-hidden="true">{{ name.charAt(0) || '?' }}</div>
        <label>
          {{ uploadingAvatar ? 'uploading…' : 'change profile picture' }}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            :disabled="uploadingAvatar"
            @change="onAvatarChange"
          />
        </label>
      </div>

      <label>
        username
        <input v-model="name" maxlength="50" required />
      </label>

      <label>
        bio
        <textarea
          v-model="bio"
          maxlength="160"
          rows="3"
          placeholder="y2k girlie ✿ love taking webcam pics"
        />
      </label>
      <small>{{ bio.length }}/160</small>

      <p v-if="profileError" class="field-error" role="alert">{{ profileError }}</p>
      <p v-if="profileMsg" role="status">{{ profileMsg }}</p>
      <button type="submit" :disabled="savingProfile">
        {{ savingProfile ? 'saving…' : 'save profile' }}
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
      <p>
        this deletes your strips, comments and profile and closes your account. it can't be undone.
      </p>
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
  max-width: 560px;
  margin: 0 auto;
}
.settings > h1,
.settings > p {
  margin: 0;
}
/* Each section is a glass card */
form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: none;
  padding: 28px;
  background: rgba(30, 8, 56, 0.74);
  border: 1.5px solid rgba(215, 184, 255, 0.45);
  border-radius: 28px;
  box-shadow: 0 0 30px rgba(157, 77, 230, 0.35);
  backdrop-filter: blur(12px);
}
form h2 {
  margin: 0 0 4px;
  font-size: 26px;
}
.avatar-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 20px;
}
.avatar {
  flex: none;
  width: 88px;
  height: 88px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #ffffff;
  box-shadow: 0 0 14px rgba(199, 125, 255, 0.8);
}
.placeholder {
  display: grid;
  place-items: center;
  font-size: 34px;
  font-weight: 700;
  color: #ffffff;
  background: radial-gradient(circle at 35% 30%, #d08bff, #7b2fc9);
}
form button[type='submit'] {
  align-self: flex-start;
}
/* Danger zone: pink */
.danger {
  border-color: rgba(255, 143, 200, 0.6);
  box-shadow: 0 0 24px rgba(255, 143, 200, 0.2);
}
.danger button[type='submit'] {
  background: linear-gradient(180deg, #ff8fc8 0%, #c2186b 100%);
}
.field-error {
  margin: 0;
  color: #ff8fc8;
}
/* Laptop/desktop: the 3 cards side by side, so everything fits on one screen */
@media (min-width: 1000px) {
  .settings {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr)); /* 3 equal columns */
    align-items: start;
    gap: 16px 24px;
    max-width: 1200px;
    margin-top: -8px;
    margin-bottom: -48px; /* skip the page's empty bottom space */
  }
  /* title on the left, "logged in as" on the right, same line */
  .settings > h1 {
    grid-column: 1;
    font-size: 38px;
  }
  .settings > p {
    grid-column: 2 / -1;
    align-self: center;
    justify-self: end;
  }
  /* more compact cards so they fit smaller laptops too */
  form {
    gap: 8px;
    padding: 20px 22px;
  }
  form h2 {
    font-size: 24px;
  }
  /* profile picture next to the "change" button instead of above it */
  .avatar-row {
    flex-wrap: nowrap;
    gap: 14px;
  }
  .avatar-row label {
    min-width: 0;
  }
  .avatar {
    width: 64px;
    height: 64px;
    font-size: 28px;
  }
  textarea {
    height: 64px;
  }
}
</style>
