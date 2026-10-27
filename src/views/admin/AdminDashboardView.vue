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
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}
.card {
  padding: 22px;
  background: rgba(28, 11, 51, 0.92);
  border: 1px solid rgba(215, 184, 255, 0.14);
  border-radius: 18px;

  color: inherit;
  text-decoration: none;
}
a.card:hover {
  border-color: #b763ea;
}
.card p {
  margin: 0;
}
.number {
  font-family: var(--font-display);
  font-size: 44px;
  line-height: 1.1;
  color: #ffffff;
}
</style>
