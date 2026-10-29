import { ref } from 'vue'
import { ID, Permission, Role, Query } from 'appwrite'
import { tablesDB, storage, DB_ID, BUCKET_ID } from '@/lib/appwrite'

const TABLE = 'catalog'

// URL for showing a frame image
export function fileUrl(fileId) {
  return String(storage.getFileView({ bucketId: BUCKET_ID, fileId }))
}

// Upload a frame image: anyone can view it, only admins can change or delete it
function uploadFile(file) {
  return storage.createFile({
    bucketId: BUCKET_ID,
    fileId: ID.unique(),
    file,
    permissions: [
      Permission.read(Role.any()),
      Permission.update(Role.team('admin')),
      Permission.delete(Role.team('admin')),
    ],
  })
}

export function useCatalog() {
  const items = ref([])
  const loading = ref(false)
  const error = ref('')

  async function load(queries) {
    loading.value = true
    error.value = ''
    try {
      const res = await tablesDB.listRows({ databaseId: DB_ID, tableId: TABLE, queries })
      // settings is saved as text (JSON), so turn it back into an object
      items.value = res.rows.map((row) => ({
        ...row,
        settings: row.settings ? JSON.parse(row.settings) : {},
      }))
    } catch (e) {
      console.error('catalog load failed:', e)
      error.value = "couldn't load filters and frames. try again."
    } finally {
      loading.value = false
    }
  }

  // READ: everything (admin page)
  function loadAll() {
    return load([Query.orderDesc('$createdAt'), Query.limit(100)])
  }

  // READ: only active items (booth)
  function loadActive() {
    return load([Query.equal('active', true), Query.orderAsc('name'), Query.limit(100)])
  }

  // CREATE
  async function createItem({ name, type, active, settings, file, coverFile }) {
    let fileId = null
    if (file) fileId = (await uploadFile(file)).$id
    // frames: optional cover picture, its ID is kept in settings
    if (coverFile) settings = { ...settings, coverId: (await uploadFile(coverFile)).$id }
    await tablesDB.createRow({
      databaseId: DB_ID,
      tableId: TABLE,
      rowId: ID.unique(),
      data: { name, type, active, fileId, settings: JSON.stringify(settings || {}) },
    })
    await loadAll()
  }

  // Update an item. New images (frame / cover) are uploaded and saved first,
  // and only then are the old ones deleted, so the row never points to nothing.
  async function updateItem(item, { name, active, settings, file, coverFile }) {
    let fileId = item.fileId
    if (file) fileId = (await uploadFile(file)).$id
    const oldCoverId = item.settings?.coverId || null
    if (coverFile) settings = { ...settings, coverId: (await uploadFile(coverFile)).$id }
    try {
      await tablesDB.updateRow({
        databaseId: DB_ID,
        tableId: TABLE,
        rowId: item.$id,
        data: { name, active, fileId, settings: JSON.stringify(settings || {}) },
      })
    } catch (e) {
      // Row didn't save: remove the new uploads again, the old images stay
      if (file) await storage.deleteFile({ bucketId: BUCKET_ID, fileId }).catch(() => {})
      if (coverFile)
        await storage.deleteFile({ bucketId: BUCKET_ID, fileId: settings.coverId }).catch(() => {})
      throw e
    }
    // Saved: now the old images can go
    if (file && item.fileId) await removeFile(item.fileId)
    if (coverFile && oldCoverId) await removeFile(oldCoverId)
    await loadAll()
  }

  function removeFile(id) {
    return storage
      .deleteFile({ bucketId: BUCKET_ID, fileId: id })
      .catch((e) => console.error('old image cleanup failed:', e))
  }

  // DELETE: the row, then its frame image and cover picture
  async function deleteItem(item) {
    await tablesDB.deleteRow({ databaseId: DB_ID, tableId: TABLE, rowId: item.$id })
    if (item.fileId)
      await storage.deleteFile({ bucketId: BUCKET_ID, fileId: item.fileId }).catch(() => {})
    if (item.settings?.coverId)
      await storage
        .deleteFile({ bucketId: BUCKET_ID, fileId: item.settings.coverId })
        .catch(() => {})
    items.value = items.value.filter((i) => i.$id !== item.$id)
  }

  return { items, loading, error, loadAll, loadActive, createItem, updateItem, deleteItem }
}
