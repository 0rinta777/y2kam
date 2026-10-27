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
  margin: 0;
  padding: 0;
  list-style: none;
}
.report {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  padding: 18px;
  background: rgba(28, 11, 51, 0.92);
  border: 1px solid rgba(215, 184, 255, 0.14);
  border-radius: 18px;

}
.thumb {
  height: 170px;
  border: 3px solid #ffffff;
  border-radius: 10px;
}
.info {
  flex: 1;
  min-width: 220px;
}
.info p {
  margin: 0 0 6px;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
/* "remove strip" = pink outline */
.actions button:first-child:not(:last-child) {
  color: #ffd3ea;
  background: transparent;
  border-color: rgba(255, 143, 200, 0.7);
}
/* Empty state from the Figma admin components */
.empty {
  padding: 56px 24px;
  text-align: center;
  background: rgba(28, 11, 51, 0.92);
  border: 1px solid rgba(215, 184, 255, 0.14);
  border-radius: 18px;

}
.empty p {
  margin: 0 0 6px;
}
.empty p:first-child {
  font-family: var(--font-display);
  font-size: 28px;
  color: #ffffff;
}
</style>
