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
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.label {
  font-weight: bold;
}
button[aria-pressed='true'] {
  font-weight: bold;
  outline: 2px solid currentColor;
}
</style>
