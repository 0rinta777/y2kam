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
  gap: 8px;
}
.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0;
  list-style: none;
}
.composer {
  display: flex;
  gap: 8px;
}
.composer input {
  flex: 1;
}
.empty {
  padding: 8px 0;
}
.field-error {
  margin: 0;
  color: #c0145b;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
</style>
