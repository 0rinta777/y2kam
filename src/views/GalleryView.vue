<script setup>
import { ref, onMounted } from 'vue'
import { useStrips } from '@/composables/useStrips'
import StripCard from '@/components/StripCard.vue'
import EditStripModal from '@/components/EditStripModal.vue'

const { strips, loading, error, loadMine, updateStrip, deleteStrip } = useStrips()

const editing = ref(null) // the strip being edited (null = modal closed)
const saving = ref(false)
const editError = ref('')
const message = ref('') // short feedback after an action ("toast")

onMounted(loadMine)

function showMessage(text) {
  message.value = text
  setTimeout(() => (message.value = ''), 3000)
}

function openEdit(strip) {
  editError.value = ''
  editing.value = strip
}

// UPDATE
async function saveEdit(changes) {
  saving.value = true
  editError.value = ''
  try {
    await updateStrip(editing.value, changes)
    editing.value = null
    showMessage(changes.isPublic ? 'saved, and it is on the wall ♥' : 'saved ♥')
  } catch (e) {
    console.error('update failed:', e)
    editError.value = "couldn't save changes. try again."
  } finally {
    saving.value = false
  }
}

// DELETE
async function remove(strip) {
  const name = strip.caption || 'this strip'
  if (!confirm(`delete "${name}"? it will be gone for good.`)) return
  try {
    await deleteStrip(strip)
    showMessage('strip deleted')
  } catch (e) {
    console.error('delete failed:', e)
    showMessage("couldn't delete the strip. try again.")
  }
}
</script>

<template>
  <main class="gallery">
    <header>
      <h1>my gallery</h1>
      <RouterLink to="/booth">+ new strip</RouterLink>
    </header>

    <!-- Feedback after actions -->
    <p v-if="message" role="status" class="toast">{{ message }}</p>

    <!-- Loading -->
    <p v-if="loading">loading your strips…</p>

    <!-- Error -->
    <div v-else-if="error" role="alert">
      <p>{{ error }}</p>
      <button @click="loadMine">try again</button>
    </div>

    <!-- Empty -->
    <div v-else-if="strips.length === 0" class="empty">
      <p>no strips yet ♥</p>
      <RouterLink to="/booth">take your first one in the booth</RouterLink>
    </div>

    <!-- The strips -->
    <div v-else class="grid">
      <StripCard
        v-for="strip in strips"
        :key="strip.$id"
        :strip="strip"
        editable
        @edit="openEdit"
        @delete="remove"
      />
    </div>

    <!-- Edit popup -->
    <EditStripModal
      v-if="editing"
      :strip="editing"
      :saving="saving"
      :error="editError"
      @close="editing = null"
      @save="saveEdit"
    />
  </main>
</template>

<style scoped>
.gallery {
  padding: 16px;
}
header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}
.toast {
  padding: 8px 12px;
  border-radius: 8px;
  background: #eee;
}
.empty {
  padding: 40px 0;
  text-align: center;
}
</style>
