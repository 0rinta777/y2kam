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
  padding: 0;
  list-style: none;
}
.list li {
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 12px;
}
.unread {
  border-color: #9b4fe0 !important;
}
.badge {
  padding: 2px 8px;
  border-radius: 999px;
  background: #9b4fe0;
  color: white;
  font-size: 12px;
}
.text {
  white-space: pre-line; /* keep line breaks from the message */
}
.actions {
  display: flex;
  gap: 12px;
  align-items: center;
}
.empty {
  padding: 40px 0;
  text-align: center;
}
</style>
