import { ref, reactive } from 'vue'
import { ID, Permission, Role, Query } from 'appwrite'
import { tablesDB, storage, DB_ID, BUCKET_ID } from '@/lib/appwrite'
import { useAuth } from '@/composables/useAuth'

const TABLE = 'strips'

// Row permissions: the owner can read/edit/delete.
// Public = logged-in users can also read it (the wall is members only).
function stripPermissions(userId, isPublic) {
  const perms = [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ]
  if (isPublic) perms.push(Permission.read(Role.users()))
  return perms
}

// Image FILE permissions follow the same rules as the row,
// so a private strip's photo is really private too.
function filePermissions(userId, isPublic) {
  const perms = [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ]
  if (isPublic) perms.push(Permission.read(Role.users()))
  return perms
}

// URL for showing a strip image in an <img>.
// Photos are downloaded with fetch, sending the login the same way the Appwrite SDK does.
// Why: Safari (iPhone/iPad) blocks Appwrite's login cookie on normal <img> requests,
// so member-only and private photos would not load there.
const imageCache = reactive({}) // fileId → local blob URL
const loadingImages = new Set()

export function imageUrl(fileId) {
  if (!fileId) return ''
  if (imageCache[fileId]) return imageCache[fileId]
  if (!loadingImages.has(fileId)) loadImage(fileId)
  return '' // the <img> updates by itself once the photo is loaded
}

async function loadImage(fileId) {
  loadingImages.add(fileId)
  const url = String(storage.getFileView({ bucketId: BUCKET_ID, fileId }))
  try {
    // Safari: the SDK keeps the login in localStorage and sends it as this header
    const fallback = localStorage.getItem('cookieFallback')
    const res = await fetch(url, {
      credentials: 'include', // other browsers: send the login cookie
      headers: fallback ? { 'X-Fallback-Cookies': fallback } : {},
    })
    if (!res.ok) throw new Error(`photo request failed (${res.status})`)
    imageCache[fileId] = URL.createObjectURL(await res.blob())
  } catch (e) {
    console.error('photo load failed:', e)
    imageCache[fileId] = url // fall back to the normal link
  } finally {
    loadingImages.delete(fileId)
  }
}

// Forget downloaded photos (on log out, so the next user can't see them)
export function clearImageCache() {
  for (const id of Object.keys(imageCache)) {
    if (imageCache[id].startsWith('blob:')) URL.revokeObjectURL(imageCache[id])
    delete imageCache[id]
  }
}
export function useStrips() {
  const { user } = useAuth()

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
    } catch (e) {
      console.error('strips load failed:', e)
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

  // READ: one user's public strips (profile page)
  function loadByUser(userId) {
    return load([
      Query.equal('userId', userId),
      Query.equal('isPublic', true),
      Query.orderDesc('$createdAt'),
      Query.limit(50),
    ])
  }

  // READ: public strips for the wall, 12 at a time (pagination)
  const PAGE_SIZE = 12
  const hasMore = ref(false)
  const loadingMore = ref(false)
  const publicQueries = [Query.equal('isPublic', true), Query.orderDesc('$createdAt')]

  async function loadPublic() {
    await load([...publicQueries, Query.limit(PAGE_SIZE)])
    hasMore.value = strips.value.length === PAGE_SIZE
  }

  // Load the next 12, starting after the last strip we already have
  async function loadMorePublic() {
    const last = strips.value[strips.value.length - 1]
    if (!last) return
    loadingMore.value = true
    try {
      const res = await tablesDB.listRows({
        databaseId: DB_ID,
        tableId: TABLE,
        queries: [...publicQueries, Query.cursorAfter(last.$id), Query.limit(PAGE_SIZE)],
      })
      strips.value.push(...res.rows)
      hasMore.value = res.rows.length === PAGE_SIZE
    } catch (e) {
      console.error('load more failed:', e)
      error.value = "couldn't load more strips. try again."
    } finally {
      loadingMore.value = false
    }
  }

  // READ: one strip by its ID (detail page)
  function getStrip(id) {
    return tablesDB.getRow({ databaseId: DB_ID, tableId: TABLE, rowId: id })
  }

  // CREATE: upload the image (private by default), then save a row that points to it
  async function createStrip(blob, { caption, filter, isPublic = false }) {
    const uid = user.value.$id
    const file = await storage.createFile({
      bucketId: BUCKET_ID,
      fileId: ID.unique(),
      file: new File([blob], 'strip.jpg', { type: 'image/jpeg' }),
      permissions: filePermissions(uid, isPublic),
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
          isPublic,
        },
        permissions: stripPermissions(uid, isPublic),
      })
    } catch (e) {
      // If saving the row fails, remove the uploaded image so nothing is left behind
      await storage.deleteFile({ bucketId: BUCKET_ID, fileId: file.$id }).catch(() => {})
      throw e
    }
  }

  // UPDATE: caption and/or public/private. The image file's permissions change too.
  async function updateStrip(strip, { caption, isPublic }) {
    // File first: when going private, access to the photo is removed straight away
    await storage.updateFile({
      bucketId: BUCKET_ID,
      fileId: strip.imageId,
      permissions: filePermissions(strip.userId, isPublic),
    })
    let updated
    try {
      updated = await tablesDB.updateRow({
        databaseId: DB_ID,
        tableId: TABLE,
        rowId: strip.$id,
        data: { caption, isPublic },
        permissions: stripPermissions(strip.userId, isPublic),
      })
    } catch (e) {
      // Row didn't save: put the photo's permissions back how they were,
      // so the photo is never more public than the strip says
      await storage
        .updateFile({
          bucketId: BUCKET_ID,
          fileId: strip.imageId,
          permissions: filePermissions(strip.userId, strip.isPublic),
        })
        .catch((err) => console.error('permission rollback failed:', err))
      throw e
    }
    strips.value = strips.value.map((s) => (s.$id === strip.$id ? updated : s))
    return updated
  }

  // DELETE: image first, then the row. If the image can't be deleted, stop and report it.
  async function deleteStrip(strip) {
    try {
      await storage.deleteFile({ bucketId: BUCKET_ID, fileId: strip.imageId })
    } catch (e) {
      if (e.code !== 404) throw e // 404 = image already gone, that's fine
    }
    await tablesDB.deleteRow({ databaseId: DB_ID, tableId: TABLE, rowId: strip.$id })
    strips.value = strips.value.filter((s) => s.$id !== strip.$id)
  }

  // ONE-TIME FIX: give my existing photos the right permissions (old ones were public to anyone)
  async function fixMyFilePermissions() {
    for (const s of strips.value) {
      await storage.updateFile({
        bucketId: BUCKET_ID,
        fileId: s.imageId,
        permissions: filePermissions(s.userId, s.isPublic),
      })
    }
  }

  return {
    strips,
    loading,
    error,
    hasMore,
    loadingMore,
    loadMine,
    loadByUser,
    loadPublic,
    loadMorePublic,
    getStrip,
    createStrip,
    updateStrip,
    deleteStrip,
  }
}
