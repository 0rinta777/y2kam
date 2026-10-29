<script setup>
// Frame choice in the booth: every frame is a small round preview, like the filters.
// Shows the frame's cover picture (added in admin), or else a zoomed-in corner of the frame.
defineProps({
  options: { type: Array, required: true }, // [{ id, name, url, cover }] (url = null for "no frame")
  modelValue: { type: Object, default: null }, // the chosen frame (v-model)
})
defineEmits(['update:modelValue'])
</script>

<template>
  <div class="frame-picker" role="group" aria-label="frame">
    <button
      v-for="option in options"
      :key="option.id"
      type="button"
      class="option"
      :aria-pressed="modelValue?.id === option.id"
      @click="$emit('update:modelValue', option)"
    >
      <span
        class="thumb"
        :class="{ empty: !option.url, cover: option.cover }"
        :style="
          option.cover || option.url
            ? { backgroundImage: `url('${option.cover || option.url}')` }
            : null
        "
      >
        <span v-if="!option.url" aria-hidden="true">✕</span>
      </span>
      <span class="name">{{ option.name }}</span>
    </button>
  </div>
</template>

<style scoped>
.frame-picker {
  display: flex;
  justify-content: safe center; /* centred, but never cut off when it scrolls */
  gap: 10px;
  max-width: 100%;
  padding: 4px 4px 2px;
  overflow-x: auto; /* phones: swipe sideways through the frames */
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
.option[aria-pressed='true'],
.option:hover:not(:disabled) {
  background: none;
  border: none;
  box-shadow: none;
}
/* Round preview: zoomed-in top-left corner of the frame */
.thumb {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  border: 2px solid rgba(215, 184, 255, 0.5);
  border-radius: 50%;
  background-color: #2a0a4e; /* shows through the frame's photo holes */
  background-size: 260%;
  background-position: 8% 4%;
  background-repeat: no-repeat;
  transition:
    transform 0.15s,
    border-color 0.15s,
    box-shadow 0.15s;
}
/* Cover picture: fills the whole circle */
.thumb.cover {
  background-size: cover;
  background-position: center;
}
/* "no frame" */
.thumb.empty {
  font-size: 18px;
  color: rgba(215, 184, 255, 0.7);
  background: linear-gradient(135deg, #3a0f78, #12051f);
}
.option:hover .thumb {
  transform: scale(1.06);
}
/* The chosen frame: white ring + glow (same as the filters) */
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
  .frame-picker {
    justify-content: flex-start;
  }
}
</style>
