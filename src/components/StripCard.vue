<script setup>
import { ref, onMounted } from 'vue'
import LikeButton from '@/components/LikeButton.vue'
import CommentSection from '@/components/CommentSection.vue'
import { imageUrl } from '@/composables/useStrips'
import { countComments } from '@/composables/useComments'

const props = defineProps({
  strip: { type: Object, required: true },
  editable: { type: Boolean, default: false }, // true in my gallery, false on the wall
})

defineEmits(['edit', 'delete'])
const showComments = ref(false) // comments open/closed on this card
const commentCount = ref(0)

// On the wall, load how many comments this strip has
onMounted(async () => {
  if (props.editable) return
  try {
    commentCount.value = await countComments(props.strip.$id)
  } catch (e) {
    console.error('comment count failed:', e)
  }
})

// "2026-10-25T..." → "25 oct 2026"
function formatDate(iso) {
  return new Date(iso)
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    .toLowerCase()
}
</script>

<template>
  <article class="card">
    <RouterLink :to="`/wall/${strip.$id}`" class="link">
      <img :src="imageUrl(strip.imageId)" :alt="strip.caption || 'photo strip'" loading="lazy" />
      <h3>{{ strip.caption || 'untitled strip' }}</h3>
    </RouterLink>
    <p v-if="!editable" class="meta">by {{ strip.username || 'someone' }}</p>
    <!-- Wall only: like + comments right on the card -->
    <div v-if="!editable" class="social">
      <LikeButton :strip-id="strip.$id" />
      <button type="button" :aria-expanded="showComments" @click="showComments = !showComments">
        {{ showComments ? 'hide comments' : `comments (${commentCount})` }}
      </button>
    </div>
    <CommentSection
      v-if="!editable && showComments"
      :strip-id="strip.$id"
      @count="commentCount = $event"
    />
    <p class="meta">
      {{ formatDate(strip.$createdAt) }} ·
      <span class="badge">{{ strip.isPublic ? 'on the wall' : 'private' }}</span>
    </p>
    <div v-if="editable" class="actions">
      <button :aria-label="`edit ${strip.caption || 'strip'}`" @click="$emit('edit', strip)">
        edit
      </button>
      <button :aria-label="`delete ${strip.caption || 'strip'}`" @click="$emit('delete', strip)">
        delete
      </button>
    </div>
  </article>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 12px;
}
.card img {
  width: 100%;
  border-radius: 8px;
}
.card h3 {
  margin: 0;
  font-size: 16px;
}
.meta {
  margin: 0;
  font-size: 13px;
}
.badge {
  padding: 2px 8px;
  border-radius: 999px;
  background: #eee;
}
.actions {
  display: flex;
  gap: 8px;
}

.link {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: inherit;
  text-decoration: none;
}

.social {
  display: flex;
  gap: 8px;
}
</style>
