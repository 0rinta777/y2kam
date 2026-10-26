import { ref } from 'vue'
import { ID, Permission, Role, Query } from 'appwrite'
import { tablesDB, DB_ID } from '@/lib/appwrite'
import { useAuth } from '@/composables/useAuth'

const TABLE = 'comments'

export function useComments(stripId) {
  const { user } = useAuth()
  const comments = ref([])
  const loading = ref(false)
  const error = ref('')

  // READ: comments on this strip, oldest first
  async function load() {
    loading.value = true
    error.value = ''
    try {
      const res = await tablesDB.listRows({
        databaseId: DB_ID,
        tableId: TABLE,
        queries: [Query.equal('stripId', stripId), Query.orderAsc('$createdAt'), Query.limit(100)],
      })
      comments.value = res.rows
    } catch (e) {
      console.error('comments load failed:', e)
      error.value = "couldn't load comments."
    } finally {
      loading.value = false
    }
  }

  // CREATE
  async function add(text) {
    const uid = user.value.$id
    const row = await tablesDB.createRow({
      databaseId: DB_ID,
      tableId: TABLE,
      rowId: ID.unique(),
      data: { stripId, userId: uid, username: user.value.name, text },
      permissions: [Permission.update(Role.user(uid)), Permission.delete(Role.user(uid))], // only the writer can edit/delete
    })
    comments.value.push(row)
  }

  // DELETE (the writer, or an admin through the table permission)
  async function remove(comment) {
    await tablesDB.deleteRow({ databaseId: DB_ID, tableId: TABLE, rowId: comment.$id })
    comments.value = comments.value.filter((c) => c.$id !== comment.$id)
  }

  return { comments, loading, error, load, add, remove }
}

// Just the number of comments on a strip (for the wall cards)
export async function countComments(stripId) {
  const res = await tablesDB.listRows({
    databaseId: DB_ID,
    tableId: TABLE,
    queries: [Query.equal('stripId', stripId), Query.limit(1)],
  })
  return res.total
}
