<script setup>
import { ref } from 'vue'

defineProps({
  sending: { type: Boolean, default: false },
  error: { type: String, default: '' },
})
const emit = defineEmits(['close', 'submit'])

const REASONS = [
  { value: 'inappropriate', label: 'inappropriate or explicit' },
  { value: 'spam', label: 'spam or ads' },
  { value: 'harassment', label: 'bullying or harassment' },
  { value: 'other', label: 'something else' },
]

const reason = ref('')
const note = ref('')
const reasonError = ref('')

function submit() {
  if (!reason.value) {
    reasonError.value = 'pick a reason'
    return
  }
  reasonError.value = ''
  emit('submit', { reason: reason.value, note: note.value.trim() })
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <form
      class="dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-title"
      @submit.prevent="submit"
      @keydown.esc="emit('close')"
    >
      <h2 id="report-title">report this strip</h2>
      <p>what's wrong with it? an admin will take a look.</p>

      <fieldset>
        <legend>reason</legend>
        <label v-for="r in REASONS" :key="r.value">
          <input v-model="reason" type="radio" :value="r.value" />
          {{ r.label }}
        </label>
      </fieldset>
      <p v-if="reasonError" class="field-error" role="alert">{{ reasonError }}</p>

      <label>
        add a note (optional)
        <textarea v-model="note" maxlength="300" rows="3" placeholder="tell us more…" />
      </label>

      <p v-if="error" role="alert">{{ error }}</p>

      <div class="buttons">
        <button type="button" :disabled="sending" @click="emit('close')">cancel</button>
        <button type="submit" :disabled="sending">
          {{ sending ? 'sending…' : 'send report' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.6);
}
.dialog {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 420px;
  max-width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
  border-radius: 16px;
  background: white;
}
fieldset {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.field-error {
  margin: 0;
  color: #c0145b;
}
</style>
