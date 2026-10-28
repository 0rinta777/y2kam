<script setup>
import { ref, reactive } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useMessages } from '@/composables/useMessages'

const { user } = useAuth()
const { sendMessage } = useMessages()

// Logged in? Fill in name + email for them
const form = reactive({ name: user.value?.name || '', email: user.value?.email || '', message: '' })
const errors = reactive({ name: '', email: '', message: '' })
const sending = ref(false)
const sent = ref(false)
const sendError = ref('')

function validate() {
  errors.name = form.name.trim() ? '' : 'tell us your name'
  errors.email = /^\S+@\S+\.\S+$/.test(form.email) ? '' : 'enter a valid email, like you@mail.com'
  errors.message = form.message.trim().length >= 10 ? '' : 'write at least 10 characters'
  return !errors.name && !errors.email && !errors.message
}

async function submit() {
  sendError.value = ''
  if (!validate()) return
  sending.value = true
  try {
    await sendMessage({
      name: form.name.trim(),
      email: form.email.trim(),
      message: form.message.trim(),
    })
    sent.value = true
  } catch (e) {
    console.error('message failed:', e)
    sendError.value = "couldn't send your message. try again in a minute."
  } finally {
    sending.value = false
  }
}

// "send another": clear the message and show the form again
function sendAnother() {
  form.message = ''
  errors.name = ''
  errors.email = ''
  errors.message = ''
  sent.value = false
}
</script>

<template>
  <!-- After sending -->
  <div v-if="sent" role="status" class="sent">
    <p>thank you ♥ your message was sent. we'll get back to you by email.</p>
    <button type="button" @click="sendAnother">send another</button>
  </div>

  <!-- The form -->
  <form v-else class="contact" novalidate @submit.prevent="submit">
    <label>
      name
      <input v-model="form.name" maxlength="80" :aria-invalid="!!errors.name" />
    </label>
    <p v-if="errors.name" class="field-error" role="alert">{{ errors.name }}</p>

    <label>
      email
      <input v-model="form.email" type="email" maxlength="120" :aria-invalid="!!errors.email" />
    </label>
    <p v-if="errors.email" class="field-error" role="alert">{{ errors.email }}</p>

    <label>
      message
      <textarea v-model="form.message" maxlength="1000" rows="5" :aria-invalid="!!errors.message" />
    </label>
    <small>{{ form.message.length }}/1000</small>
    <p v-if="errors.message" class="field-error" role="alert">{{ errors.message }}</p>

    <p v-if="sendError" role="alert">{{ sendError }}</p>
    <button type="submit" :disabled="sending">{{ sending ? 'sending…' : 'send message' }}</button>
  </form>
</template>

<style scoped>
.contact {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 480px;
}
.field-error {
  margin: 0;
  color: #ff8fc8;
}
/* "thank you" message, like the success toast in Figma */
.sent {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  max-width: 480px;
  padding: 20px;
  color: #ffffff;
  background: rgba(30, 8, 56, 0.9);
  border: 1.5px solid rgba(215, 184, 255, 0.7);
  border-radius: 20px;
  box-shadow: 0 0 12px rgba(215, 184, 255, 0.35);
}
.sent p {
  margin: 0;
}
</style>
