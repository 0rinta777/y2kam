<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useStrips, imageUrl } from '@/composables/useStrips'
import { useAuth } from '@/composables/useAuth'
import { useReports } from '@/composables/useReports'
import ReportDialog from '@/components/ReportDialog.vue'
import LikeButton from '@/components/LikeButton.vue'
import CommentSection from '@/components/CommentSection.vue'

const route = useRoute()
const { getStrip } = useStrips()

const strip = ref(null)
const loading = ref(true)
const error = ref('')

const { user } = useAuth()
const { createReport } = useReports()

// Reporting
const reporting = ref(false) // dialog open?
const sending = ref(false)
const reportError = ref('')
const reported = ref(false)
// Copy this strip's link to the clipboard
const copied = ref(false)
async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch (e) {
    console.error('copy failed:', e)
  }
}

async function sendReport({ reason, note }) {
  sending.value = true
  reportError.value = ''
  try {
    await createReport(strip.value.$id, reason, note)
    reporting.value = false
    reported.value = true
  } catch (e) {
    console.error('report failed:', e)
    reportError.value = "couldn't send the report. try again."
  } finally {
    sending.value = false
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    strip.value = await getStrip(route.params.id)
  } catch (e) {
    // 404 = doesn't exist, 401 = private strip you're not allowed to see
    error.value =
      e.code === 404 || e.code === 401
        ? "this strip doesn't exist or is private."
        : "couldn't load this strip. try again."
  } finally {
    loading.value = false
  }
}

onMounted(load)

function formatDate(iso) {
  return new Date(iso)
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    .toLowerCase()
}
</script>

<template>
  <main class="detail">
    <RouterLink to="/wall">← back to the wall</RouterLink>

    <p v-if="loading">loading strip…</p>

    <div v-else-if="error" role="alert">
      <p>{{ error }}</p>
      <button @click="load">try again</button>
    </div>

    <article v-else class="strip">
      <img :src="imageUrl(strip.imageId)" :alt="strip.caption || 'photo strip'" />
      <div class="info">
        <h1>{{ strip.caption || 'untitled strip' }}</h1>
        <p>by {{ strip.username || 'someone' }} · {{ formatDate(strip.$createdAt) }}</p>
        <a :href="imageUrl(strip.imageId)" target="_blank" rel="noopener">open full size</a>
        <button type="button" @click="copyLink">
          {{ copied ? 'link copied ♥' : 'copy link' }}
        </button>
        <LikeButton :strip-id="strip.$id" />
        <CommentSection :strip-id="strip.$id" />
        <!-- Report (not on your own strips) -->
        <p v-if="reported" role="status">thanks, an admin will take a look ♥</p>
        <button v-else-if="strip.userId !== user?.$id" @click="reporting = true">report</button>
      </div>
    </article>
    <ReportDialog
      v-if="reporting"
      :sending="sending"
      :error="reportError"
      @close="reporting = false"
      @submit="sendReport"
    />
  </main>
</template>

<style scoped>
.detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}
.strip {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}
.strip img {
  max-height: 80vh;
  border-radius: 12px;
}
.info h1 {
  margin-top: 0;
}
</style>
