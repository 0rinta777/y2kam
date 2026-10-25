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
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.6);
  padding: 16px;
}
.modal {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  max-width: 560px;
  max-height: 90vh; /* never taller than the screen */
  overflow-y: auto; /* scroll inside the popup if needed */
  padding: 24px;
  border-radius: 16px;
  background: white;
}
.modal img {
  width: auto;
  max-height: 280px; /* keeps the tall strip small */
  border-radius: 8px;
}
.fields {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.buttons {
  display: flex;
  gap: 8px;
}
</style>
