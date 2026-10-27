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
.bell > button {
  min-height: 40px;
  padding: 6px 14px;
}
.count {
  padding: 1px 7px;
  border-radius: 999px;
  background: #ff8fc8;
  color: #12051f;
  font-size: 12px;
  font-weight: 700;
}
.panel {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  z-index: 30;
  width: 320px;
  max-width: 90vw;
  max-height: 60vh;
  overflow-y: auto;
  padding: 16px;
  color: #eadcff;
  background: #1e0838;
  border: 1.5px solid rgba(215, 184, 255, 0.45);
  border-radius: 20px;
  box-shadow: 0 0 30px rgba(157, 77, 230, 0.45);
}
.panel ul {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.panel li {
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(215, 184, 255, 0.15);
}
.panel li:last-child {
  padding-bottom: 0;
  border-bottom: none;
}
.panel a {
  color: #ffffff;
  text-decoration: none;
}
.panel a:hover {
  text-decoration: underline;
}
.panel small {
  display: block;
  opacity: 0.7;
}
@media (max-width: 900px) {
  .panel {
    left: 0;
    right: auto;
  }
}
</style>
