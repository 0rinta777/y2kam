<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useStrips } from '@/composables/useStrips'
import { useAuth } from '@/composables/useAuth'
import { getProfile, avatarUrl } from '@/composables/useProfile'
import { countLikesFor } from '@/composables/useLikes'
import { formatDate } from '@/lib/format'
import StripCard from '@/components/StripCard.vue'

const route = useRoute()
const { strips, loading, error, loadByUser } = useStrips()
const { user } = useAuth()

const profile = ref(null)
const likes = ref(0)

const userId = computed(() => route.params.id)
const isMe = computed(() => user.value?.$id === userId.value)

// Name: from the profile, or from a strip, or a fallback
const name = computed(
  () =>
    profile.value?.username ||
    strips.value[0]?.username ||
    (isMe.value ? user.value.name : 'this user'),
)

// Favourite filter = the filter used most on their strips (ignoring "none")
const favouriteFilter = computed(() => {
  const counts = {}
  for (const s of strips.value) {
    if (s.filter && s.filter !== 'none') counts[s.filter] = (counts[s.filter] || 0) + 1
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  return top ? top[0] : null
})

// Member since: when the profile was made (or their oldest strip)
const memberSince = computed(() => {
  const iso = profile.value?.$createdAt || strips.value.at(-1)?.$createdAt
  return iso ? formatDate(iso) : null
})

async function load(id) {
  profile.value = null
  likes.value = 0
  const [p] = await Promise.all([getProfile(id).catch(() => null), loadByUser(id)])
  profile.value = p
  try {
    likes.value = await countLikesFor(strips.value.map((s) => s.$id))
  } catch (e) {
    console.error('likes count failed:', e)
  }
}

// Load now, and again if you go from one profile straight to another
watch(userId, load, { immediate: true })
</script>

<template>
  <main class="profile">
    <RouterLink to="/wall">← back to the wall</RouterLink>

    <!-- Header: picture, name, bio -->
    <header class="head">
      <img
        v-if="profile?.avatarId"
        :src="avatarUrl(profile.avatarId)"
        :alt="`${name}'s profile picture`"
        class="avatar"
      />
      <div v-else class="avatar placeholder" aria-hidden="true">{{ name.charAt(0) }}</div>

      <div>
        <h1>{{ name }}</h1>
        <p v-if="profile?.bio" class="bio">{{ profile.bio }}</p>
        <p v-else-if="isMe" class="bio">
          no bio yet. <RouterLink to="/settings">add one in settings ♥</RouterLink>
        </p>
        <RouterLink v-if="isMe" to="/settings">edit profile</RouterLink>
      </div>
    </header>

    <!-- Stats -->
    <ul v-if="!loading && !error" class="stats">
      <li>
        <strong>{{ strips.length }}</strong> {{ strips.length === 1 ? 'strip' : 'strips' }}
      </li>
      <li>
        <strong>♥ {{ likes }}</strong> likes collected
      </li>
      <li v-if="favouriteFilter">
        favourite filter: <strong>{{ favouriteFilter }}</strong>
      </li>
      <li v-if="memberSince">member since {{ memberSince }}</li>
    </ul>

    <p v-if="isMe">
      only your public strips show here.
      <RouterLink to="/gallery">see all in my gallery</RouterLink>
    </p>

    <!-- Strips -->
    <p v-if="loading">loading strips…</p>

    <div v-else-if="error" role="alert">
      <p>{{ error }}</p>
      <button @click="load(userId)">try again</button>
    </div>

    <p v-else-if="strips.length === 0" class="empty">no public strips yet ♥</p>

    <div v-else class="grid">
      <StripCard v-for="strip in strips" :key="strip.$id" :strip="strip" />
    </div>
  </main>
</template>

<style scoped>
.profile {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.profile > a {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  text-decoration: none;
}
/* Profile header card */
.head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 24px;
  padding: 28px;
  background: rgba(30, 8, 56, 0.74);
  border: 1.5px solid rgba(215, 184, 255, 0.45);
  border-radius: 28px;
  box-shadow: 0 0 30px rgba(157, 77, 230, 0.35);
  backdrop-filter: blur(12px);
}
.head h1 {
  margin: 0;
}
.avatar {
  flex: none;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #ffffff;
  box-shadow: 0 0 18px rgba(199, 125, 255, 0.8);
}
.placeholder {
  display: grid;
  place-items: center;
  font-size: 48px;
  font-weight: 700;
  color: #ffffff;
  background: radial-gradient(circle at 35% 30%, #d08bff, #7b2fc9);
}
.bio {
  margin: 6px 0 10px;
  color: #eadcff;
}
/* Stats as little pills */
.stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.stats li {
  padding: 8px 16px;
  font-size: 14px;
  color: #eadcff;
  background: rgba(189, 153, 242, 0.18);
  border: 1px solid rgba(215, 184, 255, 0.5);
  border-radius: 999px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
}
.empty {
  padding: 48px 24px;
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
  text-align: center;
  background: rgba(30, 8, 56, 0.6);
  border: 1.5px dashed rgba(215, 184, 255, 0.45);
  border-radius: 24px;
}
</style>
