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

// Quick publish / unpublish without opening the edit popup
async function togglePublic(strip) {
  try {
    await updateStrip(strip, { caption: strip.caption, isPublic: !strip.isPublic })
    showMessage(strip.isPublic ? 'now private' : 'posted to the wall ♥')
  } catch (e) {
    console.error('toggle failed:', e)
    showMessage("couldn't change it. try again.")
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
      <RouterLink to="/booth" class="btn-primary new-strip">+ new strip</RouterLink>
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
        @toggle-public="togglePublic"
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
/* ---- Laptop/desktop: smaller cards so your strips fit on one screen,
   header the same size as settings and about ---- */
@media (min-width: 701px) {
  .gallery {
    margin-top: -8px;
    margin-bottom: -48px; /* skip the page's empty bottom space */
  }
  header {
    margin-bottom: 18px;
  }
  header h1 {
    font-size: 40px;
  }
  .new-strip {
    padding: 10px 24px;
    font-size: 15px;
  }
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
    gap: 20px;
  }
  .empty {
    min-height: calc(100svh - 230px);
  }
}
header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 28px;
}
header h1 {
  margin-bottom: 0;
}
.new-strip {
  padding: 12px 28px;
  font-size: 16px;
  background: linear-gradient(180deg, #d08bff 0%, #b763ea 50%, #7b2fc9 100%);
  border: 1.5px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 0 12px rgba(199, 125, 255, 0.75);
  overflow: hidden;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 32px;
  align-items: start;
}
/* Empty state card */
.empty {
  display: flex;
  justify-content: center;
  min-height: 50vh; /* big empty-state box */
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 56px 24px;
  text-align: center;
  background: rgba(30, 8, 56, 0.6);
  border: 1.5px dashed rgba(215, 184, 255, 0.45);
  border-radius: 28px;
}
.empty p {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #ffffff;
}
</style>
