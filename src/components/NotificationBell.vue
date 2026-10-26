<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useNotifications } from '@/composables/useNotifications'
import { formatDate } from '@/lib/format'

const { items, unread, loading, load, markSeen } = useNotifications()
const route = useRoute()
const open = ref(false)

onMounted(load)

// Refresh when you go to another page (and close the list)
watch(
  () => route.fullPath,
  () => {
    open.value = false
    load()
  },
)

function toggle() {
  open.value = !open.value
  if (open.value && unread.value) markSeen()
}
</script>

<template>
  <div class="bell">
    <button
      type="button"
      :aria-expanded="open"
      :aria-label="`notifications, ${unread} new`"
      @click="toggle"
    >
      𖦹 <span v-if="unread" class="count">{{ unread }}</span>
    </button>

    <div v-if="open" class="panel" role="region" aria-label="notifications">
      <p v-if="loading">loading…</p>
      <p v-else-if="items.length === 0">no notifications yet ♥</p>
      <ul v-else>
        <li v-for="n in items" :key="n.$id">
          <RouterLink :to="`/wall/${n.stripId}`">{{ n.text }}</RouterLink>
          <small>{{ formatDate(n.$createdAt) }}</small>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.bell {
  position: relative;
}
.count {
  padding: 1px 6px;
  border-radius: 999px;
  background: #c0145b;
  color: white;
  font-size: 12px;
}
.panel {
  position: absolute;
  right: 0;
  z-index: 10;
  width: 320px;
  max-width: 90vw;
  max-height: 60vh;
  overflow-y: auto;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 12px;
  background: white;
}
.panel ul {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.panel small {
  display: block;
  opacity: 0.7;
}
</style>
