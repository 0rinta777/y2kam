<script setup>
import { onMounted } from 'vue'
import { useStrips } from '@/composables/useStrips'
import { useAuth } from '@/composables/useAuth'
import StripCard from '@/components/StripCard.vue'

const { strips, loading, error, loadPublic } = useStrips()
const { isLoggedIn } = useAuth()

// Only load strips for logged-in users (guests aren't allowed to read them anyway)
onMounted(() => {
  if (isLoggedIn.value) loadPublic()
})
</script>

<template>
  <main class="wall">
    <h1>the wall</h1>
    <p>strips people chose to share ♥</p>

    <!-- Guests: members-only message -->
    <div v-if="!isLoggedIn" class="members">
      <p>the wall is for y2kam members ♥</p>
      <p>log in or sign up to see everyone's strips and post your own.</p>
      <RouterLink to="/login?redirect=/wall">log in or sign up</RouterLink>
    </div>

    <p v-else-if="loading">loading the wall…</p>

    <div v-else-if="error" role="alert">
      <p>{{ error }}</p>
      <button @click="loadPublic">try again</button>
    </div>

    <div v-else-if="strips.length === 0" class="empty">
      <p>the wall is empty for now ♥</p>
      <RouterLink to="/booth">be the first to post a strip</RouterLink>
    </div>

    <div v-else class="grid">
      <StripCard v-for="strip in strips" :key="strip.$id" :strip="strip" />
    </div>
  </main>
</template>

<style scoped>
.wall {
  padding: 16px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}
.empty {
  padding: 40px 0;
  text-align: center;
}
.members {
  padding: 40px 0;
  text-align: center;
}
</style>
