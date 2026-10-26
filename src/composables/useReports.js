import { ref } from 'vue'
import { ID, Query } from 'appwrite'
import { tablesDB, storage, DB_ID, BUCKET_ID } from '@/lib/appwrite'
import { useAuth } from '@/composables/useAuth'

const TABLE = 'reports'

export function useReports() {
  const { user } = useAuth()
  const reports = ref([])
  const loading = ref(false)
  const error = ref('')

  // USER — CREATE: report a strip
  function createReport(stripId, reason, note) {
    return tablesDB.createRow({
      databaseId: DB_ID,
      tableId: TABLE,
      rowId: ID.unique(),
      data: { stripId, reporterId: user.value.$id, reason, note, status: 'open' },
    })
  }

  // ADMIN — READ: open reports, each with its strip attached
  async function loadOpen() {
    loading.value = true
    error.value = ''
    try {
      const res = await tablesDB.listRows({
        databaseId: DB_ID,
        tableId: TABLE,
        queries: [Query.equal('status', 'open'), Query.orderDesc('$createdAt'), Query.limit(50)],
      })
      // Fetch the reported strip for each report (null if it's already gone)
      reports.value = await Promise.all(
        res.rows.map(async (report) => {
          const strip = await tablesDB
            .getRow({ databaseId: DB_ID, tableId: 'strips', rowId: report.stripId })
            .catch(() => null)
          return { ...report, strip }
        }),
      )
    } catch (e) {
      console.error('reports load failed:', e)
      error.value = "couldn't load reports. try again."
    } finally {
      loading.value = false
    }
  }

  // ADMIN — UPDATE: mark as handled (the strip stays)
  async function resolve(report) {
    await tablesDB.updateRow({
      databaseId: DB_ID,
      tableId: TABLE,
      rowId: report.$id,
      data: { status: 'resolved' },
    })
    reports.value = reports.value.filter((r) => r.$id !== report.$id)
  }

  // ADMIN — DELETE the reported strip (and its image), then resolve the report
  async function removeStrip(report) {
    if (report.strip) {
      await tablesDB.deleteRow({ databaseId: DB_ID, tableId: 'strips', rowId: report.strip.$id })
      await storage
        .deleteFile({ bucketId: BUCKET_ID, fileId: report.strip.imageId })
        .catch(() => {})
    }
    await resolve(report)
  }

  return { reports, loading, error, createReport, loadOpen, resolve, removeStrip }
}
