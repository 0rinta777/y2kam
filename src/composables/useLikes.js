import { ref } from 'vue'
import { ID, Permission, Role, Query } from 'appwrite'
import { tablesDB, DB_ID } from '@/lib/appwrite'
import { useAuth } from '@/composables/useAuth'

const TABLE = 'likes'

export function useLikes(stripId) {
  const { user } = useAuth()
  const count = ref(0)
  const myLike = ref(null) // my like row, or null if I haven't liked it
  const busy = ref(false)

  // READ: how many likes, and did I like it?
  async function load() {
    const [all, mine] = await Promise.all([
      tablesDB.listRows({
        databaseId: DB_ID,
        tableId: TABLE,
        queries: [Query.equal('stripId', stripId), Query.limit(1)],
      }),
      tablesDB.listRows({
        databaseId: DB_ID,
        tableId: TABLE,
        queries: [
          Query.equal('stripId', stripId),
          Query.equal('userId', user.value.$id),
          Query.limit(1),
        ],
      }),
    ])
    count.value = all.total
    myLike.value = mine.rows[0] || null
  }

  // CREATE or DELETE: like / unlike
  async function toggle() {
    if (busy.value) return
    busy.value = true
    try {
      if (myLike.value) {
        await tablesDB.deleteRow({ databaseId: DB_ID, tableId: TABLE, rowId: myLike.value.$id })
        myLike.value = null
        count.value--
      } else {
        myLike.value = await tablesDB.createRow({
          databaseId: DB_ID,
          tableId: TABLE,
          rowId: ID.unique(),
          data: { stripId, userId: user.value.$id },
          permissions: [Permission.delete(Role.user(user.value.$id))], // only I can unlike
        })
        count.value++
      }
    } finally {
      busy.value = false
    }
  }

  return { count, myLike, busy, load, toggle }
}

// Total likes on a list of strips ("likes collected" on profiles)
export async function countLikesFor(stripIds) {
  if (stripIds.length === 0) return 0
  const res = await tablesDB.listRows({
    databaseId: DB_ID,
    tableId: TABLE,
    queries: [Query.equal('stripId', stripIds), Query.limit(1)], // a list = "any of these strips"
  })
  return res.total
}
