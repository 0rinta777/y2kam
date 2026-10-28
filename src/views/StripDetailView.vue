<script setup>
import { ref, watch } from 'vue'
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

// Load the strip. A counter makes sure an old, slow request
// can't overwrite a newer one when you jump between strips.
let lastRequest = 0
async function load() {
  const request = ++lastRequest
  loading.value = true
  error.value = ''
  try {
    const found = await getStrip(route.params.id)
    if (request === lastRequest) strip.value = found
  } catch (e) {
    if (request !== lastRequest) return
    // 404 = doesn't exist, 401 = private strip you're not allowed to see
    error.value =
      e.code === 404 || e.code === 401
        ? "this strip doesn't exist or is private."
        : "couldn't load this strip. try again."
  } finally {
    if (request === lastRequest) loading.value = false
  }
}

// Load now, and again whenever the strip in the URL changes
watch(
  () => route.params.id,
  () => {
    reported.value = false
    reporting.value = false
    load()
  },
  { immediate: true },
)

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
        <p>
          by <RouterLink :to="`/u/${strip.userId}`">{{ strip.username || 'someone' }}</RouterLink> ·
          {{ formatDate(strip.$createdAt) }}
        </p>
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
}
.detail > a {
  align-self: flex-start;
  padding: 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  text-decoration: none;
}
/* Two columns: the strip on the left, info + comments on the right */
.strip {
  display: flex;
  flex-wrap: wrap;
  gap: 40px;
  align-items: flex-start;
}
.strip img {
  max-height: calc(100svh - 210px); /* whole strip visible without scrolling */
  max-width: 100%;
  min-width: 160px;
  border: 6px solid #ffffff;
  border-radius: 20px;
  box-shadow: 0 0 15px rgba(199, 125, 255, 0.55);
  /* if the photo can't load: purple box instead of the caption text */
  color: transparent;
  background: linear-gradient(127deg, #5b1f9e 0%, #2a0a4e 71%);
}
/* Info card: title + "by" on top, then the buttons in one row */
.info {
  flex: 1;
  min-width: 280px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 28px;
  background: rgba(30, 8, 56, 0.74);
  border: 1.5px solid rgba(215, 184, 255, 0.45);
  border-radius: 28px;
  box-shadow: 0 0 30px rgba(157, 77, 230, 0.35);
  backdrop-filter: blur(12px);
}
.info h1 {
  flex-basis: 100%;
  margin: 0;
  font-size: clamp(28px, 4vw, 40px);
}
.info > p {
  flex-basis: 100%;
  margin: 0 0 4px;
  color: #dcc9ff;
}
.info p a {
  color: #ffffff;
}
/* "open full size" looks like the other pill buttons */
.info > a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 10px 20px;
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
  text-decoration: none;
  background: rgba(18, 5, 31, 0.7);
  border: 2px solid #d7b8ff;
  border-radius: 999px;
}
.info > a:hover {
  background: rgba(163, 92, 230, 0.35);
}
/* Liked heart: pink */
.info > button[aria-pressed='true'] {
  background: rgba(255, 143, 200, 0.25);
  border-color: #ff8fc8;
}
/* Comments get their own full-width part */
.info > :deep(.comments) {
  flex-basis: 100%;
  margin-top: 8px;
  padding-top: 18px;
  border-top: 1px solid rgba(215, 184, 255, 0.2);
}
/* "report" is small and pink, at the bottom */
.info > button:last-child:not([aria-pressed]) {
  min-height: 36px;
  margin-top: 4px;
  padding: 6px 16px;
  font-size: 13px;
  color: #ffd3ea;
  background: transparent;
  border: 1px solid rgba(255, 143, 200, 0.6);
  box-shadow: none;
}
.info > p[role='status'] {
  margin-top: 4px;
}

/* Laptop/desktop: the whole page fits on one screen, no scrolling.
   If there are lots of comments, the info card scrolls inside itself. */
@media (min-width: 701px) {
  .detail {
    gap: 8px;
    margin-bottom: -48px; /* skip the page's empty bottom space */
  }
  .detail > a {
    padding: 4px 0;
  }
  .info {
    max-height: calc(100svh - 210px);
    overflow-y: auto;
  }
}

@media (max-width: 700px) {
  .strip {
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }
  .strip img {
    position: static;
    width: min(240px, 70vw);
    max-height: none;
  }
  .info {
    min-width: 0;
    width: 100%;
    padding: 20px;
  }
}
</style>
