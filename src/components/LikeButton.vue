<script setup>
import { onMounted } from 'vue'
import { useLikes } from '@/composables/useLikes'

const props = defineProps({ stripId: { type: String, required: true } })
const { count, myLike, busy, load, toggle } = useLikes(props.stripId)

onMounted(() => load().catch((e) => console.error('likes load failed:', e)))

async function onClick() {
  try {
    await toggle()
  } catch (e) {
    console.error('like failed:', e)
  }
}
</script>

<template>
  <button
    type="button"
    :aria-pressed="!!myLike"
    :aria-label="myLike ? 'unlike' : 'like'"
    :disabled="busy"
    @click="onClick"
  >
    {{ myLike ? '♥' : '♡' }} {{ count }}
  </button>
</template>
