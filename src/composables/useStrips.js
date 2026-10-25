import { ref } from 'vue'
import { ID, Permission, Role, Query } from 'appwrite'
import { tablesDB, storage, DB_ID, BUCKET_ID } from '@/lib/appwrite'
import { useAuth } from '@/composables/useAuth'

const TABLE = 'strips'

// Row permissions for one strip: the owner can read, edit and delete it.
// If it's public, anyone can also read it (that's how it shows on the wall).
function stripPermissions(userId, isPublic) {
  const perms = [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ]
  if (isPublic) perms.push(Permission.read(Role.users())) // any logged-in user, not guests
  return perms
}

// URL for showing a strip image in an <img>
export function imageUrl(fileId) {
  return String(storage.getFileView({ bucketId: BUCKET_ID, fileId }))
}

export function useStrips() {
  const { user } = useAuth()

  // State for lists (each page that uses this gets its own copy)
  const strips = ref([])
  const loading = ref(false)
  const error = ref('')

  // Load a list of strips with the given queries
  async function load(queries) {
    loading.value = true
    error.value = ''
    try {
      const res = await tablesDB.listRows({ databaseId: DB_ID, tableId: TABLE, queries })
      strips.value = res.rows
    } catch {
      error.value = "couldn't load strips. check your connection and try again."
    } finally {
      loading.value = false
    }
  }

  // READ: my own strips, newest first
  function loadMine() {
    return load([
      Query.equal('userId', user.value.$id),
      Query.orderDesc('$createdAt'),
      Query.limit(50),
    ])
  }

  // READ: public strips for the wall
  function loadPublic() {
    return load([Query.equal('isPublic', true), Query.orderDesc('$createdAt'), Query.limit(50)])
  }

  // READ: one strip by its ID (for the detail page)
  function getStrip(id) {
    return tablesDB.getRow({ databaseId: DB_ID, tableId: TABLE, rowId: id })
  }

  // CREATE: upload the image, then save a row that points to it
  async function createStrip(blob, { caption, filter }) {
    const uid = user.value.$id
    const file = await storage.createFile({
      bucketId: BUCKET_ID,
      fileId: ID.unique(),
      file: new File([blob], 'strip.jpg', { type: 'image/jpeg' }),
      permissions: [
        Permission.read(Role.any()),
        Permission.update(Role.user(uid)),
        Permission.delete(Role.user(uid)),
      ],
    })
    try {
      return await tablesDB.createRow({
        databaseId: DB_ID,
        tableId: TABLE,
        rowId: ID.unique(),
        data: {
          userId: uid,
          username: user.value.name,
          imageId: file.$id,
          caption,
          filter,
          isPublic: false,
        },
        permissions: stripPermissions(uid, false),
      })
    } catch (e) {
      // If saving the row fails, remove the uploaded image so nothing is left behind
      await storage.deleteFile({ bucketId: BUCKET_ID, fileId: file.$id }).catch(() => {})
      throw e
    }
  }

  // UPDATE: change caption and/or public/private (permissions change with it)
  async function updateStrip(strip, { caption, isPublic }) {
    const updated = await tablesDB.updateRow({
      databaseId: DB_ID,
      tableId: TABLE,
      rowId: strip.$id,
      data: { caption, isPublic },
      permissions: stripPermissions(strip.userId, isPublic),
    })
    strips.value = strips.value.map((s) => (s.$id === strip.$id ? updated : s))
    return updated
  }

  // DELETE: remove the row and its image
  async function deleteStrip(strip) {
    await tablesDB.deleteRow({ databaseId: DB_ID, tableId: TABLE, rowId: strip.$id })
    await storage.deleteFile({ bucketId: BUCKET_ID, fileId: strip.imageId }).catch(() => {})
    strips.value = strips.value.filter((s) => s.$id !== strip.$id)
  }

  return {
    strips,
    loading,
    error,
    loadMine,
    loadPublic,
    getStrip,
    createStrip,
    updateStrip,
    deleteStrip,
  }
}
