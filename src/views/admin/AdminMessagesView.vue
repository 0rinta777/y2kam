<script setup>
import { onMounted } from 'vue'
import { useMessages } from '@/composables/useMessages'
import { formatDate } from '@/lib/format'

const { messages, loading, error, loadAll, markRead, remove } = useMessages()

onMounted(loadAll)

async function onRead(msg) {
  try {
    await markRead(msg)
  } catch (e) {
    console.error('mark read failed:', e)
  }
}

async function onDelete(msg) {
  if (!confirm(`delete the message from ${msg.name}?`)) return
  try {
    await remove(msg)
  } catch (e) {
    console.error('delete message failed:', e)
  }
}
</script>

<template>
  <section>
    <h1>messages</h1>

    <p v-if="loading">loading messages…</p>

    <div v-else-if="error" role="alert">
      <p>{{ error }}</p>
      <button @click="loadAll">try again</button>
    </div>

    <p v-else-if="messages.length === 0" class="empty">no messages yet ♥</p>

    <ul v-else class="list">
      <li v-for="msg in messages" :key="msg.$id" :class="{ unread: msg.status === 'new' }">
        <p>
          <strong>{{ msg.name }}</strong> · <a :href="`mailto:${msg.email}`">{{ msg.email }}</a> ·
          {{ formatDate(msg.$createdAt) }}
          <span v-if="msg.status === 'new'" class="badge">new</span>
        </p>
        <p class="text">{{ msg.message }}</p>
        <div class="actions">
          <a :href="`mailto:${msg.email}?subject=re: your message to y2kam`">reply by email</a>
          <button v-if="msg.status === 'new'" @click="onRead(msg)">mark as read</button>
          <button @click="onDelete(msg)">delete</button>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.list li {
  padding: 18px;
  background: rgba(28, 11, 51, 0.92);
  border: 1px solid rgba(215, 184, 255, 0.14);
  border-radius: 18px;

}
.list li p {
  margin: 0 0 6px;
}
/* Unread = purple border */
.unread {
  border-color: #9b4fe0 !important;
  box-shadow: inset 4px 0 0 #9b4fe0;
}
.badge {
  margin-left: 6px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
  background: #9b4fe0;
  border-radius: 999px;
}
.text {
  white-space: pre-line; /* keep line breaks from the message */
  color: #ffffff;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}
/* delete = pink outline */
.actions button:last-child {
  color: #ffd3ea;
  background: transparent;
  border-color: rgba(255, 143, 200, 0.7);
}
.empty {
  padding: 56px 24px;
  font-family: var(--font-display);
  font-size: 26px;
  color: #ffffff;
  text-align: center;
  background: rgba(28, 11, 51, 0.92);
  border: 1px solid rgba(215, 184, 255, 0.14);
  border-radius: 18px;

}
</style>
