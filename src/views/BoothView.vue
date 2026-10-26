<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCamera } from '@/composables/useCamera'
import { useAuth } from '@/composables/useAuth'
import { useStrips } from '@/composables/useStrips'
import { useCatalog, fileUrl } from '@/composables/useCatalog'
import { toCss } from '@/lib/filters'
import { buildStrip, canvasToBlob } from '@/lib/strip'
import OptionPicker from '@/components/OptionPicker.vue'

const { videoEl, error, starting, isOn, start, stop, capture } = useCamera()
const { isLoggedIn } = useAuth()
const { createStrip } = useStrips()
const { items: catalog, loadActive } = useCatalog()

// Load the active filters and frames the admin made
onMounted(loadActive)

// "none" options always exist, the rest come from Appwrite
const NO_FILTER = { id: 'none', name: 'none', css: 'none' }
const NO_FRAME = { id: 'none', name: 'no frame', url: null }

const filters = computed(() => [
  NO_FILTER,
  ...catalog.value
    .filter((item) => item.type === 'filter')
    .map((item) => ({ id: item.$id, name: item.name, css: toCss(item.settings) })),
])

const frames = computed(() => [
  NO_FRAME,
  ...catalog.value
    .filter((item) => item.type === 'frame' && item.fileId)
    .map((item) => ({ id: item.$id, name: item.name, url: fileUrl(item.fileId) })),
])

const PHOTO_COUNT = 4
const filter = ref(NO_FILTER) // the chosen filter
const frame = ref(NO_FRAME) // the chosen frame
const step = ref('idle') // idle → ready → shooting → done
const countdown = ref(0)
const photosTaken = ref(0)
const flash = ref(false)
const stripCanvas = ref(null)
const stripUrl = ref('')

// Saving
const caption = ref('')
const saving = ref(false)
const saveError = ref('')
const saved = ref(false)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function openCamera() {
  await start()
  if (isOn.value) step.value = 'ready'
}

// Countdown, take 4 photos, build the strip (with the frame on top)
async function takePhotos() {
  step.value = 'shooting'
  photosTaken.value = 0
  const photos = []

  for (let i = 0; i < PHOTO_COUNT; i++) {
    for (let n = 3; n > 0; n--) {
      countdown.value = n
      await sleep(1000)
    }
    countdown.value = 0
    photos.push(capture(filter.value.css))
    photosTaken.value = i + 1

    flash.value = true
    await sleep(150)
    flash.value = false
    await sleep(500)
  }

  stripCanvas.value = await buildStrip(photos, frame.value.url)
  stripUrl.value = stripCanvas.value.toDataURL('image/jpeg', 0.9)
  stop()
  step.value = 'done'
}

async function save() {
  saving.value = true
  saveError.value = ''
  try {
    const blob = await canvasToBlob(stripCanvas.value)
    await createStrip(blob, { caption: caption.value.trim(), filter: filter.value.name })
    saved.value = true
  } catch (e) {
    console.error('save failed:', e)
    saveError.value = "couldn't save your strip. check your connection and try again."
  } finally {
    saving.value = false
  }
}

async function retake() {
  stripCanvas.value = null
  stripUrl.value = ''
  caption.value = ''
  saved.value = false
  saveError.value = ''
  await openCamera()
}
</script>

<template>
  <main class="booth">
    <h1>booth</h1>

    <!-- Camera view. Always in the page (v-show) so useCamera can reach the <video> -->
    <div v-show="step === 'ready' || step === 'shooting'" class="camera">
      <video ref="videoEl" playsinline muted :style="{ filter: filter.css }" />
      <div v-if="countdown" class="countdown" aria-live="assertive">{{ countdown }}</div>
      <div v-if="flash" class="flash" />
    </div>

    <!-- Step 1: start -->
    <section v-if="step === 'idle'">
      <p>4 photos, 3 seconds each. strike a pose ♥</p>
      <button :disabled="starting" @click="openCamera">
        {{ starting ? 'starting camera…' : 'start camera' }}
      </button>
      <p v-if="error" role="alert">{{ error }}</p>
    </section>

    <!-- Step 2: pick a filter and frame, then shoot -->
    <section v-if="step === 'ready'">
      <OptionPicker v-model="filter" label="filter" :options="filters" />
      <OptionPicker v-model="frame" label="frame" :options="frames" />
      <button @click="takePhotos">take photos</button>
    </section>

    <!-- Step 3: shooting -->
    <p v-if="step === 'shooting'" aria-live="polite">
      photo {{ Math.min(photosTaken + 1, PHOTO_COUNT) }} of {{ PHOTO_COUNT }}
    </p>

    <!-- Step 4: result -->
    <section v-if="step === 'done'" class="result">
      <img :src="stripUrl" alt="your photo strip" class="strip" />

      <div class="actions">
        <template v-if="saved">
          <p role="status">saved to your gallery ♥</p>
          <RouterLink to="/gallery">go to my gallery</RouterLink>
          <button @click="retake">take another</button>
        </template>

        <template v-else-if="isLoggedIn">
          <label>
            caption
            <input v-model="caption" maxlength="120" placeholder="besties at the mall <3" />
          </label>
          <p v-if="saveError" role="alert">{{ saveError }}</p>
          <button :disabled="saving" @click="save">
            {{ saving ? 'saving…' : 'save to gallery' }}
          </button>
          <button :disabled="saving" @click="retake">retake</button>
        </template>

        <template v-else>
          <p>log in to save strips to your gallery</p>
          <RouterLink to="/login?redirect=/booth">log in or sign up</RouterLink>
          <button @click="retake">retake</button>
        </template>

        <a :href="stripUrl" download="y2kam-strip.jpg">download strip</a>
      </div>
    </section>
  </main>
</template>

<style scoped>
.booth {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  max-width: 720px;
}
.camera {
  position: relative;
  width: 100%;
  max-width: 640px;
}
.camera video {
  width: 100%;
  border-radius: 16px;
  background: #000;
  transform: scaleX(-1);
}
.countdown {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 120px;
  font-weight: bold;
  color: white;
  text-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}
.flash {
  position: absolute;
  inset: 0;
  background: white;
  border-radius: 16px;
}
.result {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}
.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.strip {
  width: 200px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}
</style>
