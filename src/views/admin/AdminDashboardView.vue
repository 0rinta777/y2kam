<script setup>
import { onMounted } from 'vue'
import { useStats } from '@/composables/useStats'

const { stats, loading, error, load } = useStats()

onMounted(load)
</script>

<template>
  <section>
    <h1>dashboard</h1>

    <p v-if="loading">loading…</p>

    <div v-else-if="error" role="alert">
      <p>{{ error }}</p>
      <button @click="load">try again</button>
    </div>

    <div v-else-if="stats" class="cards">
      <div class="card">
        <p class="number">{{ stats.strips }}</p>
        <p>strips in total</p>
      </div>
      <div class="card">
        <p class="number">{{ stats.publicStrips }}</p>
        <p>on the wall</p>
      </div>
      <RouterLink to="/admin/reports" class="card">
        <p class="number">{{ stats.openReports }}</p>
        <p>open reports</p>
      </RouterLink>
      <RouterLink to="/admin/catalog" class="card">
        <p class="number">{{ stats.activeItems }}</p>
        <p>active filters & frames</p>
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}
.card {
  padding: 16px;
  border: 1px solid #eee;
  border-radius: 12px;
  color: inherit;
  text-decoration: none;
}
.number {
  margin: 0;
  font-size: 40px;
  font-weight: bold;
}
</style>
