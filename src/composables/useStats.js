import { ref } from 'vue'
import { Query } from 'appwrite'
import { tablesDB, DB_ID } from '@/lib/appwrite'

// Count rows in a table that match the queries (limit 1 = we only need the total)
async function count(tableId, queries = []) {
  const res = await tablesDB.listRows({
    databaseId: DB_ID,
    tableId,
    queries: [...queries, Query.limit(1)],
  })
  return res.total
}

export function useStats() {
  const stats = ref(null)
  const loading = ref(false)
  const error = ref('')

  async function load() {
    loading.value = true
    error.value = ''
    try {
      const [strips, publicStrips, openReports, activeItems] = await Promise.all([
        count('strips'),
        count('strips', [Query.equal('isPublic', true)]),
        count('reports', [Query.equal('status', 'open')]),
        count('catalog', [Query.equal('active', true)]),
      ])
      stats.value = { strips, publicStrips, openReports, activeItems }
    } catch (e) {
      console.error('stats failed:', e)
      error.value = "couldn't load the numbers. try again."
    } finally {
      loading.value = false
    }
  }

  return { stats, loading, error, load }
}
