import { ref, computed } from 'vue'
import { Query } from 'appwrite'
import { tablesDB, DB_ID } from '@/lib/appwrite'
import { useAuth } from '@/composables/useAuth'
import { getProfile, useProfile } from '@/composables/useProfile'

// Small helper: list rows in a table
const list = (tableId, queries) =>
  tablesDB.listRows({ databaseId: DB_ID, tableId, queries }).then((r) => r.rows)

// Shared state: one bell for the whole app
const items = ref([])
const seenAt = ref(null)
const loading = ref(false)

export function useNotifications() {
  const { user } = useAuth()
  const { saveProfile } = useProfile()

  // New = created after I last opened the bell
  const unread = computed(
    () =>
      items.value.filter((n) => !seenAt.value || new Date(n.$createdAt) > new Date(seenAt.value))
        .length,
  )

  // Work out my notifications from likes + comments on MY strips by OTHER people
  async function load() {
    if (!user.value) return
    loading.value = true
    try {
      const uid = user.value.$id
      const myStrips = await list('strips', [Query.equal('userId', uid), Query.limit(100)])
      if (myStrips.length === 0) {
        items.value = []
        return
      }
      const ids = myStrips.map((s) => s.$id)
      const captions = Object.fromEntries(myStrips.map((s) => [s.$id, s.caption || 'your strip']))
      const notMe = Query.notEqual('userId', uid)

      const [likes, comments, profile] = await Promise.all([
        list('likes', [
          Query.equal('stripId', ids),
          notMe,
          Query.orderDesc('$createdAt'),
          Query.limit(20),
        ]),
        list('comments', [
          Query.equal('stripId', ids),
          notMe,
          Query.orderDesc('$createdAt'),
          Query.limit(20),
        ]),
        getProfile(uid),
      ])
      seenAt.value = profile?.seenAt || null

      // Likes only store a userId, so look up the likers' usernames in profiles
      const likerIds = [...new Set(likes.map((l) => l.userId))]
      const profiles = likerIds.length
        ? await list('profiles', [Query.equal('$id', likerIds), Query.limit(100)])
        : []
      const names = Object.fromEntries(profiles.map((p) => [p.$id, p.username]))

      items.value = [
        ...likes.map((l) => ({
          $id: l.$id,
          $createdAt: l.$createdAt,
          stripId: l.stripId,
          text: `${names[l.userId] || 'someone'} liked "${captions[l.stripId]}"`,
        })),
        ...comments.map((c) => ({
          $id: c.$id,
          $createdAt: c.$createdAt,
          stripId: c.stripId,
          text: `${c.username || 'someone'} commented on "${captions[c.stripId]}": ${c.text}`,
        })),
      ]
        .sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt))
        .slice(0, 20)
    } catch (e) {
      console.error('notifications failed:', e)
    } finally {
      loading.value = false
    }
  }

  // Opening the bell = everything is seen (saved on my profile, so it works on every device)
  async function markSeen() {
    const now = new Date().toISOString()
    seenAt.value = now
    try {
      await saveProfile({ seenAt: now })
    } catch (e) {
      console.error('mark seen failed:', e)
    }
  }

  return { items, unread, loading, load, markSeen }
}
