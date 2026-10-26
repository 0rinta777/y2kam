import { ref } from 'vue'
import { ID, Query } from 'appwrite'
import { tablesDB, DB_ID } from '@/lib/appwrite'

const TABLE = 'messages'

export function useMessages() {
  const messages = ref([])
  const loading = ref(false)
  const error = ref('')

  // CREATE (anyone, also guests)
  function sendMessage({ name, email, message }) {
    return tablesDB.createRow({
      databaseId: DB_ID,
      tableId: TABLE,
      rowId: ID.unique(),
      data: { name, email, message, status: 'new' },
    })
  }

  // ADMIN — READ: newest first
  async function loadAll() {
    loading.value = true
    error.value = ''
    try {
      const res = await tablesDB.listRows({
        databaseId: DB_ID,
        tableId: TABLE,
        queries: [Query.orderDesc('$createdAt'), Query.limit(100)],
      })
      messages.value = res.rows
    } catch (e) {
      console.error('messages load failed:', e)
      error.value = "couldn't load messages. try again."
    } finally {
      loading.value = false
    }
  }

  // ADMIN — UPDATE: mark as read
  async function markRead(msg) {
    const updated = await tablesDB.updateRow({
      databaseId: DB_ID,
      tableId: TABLE,
      rowId: msg.$id,
      data: { status: 'read' },
    })
    messages.value = messages.value.map((m) => (m.$id === msg.$id ? updated : m))
  }

  // ADMIN — DELETE
  async function remove(msg) {
    await tablesDB.deleteRow({ databaseId: DB_ID, tableId: TABLE, rowId: msg.$id })
    messages.value = messages.value.filter((m) => m.$id !== msg.$id)
  }

  return { messages, loading, error, sendMessage, loadAll, markRead, remove }
}
