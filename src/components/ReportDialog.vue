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
  z-index: 50;
  display: grid;
  grid-template-columns: minmax(0, 1fr); /* the popup can shrink on small phones */
  place-items: center;
  padding: 16px;
  background: rgba(13, 6, 20, 0.62);
  backdrop-filter: blur(4px);
}
/* Popup card from the Figma "report popup" component */
.dialog {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: min(460px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  padding: 32px;
  color: #eadcff;
  background: rgba(30, 8, 56, 0.96);
  border: 1.5px solid rgba(215, 184, 255, 0.45);
  border-radius: 28px;
  box-shadow: 0 0 40px rgba(163, 92, 230, 0.35);
}
.dialog h2 {
  font-size: 28px;
  margin: 0;
}
/* Reasons as rows you can pick */
fieldset {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0;
  border: none;
}
legend {
  margin-bottom: 8px;
  padding: 0;
}
fieldset label {
  padding: 14px 16px;
  background: rgba(18, 5, 31, 0.6);
  border: 1.5px solid rgba(215, 184, 255, 0.25);
  border-radius: 16px;
  cursor: pointer;
}
fieldset label:has(input:checked) {
  color: #ffffff;
  font-weight: 600;
  background: rgba(183, 99, 234, 0.22);
  border-color: #c77dff;
}
.buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}
.field-error {
  margin: 0;
  color: #ff8fc8;
}
@media (max-width: 600px) {
  .dialog {
    padding: 22px;
    border-radius: 24px;
  }
  .dialog h2 {
    font-size: 24px;
  }
  /* buttons side by side, full width, easy to tap */
  .buttons button {
    flex: 1;
  }
}
</style>
