import { Query } from 'appwrite'
import { account, tablesDB, storage, DB_ID, BUCKET_ID } from '@/lib/appwrite'
import { useAuth } from '@/composables/useAuth'
import { useProfile, getProfile } from '@/composables/useProfile'

// All rows in a table that belong to this user
async function myRows(tableId, userId) {
  const res = await tablesDB.listRows({
    databaseId: DB_ID,
    tableId,
    queries: [Query.equal('userId', userId), Query.limit(500)],
  })
  return res.rows
}

export function useAccount() {
  const { user, loadUser } = useAuth()
  const { saveProfile } = useProfile()

  // UPDATE username: profile first (fails with 409 if taken), then account, strips and comments
  async function changeName(name) {
    await saveProfile({ username: name })
    await account.updateName({ name })
    const uid = user.value.$id
    const [strips, comments] = await Promise.all([myRows('strips', uid), myRows('comments', uid)])
    await Promise.all([
      ...strips.map((s) =>
        tablesDB.updateRow({
          databaseId: DB_ID,
          tableId: 'strips',
          rowId: s.$id,
          data: { username: name },
        }),
      ),
      ...comments.map((c) =>
        tablesDB.updateRow({
          databaseId: DB_ID,
          tableId: 'comments',
          rowId: c.$id,
          data: { username: name },
        }),
      ),
    ])
    await loadUser()
  }

  // UPDATE password (Appwrite checks the old one)
  function changePassword(oldPassword, password) {
    return account.updatePassword({ password, oldPassword })
  }

  // DELETE: strips (+ images), comments, profile (+ picture), then block the account
  async function deleteAccount() {
    const uid = user.value.$id
    const [strips, comments, profile] = await Promise.all([
      myRows('strips', uid),
      myRows('comments', uid),
      getProfile(uid),
    ])
    for (const s of strips) {
      await tablesDB.deleteRow({ databaseId: DB_ID, tableId: 'strips', rowId: s.$id })
      await storage.deleteFile({ bucketId: BUCKET_ID, fileId: s.imageId }).catch(() => {})
    }
    for (const c of comments) {
      await tablesDB.deleteRow({ databaseId: DB_ID, tableId: 'comments', rowId: c.$id })
    }
    if (profile) {
      if (profile.avatarId)
        await storage.deleteFile({ bucketId: BUCKET_ID, fileId: profile.avatarId }).catch(() => {})
      await tablesDB.deleteRow({ databaseId: DB_ID, tableId: 'profiles', rowId: uid })
    }
    await account.updateStatus()
    await loadUser()
  }

  return { changeName, changePassword, deleteAccount }
}
