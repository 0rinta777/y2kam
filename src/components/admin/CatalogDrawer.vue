<script setup>
import { ref, reactive, computed } from 'vue'
import { DEFAULT_SETTINGS, toCss } from '@/lib/filters'
import { fileUrl } from '@/composables/useCatalog'
import FilterEffects from '@/components/FilterEffects.vue'

const props = defineProps({
  item: { type: Object, default: null }, // null = adding a new item
  saving: { type: Boolean, default: false },
  error: { type: String, default: '' },
})
const emit = defineEmits(['close', 'save'])

const isNew = computed(() => !props.item)

// Form state (copies, so nothing changes until you press save)
const type = ref(props.item?.type || 'filter')
const name = ref(props.item?.name || '')
const active = ref(props.item?.active ?? true)
const settings = reactive({ ...DEFAULT_SETTINGS, ...(props.item?.settings || {}) })
const file = ref(null)
const previewUrl = ref(props.item?.fileId ? fileUrl(props.item.fileId) : '')
// Frames: optional cover picture for the round preview in the booth
const coverFile = ref(null)
const coverId = props.item?.settings?.coverId || null
const coverUrl = ref(coverId ? fileUrl(coverId) : '')

// Field errors (validation)
const nameError = ref('')
const fileError = ref('')

// The sliders for filters
const SLIDERS = [
  { key: 'brightness', label: 'brightness', min: 50, max: 150, unit: '%' },
  { key: 'saturation', label: 'saturation', min: 0, max: 200, unit: '%' },
  { key: 'contrast', label: 'contrast', min: 50, max: 150, unit: '%' },
  { key: 'hue', label: 'hue shift', min: -180, max: 180, unit: '°' },
  { key: 'grayscale', label: 'black & white', min: 0, max: 100, unit: '%' },
  { key: 'sepia', label: 'sepia', min: 0, max: 100, unit: '%' },
]

// Extra Y2K effects (drawn on top of the photo)
const EFFECTS = [
  { key: 'blur', label: 'soft focus', min: 0, max: 4, step: 0.5, unit: 'px' },
  { key: 'tint', label: 'colour wash', min: 0, max: 100, unit: '%' },
  { key: 'vignette', label: 'dark corners', min: 0, max: 100, unit: '%' },
  { key: 'grain', label: 'film grain', min: 0, max: 100, unit: '%' },
]

function onFileChange(event) {
  const chosen = event.target.files[0]
  if (!chosen) return
  file.value = chosen
  previewUrl.value = URL.createObjectURL(chosen) // show it before uploading
  fileError.value = ''
}

function onCoverChange(event) {
  const chosen = event.target.files[0]
  if (!chosen) return
  coverFile.value = chosen
  coverUrl.value = URL.createObjectURL(chosen) // show it before uploading
}

function validate() {
  nameError.value = name.value.trim() ? '' : 'give it a name'
  fileError.value =
    type.value === 'frame' && isNew.value && !file.value ? 'choose a frame image' : ''
  return !nameError.value && !fileError.value
}

function submit() {
  if (!validate()) return
  emit('save', {
    type: type.value,
    name: name.value.trim(),
    active: active.value,
    // frames keep their cover picture's ID in settings
    settings: type.value === 'filter' ? { ...settings } : { coverId },
    file: file.value,
    coverFile: type.value === 'frame' ? coverFile.value : null,
  })
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <form
      class="drawer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
      novalidate
      @submit.prevent="submit"
      @keydown.esc="emit('close')"
    >
      <header>
        <h2 id="drawer-title">{{ isNew ? 'add new item' : `edit ${item.name}` }}</h2>
        <button type="button" aria-label="close" @click="emit('close')">✕</button>
      </header>

      <!-- Type (can't be changed after creating) -->
      <fieldset :disabled="!isNew">
        <legend>type</legend>
        <label><input v-model="type" type="radio" value="filter" /> filter</label>
        <label><input v-model="type" type="radio" value="frame" /> frame</label>
      </fieldset>

      <!-- Name -->
      <label>
        name
        <input v-model="name" maxlength="50" :aria-invalid="!!nameError" />
      </label>
      <p v-if="nameError" class="field-error" role="alert">{{ nameError }}</p>

      <!-- Filter: sliders + live preview -->
      <template v-if="type === 'filter'">
        <!-- preview: a little "photo" with the filter + effects on it -->
        <div class="preview">
          <div class="preview-swatch" :style="{ filter: toCss(settings) }" />
          <FilterEffects :settings="settings" />
        </div>
        <label v-for="s in SLIDERS" :key="s.key" class="slider">
          <span
            >{{ s.label }} <small>{{ settings[s.key] }}{{ s.unit }}</small></span
          >
          <input v-model.number="settings[s.key]" type="range" :min="s.min" :max="s.max" />
        </label>

        <p class="group">y2k effects</p>
        <label v-for="s in EFFECTS" :key="s.key" class="slider">
          <span
            >{{ s.label }} <small>{{ settings[s.key] }}{{ s.unit }}</small></span
          >
          <input
            v-model.number="settings[s.key]"
            type="range"
            :min="s.min"
            :max="s.max"
            :step="s.step || 1"
          />
        </label>
        <label class="color">
          colour wash colour
          <input v-model="settings.tintColor" type="color" />
        </label>
      </template>

      <!-- Frame: image upload + preview -->
      <template v-else>
        <label>
          frame image (PNG, 600 × 1800 px, transparent where the photos go)
          <input type="file" accept="image/png,image/webp,image/svg+xml" @change="onFileChange" />
        </label>
        <p v-if="fileError" class="field-error" role="alert">{{ fileError }}</p>
        <img v-if="previewUrl" :src="previewUrl" alt="frame preview" class="frame-preview" />

        <!-- Optional cover: the round picture shown in the booth's frame list -->
        <label>
          cover picture (optional, square, shown in the booth's round preview)
          <input type="file" accept="image/png,image/jpeg,image/webp" @change="onCoverChange" />
        </label>
        <img v-if="coverUrl" :src="coverUrl" alt="cover preview" class="cover-preview" />
      </template>

      <!-- Active toggle -->
      <label>
        <input v-model="active" type="checkbox" />
        active in the booth
      </label>

      <p v-if="error" role="alert">{{ error }}</p>

      <footer>
        <button type="button" :disabled="saving" @click="emit('close')">cancel</button>
        <button type="submit" :disabled="saving">
          {{ saving ? 'saving…' : isNew ? 'add item' : 'save changes' }}
        </button>
      </footer>
    </form>
  </div>
</template>

<style scoped>
/* Round cover preview, like in the booth */
.cover-preview {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border: 3px solid #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 12px rgba(199, 125, 255, 0.7);
}

.overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  justify-content: flex-end;
  background: rgba(11, 4, 20, 0.6);
}
/* Side drawer from the Figma admin "add new / edit" screens */
.drawer {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 500px;
  max-width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 28px;
  color: #eadcff;
  background: #1c0b33;
  border-left: 1px solid rgba(215, 184, 255, 0.2);
}
header,
footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
header h2 {
  margin: 0;
  font-size: 26px;
}
footer {
  justify-content: flex-end;
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid rgba(215, 184, 255, 0.14);
}
/* Type as a two-option switch */
fieldset {
  display: flex;
  gap: 8px;
}
fieldset label {
  flex: 1;
  justify-content: center;
  padding: 10px;
  border: 1px solid rgba(215, 184, 255, 0.3);
  border-radius: 12px;
  cursor: pointer;
}
fieldset label:has(input:checked) {
  color: #ffffff;
  background: rgba(183, 99, 234, 0.25);
  border-color: #b763ea;
}
fieldset:disabled label {
  cursor: not-allowed;
  opacity: 0.6;
}
.slider {
  display: flex;
  flex-direction: column;
}
.slider span {
  display: flex;
  justify-content: space-between;
}
/* Filter preview: a simple drawn "photo" (face, wall, sofa) */
.preview {
  position: relative;
  height: 160px;
  flex: none;
  overflow: hidden;
  border-radius: 14px;
}
.preview-swatch {
  height: 100%;
  background: url('@/assets/filter-preview.webp') center / cover;
}
.group {
  margin: 8px 0 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #d7b8ff;
}
.color {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.color input {
  width: 56px;
  height: 34px;
  padding: 2px;
  background: transparent;
  border: 1px solid rgba(215, 184, 255, 0.4);
  border-radius: 8px;
  cursor: pointer;
}
.frame-preview {
  max-height: 300px;
  align-self: flex-start;
  border-radius: 8px;
  /* checkerboard so transparent parts are visible */
  background: repeating-conic-gradient(#2a1745 0% 25%, #1c0b33 0% 50%) 50% / 20px 20px;
}
.field-error {
  margin: 0;
  color: #ff8fc8;
}
</style>
