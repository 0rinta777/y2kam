<script setup>
import { ref, onMounted, watch } from 'vue'
import { useComments } from '@/composables/useComments'
import { useAuth } from '@/composables/useAuth'

const props = defineProps({ stripId: { type: String, required: true } })
const emit = defineEmits(['count'])
const { comments, loading, error, load, add, remove } = useComments(props.stripId)
const { user, isAdmin } = useAuth()

const text = ref('')
const textError = ref('')
const posting = ref(false)
const titleId = `comments-title-${props.stripId}`
const inputId = `comment-input-${props.stripId}`

onMounted(load)
// Whenever the list changes (load, post, delete), send the new number up to the card
watch(
  () => comments.value.length,
  (n) => emit('count', n),
)

async function submit() {
  if (!text.value.trim()) {
    textError.value = "comment can't be empty"
    return
  }
  textError.value = ''
  posting.value = true
  try {
    await add(text.value.trim())
    text.value = ''
  } catch (e) {
    console.error('comment failed:', e)
    textError.value = "couldn't post your comment. try again."
  } finally {
    posting.value = false
  }
}

async function onDelete(comment) {
  if (!confirm('delete this comment?')) return
  try {
    await remove(comment)
  } catch (e) {
    console.error('delete comment failed:', e)
  }
}

// I can delete my own comments; admins can delete any
function canDelete(comment) {
  return comment.userId === user.value?.$id || isAdmin.value
}
</script>

<template>
  <section class="comments" :aria-labelledby="titleId">
    <h2 :id="titleId">comments ({{ comments.length }})</h2>

    <p v-if="loading">loading comments…</p>
    <p v-else-if="error" role="alert">{{ error }}</p>

    <div v-else-if="comments.length === 0" class="empty">
      <p>no comments yet ♥</p>
      <p>be the first to say something cute</p>
    </div>

    <ul v-else class="list">
      <li v-for="comment in comments" :key="comment.$id">
        <strong>{{ comment.username || 'someone' }}</strong>
        {{ comment.text }}
        <button v-if="canDelete(comment)" type="button" @click="onDelete(comment)">delete</button>
      </li>
    </ul>

    <form class="composer" novalidate @submit.prevent="submit">
      <label :for="inputId" class="sr-only">write a comment</label>
      <input
        :id="inputId"
        v-model="text"
        maxlength="500"
        placeholder="write a comment…"
        :aria-invalid="!!textError"
      />
      <button type="submit" :disabled="posting || !text.trim()">
        {{ posting ? 'posting…' : 'post' }}
      </button>
    </form>
    <p v-if="textError" class="field-error" role="alert">{{ textError }}</p>
  </section>
</template>

<style scoped>
.comments {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.comments h2 {
  margin: 0;
  font-size: 20px;
}
.list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
/* One comment = a little bubble */
.list li {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px;
  padding: 10px 12px;
  font-size: 14px;
  color: #eadcff;
  background: rgba(18, 5, 31, 0.5);
  border: 1px solid rgba(215, 184, 255, 0.2);
  border-radius: 14px;
}
.list li button {
  margin-left: auto;
  min-height: 30px;
  padding: 4px 12px;
  font-size: 12px;
  background: rgba(255, 143, 200, 0.14);
  border: 1px solid rgba(255, 143, 200, 0.6);
  box-shadow: none;
}
/* Write a comment: input + post button on one line */
.composer {
  display: flex;
  flex-direction: row;
  gap: 8px;
  max-width: none;
}
.composer input {
  flex: 1;
  padding: 10px 16px;
  border-radius: 999px;
}
.composer button {
  min-height: 42px;
  padding: 8px 20px;
  font-size: 14px;
}
.empty {
  padding: 12px;
  text-align: center;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 14px;
}
.empty p {
  margin: 0;
}
.field-error {
  margin: 0;
  color: #ff8fc8;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
</style>
