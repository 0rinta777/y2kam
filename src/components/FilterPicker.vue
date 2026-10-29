<script setup>
import FilterEffects from '@/components/FilterEffects.vue'

// Filter choice in the booth: every filter is a small round preview
// of your own live camera, so you see the look before choosing.
const props = defineProps({
  options: { type: Array, required: true }, // [{ id, name, css, settings }]
  modelValue: { type: Object, default: null }, // the chosen filter (v-model)
  stream: { type: Object, default: null }, // the live camera stream (null while starting)
})
defineEmits(['update:modelValue'])

// Connect each little <video> to the same camera stream
function connect(el) {
  if (!el || !props.stream || el.srcObject === props.stream) return
  el.srcObject = props.stream
  el.muted = true // iPhone only autoplays muted videos
  el.play().catch(() => {}) // muted videos may play without a click
}
</script>

<template>
  <div class="filter-picker" role="group" aria-label="filter">
    <button
      v-for="option in options"
      :key="option.id"
      type="button"
      class="option"
      :aria-pressed="modelValue?.id === option.id"
      @click="$emit('update:modelValue', option)"
    >
      <span class="thumb">
        <video v-if="stream" :ref="connect" playsinline muted :style="{ filter: option.css }" />
        <FilterEffects :settings="option.settings" />
      </span>
      <span class="name">{{ option.name }}</span>
    </button>
  </div>
</template>

<style scoped>
.filter-picker {
  display: flex;
  justify-content: safe center; /* centred, but never cut off when it scrolls */
  gap: 10px;
  max-width: 100%;
  padding: 4px 4px 2px;
  overflow-x: auto; /* phones: swipe sideways through the filters */
  scrollbar-width: none;
}
.option {
  flex: none;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
  padding: 0;
  background: none;
  border: none;
  box-shadow: none;
}
.option[aria-pressed='true'] {
  background: none;
  border: none;
  box-shadow: none;
}
.option:hover:not(:disabled) {
  background: none;
  box-shadow: none;
}
/* Round live preview */
.thumb {
  position: relative;
  display: block;
  width: 58px;
  height: 58px;
  overflow: hidden;
  border: 2px solid rgba(215, 184, 255, 0.5);
  border-radius: 50%;
  background: linear-gradient(135deg, #3a0f78, #12051f);
  transition:
    transform 0.15s,
    border-color 0.15s,
    box-shadow 0.15s;
}
.thumb video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1); /* mirrored like the big camera */
}
.option:hover .thumb {
  transform: scale(1.06);
}
/* The chosen filter: white ring + glow */
.option[aria-pressed='true'] .thumb {
  border: 3px solid #ffffff;
  box-shadow: 0 0 14px rgba(199, 125, 255, 0.9);
}
.name {
  font-size: 12px;
  font-weight: 600;
  color: #dcc9ff;
  white-space: nowrap;
}
.option[aria-pressed='true'] .name {
  color: #ffffff;
}
@media (max-width: 600px) {
  .filter-picker {
    justify-content: flex-start;
  }
}
</style>
