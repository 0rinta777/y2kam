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

defineEmits(['edit', 'delete', 'toggle-public'])
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
    <p v-if="!editable" class="meta">
      by <RouterLink :to="`/u/${strip.userId}`">{{ strip.username || 'someone' }}</RouterLink>
    </p>
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
      <button @click="$emit('toggle-public', strip)">
        {{ strip.isPublic ? 'make private' : 'post to wall ♥' }}
      </button>
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
/* ---- Laptop/desktop: smaller, compact cards so a row fits on one screen ---- */
@media (min-width: 701px) {
  .card {
    gap: 8px;
    padding: 14px 12px 12px;
    border-radius: 22px;
  }
  .link {
    gap: 10px;
  }
  .card img {
    height: clamp(180px, calc(100svh - 400px), 380px);
    border-width: 5px;
    border-radius: 12px;
  }
  .card h3 {
    font-size: 15px;
  }
  .meta {
    font-size: 12px;
  }
  .actions,
  .social {
    gap: 6px;
    padding-top: 8px;
  }
  .actions button,
  .social button {
    min-height: 32px;
    padding: 4px 8px;
    font-size: 12px;
  }
}

.card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px 18px 18px;
  background: rgba(30, 8, 56, 0.74);
  border: 1.5px solid rgba(215, 184, 255, 0.45);
  border-radius: 28px;
  box-shadow: 0 0 15px rgba(157, 78, 221, 0.35);
  backdrop-filter: blur(12px);
  transition:
    transform 0.2s,
    box-shadow 0.2s,
    border-color 0.2s;
}
.card:hover {
  transform: translateY(-4px);
  border-color: rgba(215, 184, 255, 0.8);
  box-shadow: 0 0 26px rgba(199, 125, 255, 0.55);
}
.link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  color: inherit;
  text-decoration: none;
}
/* The strip itself in a white glowing frame (the frame hugs the strip) */
.card img {
  display: block;
  width: auto;
  max-width: 100%;
  height: 440px;
  object-fit: contain;
  border: 6px solid #ffffff;
  border-radius: 16px;
  box-shadow: 0 0 18px rgba(199, 125, 255, 0.6);
  transition: transform 0.2s;
  /* if the photo can't load: purple box instead of the caption text */
  min-width: 140px;
  color: transparent;
  background: linear-gradient(127deg, #5b1f9e 0%, #2a0a4e 71%);
}
/* Little y2k tilt on hover */
.link:hover img {
  transform: rotate(-2deg) scale(1.02);
}
.card h3 {
  align-self: stretch;
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #ffffff;
  text-align: center;
}
.link:hover h3 {
  text-decoration: underline;
}
.meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 13px;
  color: #cdb8ff;
}
.meta a {
  font-weight: 600;
  color: #ffffff;
}
.badge {
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 600;
  color: #f3e9ff;
  background: rgba(189, 153, 242, 0.2);
  border: 1px solid rgba(215, 184, 255, 0.5);
  border-radius: 999px;
}
/* Buttons in an even row */
.actions,
.social {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(215, 184, 255, 0.18);
}
.actions button,
.social button {
  flex: 1;
  min-height: 38px;
  padding: 6px 12px;
  font-size: 13px;
  white-space: nowrap;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(215, 184, 255, 0.5);
  box-shadow: none;
}
/* "post to wall" / "make private" takes the full row */
.actions button:first-child {
  flex-basis: 100%;
}
/* Delete = pink */
.actions button:last-child {
  background: rgba(255, 143, 200, 0.14);
  border-color: rgba(255, 143, 200, 0.5);
}
/* Liked = pink heart */
.social button[aria-pressed='true'] {
  background: rgba(255, 143, 200, 0.25);
  border-color: #ff8fc8;
}
/* ---- Phones: strip on the left, info + buttons on the right ----
   so you see more strips per screen instead of one huge one */
@media (max-width: 600px) {
  .card {
    display: grid;
    grid-template-columns: 104px 1fr;
    column-gap: 16px;
    row-gap: 8px;
    align-content: start;
    padding: 14px;
    border-radius: 22px;
  }
  .card:hover {
    transform: none;
  }
  /* the link's image and title become separate grid pieces */
  .link {
    display: contents;
  }
  .card img {
    grid-column: 1;
    grid-row: 1 / span 5;
    align-self: start;
    width: 100%;
    min-width: 0;
    height: auto;
    aspect-ratio: 1 / 3;
    object-fit: cover;
    border-width: 4px;
    border-radius: 12px;
  }
  .link:hover img {
    transform: none;
  }
  .card h3,
  .meta,
  .social,
  .actions {
    grid-column: 2;
  }
  .card h3 {
    align-self: end;
    font-size: 16px;
    text-align: left;
  }
  .meta {
    justify-content: flex-start;
  }
  .actions,
  .social {
    justify-content: stretch;
    padding-top: 10px;
  }
  .actions button,
  .social button {
    min-height: 40px;
  }
  /* comments open under the whole card */
  .card > :deep(.comments) {
    grid-column: 1 / -1;
  }
}
</style>
