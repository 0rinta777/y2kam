<script setup>
import { ref } from 'vue'
import { useCamera } from '@/composables/useCamera'
import { FILTERS } from '@/lib/filters'
import { useAuth } from '@/composables/useAuth'
import { useStrips } from '@/composables/useStrips'
import { buildStrip, canvasToBlob } from '@/lib/strip'

const { videoEl, error, starting, isOn, start, stop, capture } = useCamera()
const { isLoggedIn } = useAuth()
const { createStrip } = useStrips()

const PHOTO_COUNT = 4
const filter = ref(FILTERS[0]) // the chosen filter
const step = ref('idle') // idle → ready → shooting → done
const countdown = ref(0) // 3, 2, 1 shown on top of the camera
const photosTaken = ref(0)
const flash = ref(false) // white flash after each photo
const stripCanvas = ref(null) // the finished strip (used for saving later)
const stripUrl = ref('') // the finished strip as an image the <img> can show
// Saving
const caption = ref('')
const saving = ref(false)
const saveError = ref('')
const saved = ref(false)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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

async function openCamera() {
  await start()
  if (isOn.value) step.value = 'ready'
}

// Countdown, take 4 photos, build the strip
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

  stripCanvas.value = await buildStrip(photos)
  stripUrl.value = stripCanvas.value.toDataURL('image/jpeg', 0.9)
  stop() // camera off once we're done
  step.value = 'done'
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

    <!-- Camera view. Always in the page (v-show, not v-if) so useCamera can reach the <video> -->
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

    <!-- Step 2: pick a filter and shoot -->
    <section v-if="step === 'ready'">
      <div class="filters" role="group" aria-label="filters">
        <button
          v-for="f in FILTERS"
          :key="f.name"
          :aria-pressed="filter.name === f.name"
          @click="filter = f"
        >
          {{ f.name }}
        </button>
      </div>
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
        <!-- Saved -->
        <template v-if="saved">
          <p role="status">saved to your gallery ♥</p>
          <RouterLink to="/gallery">go to my gallery</RouterLink>
          <button @click="retake">take another</button>
        </template>

        <!-- Logged in: caption + save -->
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

        <!-- Guest -->
        <template v-else>
          <p>log in to save strips to your gallery</p>
          <RouterLink to="/login?redirect=/booth">log in or sign up</RouterLink>
          <button @click="retake">retake</button>
        </template>

        <!-- Everyone can download -->
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
  transform: scaleX(-1); /* mirror, like a selfie */
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
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.filters button[aria-pressed='true'] {
  font-weight: bold;
  outline: 2px solid currentColor;
}
.result {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}
.strip {
  width: 200px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
