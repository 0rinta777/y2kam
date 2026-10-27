<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useCamera } from '@/composables/useCamera'
import { useAuth } from '@/composables/useAuth'
import { useStrips } from '@/composables/useStrips'
import { useCatalog, fileUrl } from '@/composables/useCatalog'
import { toCss } from '@/lib/filters'
import { buildStrip } from '@/lib/strip'
import OptionPicker from '@/components/OptionPicker.vue'

const router = useRouter()
const { videoEl, error, starting, isOn, start, stop, capture } = useCamera()
const { isLoggedIn } = useAuth()
const { createStrip } = useStrips()
const { items: catalog, loadActive } = useCatalog()

// --- Filters and frames from Appwrite ---
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

// --- Booth state ---
const PHOTO_COUNT = 4
const filter = ref(NO_FILTER)
const frame = ref(NO_FRAME)
const step = ref('idle') // idle → ready → shooting → done
const countdown = ref(0)
const photosTaken = ref(0)
const flash = ref(false)
const stripCanvas = ref(null)
const stripUrl = ref('')
const usedFilter = ref('') // filter name of the finished strip
const shootError = ref('') // shown if something goes wrong while shooting

// --- Saving ---
const caption = ref('')
const saving = ref(false)
const saveError = ref('')
const saved = ref(false)

// --- Guest strip kept through login ---
const PENDING_KEY = 'y2kam-pending-strip'
const restored = ref(false)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

onMounted(() => {
  loadActive()
  restorePending()
})

// If you leave the page mid-countdown, the shooting loop stops
let cancelled = false
onBeforeUnmount(() => {
  cancelled = true
})

// After login: bring back the strip the guest took before logging in
function restorePending() {
  if (!isLoggedIn.value) return
  try {
    const pending = JSON.parse(sessionStorage.getItem(PENDING_KEY))
    if (!pending) return
    stripUrl.value = pending.url
    usedFilter.value = pending.filter
    step.value = 'done'
    restored.value = true
    sessionStorage.removeItem(PENDING_KEY)
  } catch (e) {
    console.error('restore failed:', e)
  }
}

// Guest clicks "log in to save": keep the strip in this tab, then go to login
function keepForLogin() {
  try {
    sessionStorage.setItem(
      PENDING_KEY,
      JSON.stringify({ url: stripUrl.value, filter: usedFilter.value }),
    )
  } catch (e) {
    console.error('could not keep strip:', e)
  }
  router.push('/login?redirect=/booth')
}

async function openCamera() {
  await start()
  if (isOn.value) step.value = 'ready'
}

// Countdown, take 4 photos, build the strip.
// try/catch/finally: whatever happens, the camera turns off and the booth never gets stuck.
async function takePhotos() {
  step.value = 'shooting'
  shootError.value = ''
  photosTaken.value = 0
  const photos = []

  try {
    for (let i = 0; i < PHOTO_COUNT; i++) {
      for (let n = 3; n > 0; n--) {
        if (cancelled) return
        countdown.value = n
        await sleep(1000)
      }
      if (cancelled) return
      countdown.value = 0
      photos.push(capture(filter.value.css))
      photosTaken.value = i + 1

      flash.value = true
      await sleep(150)
      flash.value = false
      await sleep(500)
    }

    usedFilter.value = filter.value.name
    stripCanvas.value = await buildStrip(photos, frame.value.url)
    stripUrl.value = stripCanvas.value.toDataURL('image/jpeg', 0.9)
    step.value = 'done'
  } catch (e) {
    console.error('shooting failed:', e)
    shootError.value = 'something went wrong while taking your photos. try again ♥'
    step.value = 'idle'
  } finally {
    countdown.value = 0
    flash.value = false
    stop() // camera off in every case: finished, failed or cancelled
  }
}

async function save() {
  saving.value = true
  saveError.value = ''
  try {
    // Turn the strip image back into a file (works for new AND restored strips)
    const blob = await (await fetch(stripUrl.value)).blob()
    await createStrip(blob, { caption: caption.value.trim(), filter: usedFilter.value })
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
  shootError.value = ''
  restored.value = false
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
      <p v-if="shootError" role="alert">{{ shootError }}</p>
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
          <p v-if="restored" role="status">welcome back ♥ your strip is ready to save</p>
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
          <button @click="keepForLogin">log in or sign up to save it</button>
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
