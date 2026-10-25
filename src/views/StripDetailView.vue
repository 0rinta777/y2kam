<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useStrips, imageUrl } from '@/composables/useStrips'

const route = useRoute()
const { getStrip } = useStrips()

const strip = ref(null)
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    strip.value = await getStrip(route.params.id)
  } catch (e) {
    // 404 = doesn't exist, 401 = private strip you're not allowed to see
    error.value =
      e.code === 404 || e.code === 401
        ? "this strip doesn't exist or is private."
        : "couldn't load this strip. try again."
  } finally {
    loading.value = false
  }
}

onMounted(load)

function formatDate(iso) {
  return new Date(iso)
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    .toLowerCase()
}
</script>

<template>
  <main class="detail">
    <RouterLink to="/wall">← back to the wall</RouterLink>

    <p v-if="loading">loading strip…</p>

    <div v-else-if="error" role="alert">
      <p>{{ error }}</p>
      <button @click="load">try again</button>
    </div>

    <article v-else class="strip">
      <img :src="imageUrl(strip.imageId)" :alt="strip.caption || 'photo strip'" />
      <div class="info">
        <h1>{{ strip.caption || 'untitled strip' }}</h1>
        <p>by {{ strip.username || 'someone' }} · {{ formatDate(strip.$createdAt) }}</p>
        <a :href="imageUrl(strip.imageId)" target="_blank" rel="noopener">open full size</a>
        <!-- likes, comments and report come here later (Shoulds) -->
      </div>
    </article>
  </main>
</template>

<style scoped>
.detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}
.strip {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}
.strip img {
  max-height: 80vh;
  border-radius: 12px;
}
.info h1 {
  margin-top: 0;
}
</style>
