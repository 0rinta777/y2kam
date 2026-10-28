<script setup>
import { computed } from 'vue'
import { DEFAULT_SETTINGS } from '@/lib/filters'

// Live preview of the extra effects (tint, grain, vignette).
// Put it on top of a video or image; the same effects are drawn
// on the real photos by applyEffects() in lib/filters.js.
const props = defineProps({
  settings: { type: Object, default: () => ({}) },
})

const s = computed(() => ({ ...DEFAULT_SETTINGS, ...props.settings }))
</script>

<template>
  <div class="effects" aria-hidden="true">
    <div
      v-if="s.tint > 0"
      class="tint"
      :style="{ background: s.tintColor, opacity: s.tint / 200 }"
    />
    <div v-if="s.grain > 0" class="grain" :style="{ opacity: (s.grain / 100) * 0.6 }" />
    <div
      v-if="s.vignette > 0"
      class="vignette"
      :style="{
        background: `radial-gradient(ellipse at center, transparent 45%, rgba(0, 0, 0, ${s.vignette / 100}) 100%)`,
      }"
    />
  </div>
</template>

<style scoped>
/* Covers whatever it sits on, can't be clicked */
.effects,
.effects > div {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
}
.effects {
  overflow: hidden;
}
/* Grain: an SVG noise pattern, blended like the canvas version */
.grain {
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}
</style>
