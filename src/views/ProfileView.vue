<script setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useStrips } from '@/composables/useStrips'
import { useAuth } from '@/composables/useAuth'
import StripCard from '@/components/StripCard.vue'

const route = useRoute()
const { strips, loading, error, loadByUser } = useStrips()
const { user } = useAuth()

const userId = computed(() => route.params.id)
const isMe = computed(() => user.value?.$id === userId.value)
// The username is stored on each strip, so take it from the first one
const name = computed(
  () => strips.value[0]?.username || (isMe.value ? user.value.name : 'this user'),
)

// Load again if you go from one profile straight to another
watch(userId, (id) => loadByUser(id), { immediate: true })
</script>

<template>
  <main class="profile">
    <RouterLink to="/wall">← back to the wall</RouterLink>
    <h1>{{ name }}</h1>
    <p v-if="isMe">
      this is you ♥
      <RouterLink to="/gallery">see all your strips (also private) in my gallery</RouterLink>
    </p>

    <p v-if="loading">loading strips…</p>

    <div v-else-if="error" role="alert">
      <p>{{ error }}</p>
      <button @click="loadByUser(userId)">try again</button>
    </div>

    <p v-else-if="strips.length === 0" class="empty">no public strips yet ♥</p>

    <div v-else>
      <p>{{ strips.length }} {{ strips.length === 1 ? 'strip' : 'strips' }} on the wall</p>
      <div class="grid">
        <StripCard v-for="strip in strips" :key="strip.$id" :strip="strip" />
      </div>
    </div>
  </main>
</template>

<style scoped>
.profile {
  display: flex;
  flex-direction: column;
  gap: 12px;
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
</style>
