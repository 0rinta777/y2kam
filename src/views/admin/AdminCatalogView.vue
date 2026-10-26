<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCatalog, fileUrl } from '@/composables/useCatalog'
import { toCss } from '@/lib/filters'
import CatalogDrawer from '@/components/admin/CatalogDrawer.vue'

const { items, loading, error, loadAll, createItem, updateItem, deleteItem } = useCatalog()

const tab = ref('all') // all | filter | frame
const drawerOpen = ref(false)
const editingItem = ref(null) // null = adding new
const saving = ref(false)
const saveError = ref('')
const message = ref('')

onMounted(loadAll)

const shown = computed(() =>
  tab.value === 'all' ? items.value : items.value.filter((i) => i.type === tab.value),
)

function showMessage(text) {
  message.value = text
  setTimeout(() => (message.value = ''), 3000)
}

function openNew() {
  editingItem.value = null
  saveError.value = ''
  drawerOpen.value = true
}

function openEdit(item) {
  editingItem.value = item
  saveError.value = ''
  drawerOpen.value = true
}

// CREATE or UPDATE
async function save(data) {
  saving.value = true
  saveError.value = ''
  try {
    if (editingItem.value) {
      await updateItem(editingItem.value, data)
      showMessage(`${data.name} saved ♥`)
    } else {
      await createItem(data)
      showMessage(`${data.name} added ♥`)
    }
    drawerOpen.value = false
  } catch (e) {
    console.error('catalog save failed:', e)
    saveError.value = "couldn't save. check your connection and try again."
  } finally {
    saving.value = false
  }
}

// Quick on/off without opening the drawer
async function toggleActive(item) {
  try {
    await updateItem(item, { name: item.name, active: !item.active, settings: item.settings })
  } catch (e) {
    console.error('toggle failed:', e)
    showMessage("couldn't change it. try again.")
  }
}

// DELETE
async function remove(item) {
  if (!confirm(`delete "${item.name}"? it will disappear from the booth.`)) return
  try {
    await deleteItem(item)
    showMessage(`${item.name} deleted`)
  } catch (e) {
    console.error('delete failed:', e)
    showMessage("couldn't delete it. try again.")
  }
}
</script>

<template>
  <section>
    <header class="top">
      <h1>filters & frames</h1>
      <button @click="openNew">+ add new</button>
    </header>

    <div class="tabs" role="group" aria-label="show">
      <button :aria-pressed="tab === 'all'" @click="tab = 'all'">all</button>
      <button :aria-pressed="tab === 'filter'" @click="tab = 'filter'">filters</button>
      <button :aria-pressed="tab === 'frame'" @click="tab = 'frame'">frames</button>
    </div>

    <p v-if="message" role="status" class="toast">{{ message }}</p>

    <p v-if="loading">loading…</p>

    <div v-else-if="error" role="alert">
      <p>{{ error }}</p>
      <button @click="loadAll">try again</button>
    </div>

    <div v-else-if="shown.length === 0" class="empty">
      <p>nothing here yet ♥</p>
      <button @click="openNew">add the first one</button>
    </div>

    <table v-else>
      <thead>
        <tr>
          <th>preview</th>
          <th>name</th>
          <th>type</th>
          <th>status</th>
          <th><span class="sr-only">actions</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in shown" :key="item.$id">
          <td>
            <div
              v-if="item.type === 'filter'"
              class="swatch"
              :style="{ filter: toCss(item.settings) }"
            />
            <img
              v-else-if="item.fileId"
              :src="fileUrl(item.fileId)"
              :alt="item.name"
              class="thumb"
            />
          </td>
          <td>{{ item.name }}</td>
          <td>{{ item.type }}</td>
          <td>
            <button :aria-pressed="item.active" @click="toggleActive(item)">
              {{ item.active ? 'active' : 'off' }}
            </button>
          </td>
          <td class="actions">
            <button @click="openEdit(item)">edit</button>
            <button @click="remove(item)">delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <CatalogDrawer
      v-if="drawerOpen"
      :item="editingItem"
      :saving="saving"
      :error="saveError"
      @close="drawerOpen = false"
      @save="save"
    />
  </section>
</template>

<style scoped>
.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.tabs button[aria-pressed='true'] {
  font-weight: bold;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid #eee;
}
.swatch {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: linear-gradient(135deg, #ff8fc8, #9b4fe0, #3dadff);
}
.thumb {
  height: 64px;
}
.actions {
  display: flex;
  gap: 8px;
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
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
</style>
