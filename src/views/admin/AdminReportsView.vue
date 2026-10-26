<script setup>
import { onMounted } from 'vue'
import { useReports } from '@/composables/useReports'
import { imageUrl } from '@/composables/useStrips'

const { reports, loading, error, loadOpen, resolve, removeStrip } = useReports()

onMounted(loadOpen)

function formatDate(iso) {
  return new Date(iso)
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    .toLowerCase()
}

async function onRemove(report) {
  if (!confirm('remove this strip for good?')) return
  try {
    await removeStrip(report)
  } catch (e) {
    console.error('remove failed:', e)
    alert("couldn't remove the strip. try again.")
  }
}

async function onKeep(report) {
  try {
    await resolve(report)
  } catch (e) {
    console.error('resolve failed:', e)
    alert("couldn't update the report. try again.")
  }
}
</script>

<template>
  <section>
    <h1>reports</h1>

    <p v-if="loading">loading reports…</p>

    <div v-else-if="error" role="alert">
      <p>{{ error }}</p>
      <button @click="loadOpen">try again</button>
    </div>

    <div v-else-if="reports.length === 0" class="empty">
      <p>no open reports ♥</p>
      <p>the wall is behaving. new reports will show up here.</p>
    </div>

    <ul v-else class="list">
      <li v-for="report in reports" :key="report.$id" class="report">
        <img
          v-if="report.strip"
          :src="imageUrl(report.strip.imageId)"
          :alt="report.strip.caption || 'reported strip'"
          class="thumb"
        />
        <div class="info">
          <p>
            <strong>{{ report.reason }}</strong> · {{ formatDate(report.$createdAt) }}
          </p>
          <p v-if="report.strip">
            "{{ report.strip.caption || 'untitled strip' }}" by
            {{ report.strip.username || 'someone' }}
          </p>
          <p v-else>the strip was already deleted</p>
          <p v-if="report.note">note: {{ report.note }}</p>
          <div class="actions">
            <button v-if="report.strip" @click="onRemove(report)">remove strip</button>
            <button @click="onKeep(report)">{{ report.strip ? 'keep it' : 'close report' }}</button>
          </div>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0;
  list-style: none;
}
.report {
  display: flex;
  gap: 16px;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 12px;
}
.thumb {
  height: 160px;
  border-radius: 8px;
}
.actions {
  display: flex;
  gap: 8px;
}
.empty {
  padding: 40px 0;
  text-align: center;
}
</style>
