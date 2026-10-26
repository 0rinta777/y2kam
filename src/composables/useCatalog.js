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
  async function createItem({ name, type, active, settings, file }) {
    let fileId = null
    if (file) fileId = (await uploadFile(file)).$id
    await tablesDB.createRow({
      databaseId: DB_ID,
      tableId: TABLE,
      rowId: ID.unique(),
      data: { name, type, active, fileId, settings: JSON.stringify(settings || {}) },
    })
    await loadAll()
  }

  // UPDATE (a new file replaces the old one)
  async function updateItem(item, { name, active, settings, file }) {
    let fileId = item.fileId
    if (file) {
      fileId = (await uploadFile(file)).$id
      if (item.fileId)
        await storage.deleteFile({ bucketId: BUCKET_ID, fileId: item.fileId }).catch(() => {})
    }
    await tablesDB.updateRow({
      databaseId: DB_ID,
      tableId: TABLE,
      rowId: item.$id,
      data: { name, active, fileId, settings: JSON.stringify(settings || {}) },
    })
    await loadAll()
  }

  // DELETE (and its image)
  async function deleteItem(item) {
    await tablesDB.deleteRow({ databaseId: DB_ID, tableId: TABLE, rowId: item.$id })
    if (item.fileId)
      await storage.deleteFile({ bucketId: BUCKET_ID, fileId: item.fileId }).catch(() => {})
    items.value = items.value.filter((i) => i.$id !== item.$id)
  }

  return { items, loading, error, loadAll, loadActive, createItem, updateItem, deleteItem }
}
