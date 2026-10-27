<script setup>
defineProps({
  label: { type: String, required: true },
  options: { type: Array, required: true }, // [{ id, name }]
  modelValue: { type: Object, default: null }, // the chosen option (v-model)
})
defineEmits(['update:modelValue'])
</script>

<template>
  <div class="picker" role="group" :aria-label="label">
    <span class="label">{{ label }}</span>
    <button
      v-for="option in options"
      :key="option.id"
      type="button"
      :aria-pressed="modelValue?.id === option.id"
      @click="$emit('update:modelValue', option)"
    >
      {{ option.name }}
    </button>
  </div>
</template>

<style scoped>
.picker {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  padding: 5px;
  background: rgba(18, 5, 31, 0.7);
  border: 1.5px solid rgba(215, 184, 255, 0.55);
  border-radius: 28px;
}
/* small label at the start of the pill */
.label {
  padding: 0 10px 0 12px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #d7b8ff;
}
button {
  min-height: 38px;
  padding: 6px 18px;
  font-size: 14px;
  font-weight: 600;
  background: transparent;
  border: none;
  box-shadow: none;
}
button:hover:not(:disabled) {
  background: rgba(183, 99, 234, 0.25);
  box-shadow: none;
}
/* chosen option */
button[aria-pressed='true'] {
  background: linear-gradient(180deg, #d08bff 0%, #b763ea 50%, #7b2fc9 100%);
  border: none;
  box-shadow: 0 0 10px rgba(199, 125, 255, 0.7);
}
</style>
