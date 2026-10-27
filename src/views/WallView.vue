<script setup>
import { onMounted } from 'vue'
import { useStrips } from '@/composables/useStrips'
import { useAuth } from '@/composables/useAuth'
import StripCard from '@/components/StripCard.vue'

const { strips, loading, error, hasMore, loadingMore, loadPublic, loadMorePublic } = useStrips()
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

    <!-- Pagination -->
    <div v-if="isLoggedIn && hasMore" class="more">
      <button :disabled="loadingMore" @click="loadMorePublic">
        {{ loadingMore ? 'loading…' : 'load more' }}
      </button>
    </div>
  </main>
</template>

<style scoped>
/* ---- Laptop/desktop: the page itself never scrolls ----
   Title stays on top, the strips get the rest of the screen.
   More strips than fit? Only the strips area scrolls. */
/* ---- Laptop/desktop: smaller cards so the strips fit on one screen,
   header like settings: title left, text right, same size ---- */
@media (min-width: 701px) {
  .wall {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 18px 16px;
    margin-top: -8px;
    margin-bottom: -48px; /* skip the page's empty bottom space */
  }
  .wall > * {
    grid-column: 1 / -1; /* everything full width... */
  }
  .wall > h1 {
    grid-column: 1; /* ...except the title (left) */
    margin: 0;
    font-size: 40px;
  }
  .wall > h1 + p {
    grid-column: 2; /* ...and the text next to it (right) */
    margin: 0;
  }
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
    gap: 20px;
    margin-top: 0;
  }
  .empty,
  .members {
    margin-top: 0;
    min-height: calc(100svh - 230px);
  }
}

.wall > h1 {
  margin-bottom: 0;
}
.wall > p {
  margin: 0 0 28px;
  font-size: 17px;
  color: #dcc9ff;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 32px;
  align-items: start;
}
/* Empty + members-only message cards */
.empty,
.members {
  display: flex;
  justify-content: center;
  min-height: 50vh; /* big empty-state box */
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 56px 24px;
  text-align: center;
  background: rgba(30, 8, 56, 0.6);
  border: 1.5px dashed rgba(215, 184, 255, 0.45);
  border-radius: 28px;
}
.empty p,
.members p {
  margin: 0;
}
.empty p:first-child,
.members p:first-child {
  font-size: 24px;
  font-weight: 600;
  color: #ffffff;
}
.members a {
  margin-top: 8px;
  font-weight: 700;
}
.more {
  padding: 40px 0 0;
  text-align: center;
}
</style>
