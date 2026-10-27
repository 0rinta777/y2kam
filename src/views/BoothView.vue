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
  // No start screen: the camera turns on straight away
  // (unless a saved guest strip was just brought back)
  if (step.value === 'idle') openCamera()
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
  // Left the page while the camera was still starting? Turn it off again.
  if (cancelled) return stop()
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
    <div
      v-show="step === 'ready' || step === 'shooting' || starting"
      class="camera"
      :class="{ loading: starting }"
    >
      <video ref="videoEl" playsinline muted :style="{ filter: filter.css }" />
      <p v-if="starting" class="camera-msg">starting camera… ♥</p>
      <div v-if="countdown" class="countdown" aria-live="assertive">{{ countdown }}</div>
      <div v-if="flash" class="flash" />
    </div>

    <!-- Step 1: the camera is starting by itself. Only if it fails: a "try again" button -->
    <section v-if="step === 'idle' && !starting">
      <p>the camera is off</p>
      <button @click="openCamera">try again</button>
      <p v-if="error" role="alert">{{ error }}</p>
      <p v-if="shootError" role="alert">{{ shootError }}</p>
    </section>

    <!-- Step 2: pick a filter and frame, then shoot -->
    <section v-if="step === 'ready' || starting">
      <OptionPicker v-model="filter" label="filter" :options="filters" />
      <OptionPicker v-model="frame" label="frame" :options="frames" />
      <button :disabled="step !== 'ready'" @click="takePhotos">take photos</button>
    </section>

    <!-- Step 3: shooting -->
    <p v-if="step === 'shooting'" aria-live="polite">
      photo {{ Math.min(photosTaken + 1, PHOTO_COUNT) }} of {{ PHOTO_COUNT }}
    </p>

    <!-- Step 4: result -->
    <section v-if="step === 'done'" class="result">
      <h2>your strip is ready!</h2>
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
/* One centred column, like the Figma booth */
.booth {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 22px;
  max-width: 900px;
  margin: 0 auto;
  text-align: center;
}

/* ---- Step 1: before the camera starts ----
   Looks like the camera screen, with the start button inside */
.booth > section:not(.result):has(> p) {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  width: 100%;
  aspect-ratio: 16 / 9;
  padding: 32px 24px;
  background: linear-gradient(135deg, #3a0f78 0%, #1a0633 60%, #12051f 100%);
  border: 6px solid #ffffff;
  border-radius: 32px;
  box-shadow:
    0 0 26px rgba(199, 125, 255, 0.75),
    inset 0 0 40px rgba(0, 0, 0, 0.35);
}
.booth > section:not(.result) > p {
  margin: 0;
  font-size: clamp(17px, 2.4vw, 22px);
  font-weight: 500;
  color: #ffffff;
}
.booth > section:not(.result) > p[role='alert'] {
  max-width: 480px;
  font-size: 15px;
  color: #ff8fc8;
}

/* ---- Camera ---- */
.camera {
  position: relative;
  width: 100%;
}
.camera video {
  display: block;
  width: 100%;
  /* no cropping: you see exactly what the photo will show */
  background: linear-gradient(135deg, #3a0f78 0%, #1a0633 60%, #12051f 100%);
  border: 6px solid #ffffff;
  border-radius: 32px;
  box-shadow:
    0 0 26px rgba(199, 125, 255, 0.75),
    inset 0 0 40px rgba(0, 0, 0, 0.35);
  transform: scaleX(-1);
}
/* While the camera is starting: message in the middle of the frame */
.camera-msg {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  margin: 0;
  font-size: clamp(17px, 2.4vw, 22px);
  font-weight: 600;
  color: #ffffff;
}
/* 3, 2, 1 in the logo font */
.countdown {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-family: var(--font-display);
  font-size: clamp(100px, 20vw, 190px);
  color: #ffffff;
  text-shadow: 0 0 30px rgba(199, 125, 255, 0.95);
}
.flash {
  position: absolute;
  inset: 0;
  background: #ffffff;
  border-radius: 32px;
}

/* ---- Step 2: filter + frame + take photos, under the camera ---- */
.booth > section:not(.result):not(:has(> p)) {
  display: flex;
  flex-wrap: wrap; /* filter + frame side by side when there's room */
  justify-content: center;
  align-items: center;
  gap: 12px;
  width: 100%;
}
.booth > section:not(.result):not(:has(> p)) > button {
  flex-basis: 100%;
  max-width: 280px;
}

/* ---- While the camera is on: everything fits on one screen, no scrolling ----
   No title, and the camera gets whatever height is left after the nav + controls. */
.booth:has(> .camera:not([style*='none'])) {
  gap: 14px;
  margin-top: -8px;
  margin-bottom: -56px; /* skip the page's empty bottom space */
}
/* No visible title on the booth (screen readers still read it) */
.booth > h1 {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: 0;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
.booth:has(> .camera:not([style*='none'])) .camera {
  width: fit-content; /* frame + countdown hug the video */
  max-width: 100%;
}
.booth:has(> .camera:not([style*='none'])) .camera video {
  width: auto;
  max-width: 100%;
  max-height: max(220px, calc(100svh - 270px));
  margin: 0 auto;
}
/* While the camera is starting: same frame size as the real camera, so nothing jumps */
.booth:has(> .camera:not([style*='none'])) .camera.loading {
  width: min(100%, calc((100svh - 270px) * 16 / 9));
}
.booth:has(> .camera:not([style*='none'])) .camera.loading video {
  width: 100%;
  aspect-ratio: 16 / 9;
}

/* Main buttons: start camera, take photos */
.booth > section:not(.result) > button {
  overflow: hidden;
  min-width: 200px;
  min-height: 54px;
  padding: 14px 40px;
  font-size: 18px;
  background: linear-gradient(180deg, #d08bff 0%, #b763ea 50%, #7b2fc9 100%);
  border: 1.5px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 0 16px rgba(199, 125, 255, 0.85);
}
.booth > section:not(.result) > button::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 8px;
  right: 8px;
  height: 45%;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0.05));
  pointer-events: none;
}

/* "photo 2 of 4" as a pill */
.booth > p[aria-live] {
  margin: 0;
  padding: 10px 24px;
  font-weight: 700;
  color: #ffffff;
  background: rgba(18, 5, 31, 0.7);
  border: 1.5px solid rgba(215, 184, 255, 0.6);
  border-radius: 999px;
}

/* ---- Step 3: result, like the Figma "your strip is ready!" ---- */
.result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  width: 100%;
}
.result h2 {
  margin: 0;
  font-size: clamp(32px, 5vw, 48px);
  filter: drop-shadow(0 0 12px rgba(199, 125, 255, 0.6));
}
.strip {
  width: 260px;
  border: 6px solid #ffffff;
  border-radius: 20px;
  box-shadow: 0 0 26px rgba(199, 125, 255, 0.75);
}
/* Actions under the strip: caption on top, buttons in one row */
.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 620px;
}
.actions p,
.actions label {
  flex-basis: 100%;
  margin: 0;
}
.actions label {
  max-width: 420px;
  text-align: left;
}
/* Save / take another / log in to save = main button */
.actions > button:first-of-type {
  overflow: hidden;
  min-width: 200px;
  min-height: 54px;
  padding: 14px 40px;
  font-size: 18px;
  background: linear-gradient(180deg, #d08bff 0%, #b763ea 50%, #7b2fc9 100%);
  border: 1.5px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 0 16px rgba(199, 125, 255, 0.85);
}
.actions > button:first-of-type::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 8px;
  right: 8px;
  height: 45%;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0.05));
  pointer-events: none;
}
/* Links (download, go to my gallery) look like the dark pill buttons */
.actions > a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 22px;
  font-weight: 700;
  color: #ffffff;
  text-decoration: none;
  background: rgba(18, 5, 31, 0.7);
  border: 2px solid #d7b8ff;
  border-radius: 999px;
}
.actions > a:hover {
  background: rgba(163, 92, 230, 0.35);
}

/* ---- Phones ---- */
@media (max-width: 600px) {
  .booth:has(> .camera:not([style*='none'])) .camera video {
    max-height: max(200px, calc(100svh - 350px));
  }
  .booth > section:not(.result):has(> p) {
    aspect-ratio: 4 / 3;
  }
  .camera video,
  .flash,
  .booth > section:not(.result):has(> p) {
    border-width: 4px;
    border-radius: 22px;
  }
  .booth > section:not(.result) > button,
  .actions > button:first-of-type {
    width: 100%;
  }
  .strip {
    width: 210px;
  }
}
</style>
