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
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.top h1 {
  margin-bottom: 0 !important;
}
/* "+ add new" = flat purple */
.top > button {
  background: #9b4fe0 !important;
  border-color: #9b4fe0 !important;
}
.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 20px 0 16px;
}
/* Table in a card */
table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  overflow: hidden;
  background: rgba(28, 11, 51, 0.92);
  border: 1px solid rgba(215, 184, 255, 0.14);
  border-radius: 18px;
}
th,
td {
  padding: 12px 14px;
  text-align: left;
  vertical-align: middle;
  border-bottom: 1px solid rgba(215, 184, 255, 0.1);
}
th {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #d7b8ff;
  background: #140726;
}
tbody tr:last-child td {
  border-bottom: none;
}
tbody tr:hover td {
  background: rgba(183, 99, 234, 0.06);
}
.swatch {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: linear-gradient(135deg, #ff8fc8, #9b4fe0, #3dadff);
}
.thumb {
  height: 64px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
}
/* edit + delete side by side, but the cell stays a normal table cell */
.actions {
  white-space: nowrap;
  text-align: right;
}
.actions button + button {
  margin-left: 8px;
}
/* delete = pink outline */
.actions button:last-child {
  color: #ffd3ea;
  background: transparent;
  border-color: rgba(255, 143, 200, 0.7);
}
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 56px 24px;
  text-align: center;
  background: rgba(28, 11, 51, 0.92);
  border: 1px solid rgba(215, 184, 255, 0.14);
  border-radius: 18px;
}
.empty p {
  margin: 0;
  font-family: var(--font-display);
  font-size: 26px;
  color: #ffffff;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
/* Small screens: the table can scroll sideways */
@media (max-width: 700px) {
  table {
    display: block;
    overflow-x: auto;
  }
}
</style>
