<script setup>
import { ref } from 'vue'
import { imageUrl } from '@/composables/useStrips'

const props = defineProps({
  strip: { type: Object, required: true },
  saving: { type: Boolean, default: false },
  error: { type: String, default: '' },
})
const emit = defineEmits(['close', 'save'])

// Local copies, so nothing changes until you press save
const caption = ref(props.strip.caption || '')
const isPublic = ref(props.strip.isPublic)

function submit() {
  emit('save', { caption: caption.value.trim(), isPublic: isPublic.value })
}
</script>

<template>
  <!-- Clicking the dark background closes the modal -->
  <div class="overlay" @click.self="emit('close')">
    <form
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-title"
      @submit.prevent="submit"
      @keydown.esc="emit('close')"
    >
      <img :src="imageUrl(strip.imageId)" :alt="strip.caption || 'photo strip'" />

      <div class="fields">
        <h2 id="edit-title">edit strip</h2>

        <label>
          caption
          <input v-model="caption" maxlength="120" autofocus />
        </label>
        <small>{{ caption.length }}/120</small>

        <fieldset>
          <legend>who can see it</legend>
          <label><input v-model="isPublic" type="radio" :value="false" /> only me</label>
          <label><input v-model="isPublic" type="radio" :value="true" /> on the wall ♥</label>
        </fieldset>

        <p v-if="error" role="alert">{{ error }}</p>

        <div class="buttons">
          <button type="button" :disabled="saving" @click="emit('close')">cancel</button>
          <button type="submit" :disabled="saving">{{ saving ? 'saving…' : 'save' }}</button>
        </div>
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
/* Popup card from the Figma "edit strip" modal */
.modal {
  display: flex;
  flex-wrap: wrap;
  gap: 28px;
  max-width: 640px;
  max-height: 90vh; /* never taller than the screen */
  overflow-y: auto; /* scroll inside the popup if needed */
  padding: 32px;
  color: #eadcff;
  background: rgba(30, 8, 56, 0.96);
  border: 1.5px solid rgba(215, 184, 255, 0.45);
  border-radius: 32px;
  box-shadow: 0 0 48px rgba(163, 92, 230, 0.35);
}
.modal img {
  align-self: flex-start;
  width: auto;
  max-height: 320px; /* keeps the tall strip small */
  border: 6px solid #ffffff;
  border-radius: 16px;
  box-shadow: 0 0 15px rgba(199, 125, 255, 0.55);
}
.fields {
  flex: 1;
  min-width: 240px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.fields h2 {
  font-size: 32px;
}
/* "who can see it" as a pill switch */
fieldset {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
fieldset label {
  flex: 1;
  justify-content: center;
  padding: 10px 14px;
  background: rgba(18, 5, 31, 0.7);
  border: 1.5px solid rgba(215, 184, 255, 0.25);
  border-radius: 999px;
  white-space: nowrap; /* "on the wall ♥" on one line */
  cursor: pointer;
}
fieldset label:has(input:checked) {
  color: #ffffff;
  font-weight: 700;
  background: linear-gradient(180deg, #c77dff, #7b2cbf);
  border-color: rgba(255, 255, 255, 0.6);
}
.buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 6px;
}
@media (max-width: 600px) {
  .modal {
    padding: 20px;
    border-radius: 24px;
  }
  .modal img {
    max-height: 220px;
    margin: 0 auto;
  }
}
</style>
