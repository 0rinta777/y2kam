import { Query } from 'appwrite'
import { account, tablesDB, storage, DB_ID, BUCKET_ID } from '@/lib/appwrite'
import { useAuth } from '@/composables/useAuth'

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

  // UPDATE: new username on the account AND on my strips + comments
  // (the name is also stored on those rows, so old posts show the new name)
  async function changeName(name) {
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
    await loadUser() // refresh the name in the nav
  }

  // UPDATE: new password (Appwrite checks the old one)
  function changePassword(oldPassword, password) {
    return account.updatePassword({ password, oldPassword })
  }

  // DELETE: remove my strips (+ images) and comments, then block the account
  async function deleteAccount() {
    const uid = user.value.$id
    const [strips, comments] = await Promise.all([myRows('strips', uid), myRows('comments', uid)])
    for (const s of strips) {
      await tablesDB.deleteRow({ databaseId: DB_ID, tableId: 'strips', rowId: s.$id })
      await storage.deleteFile({ bucketId: BUCKET_ID, fileId: s.imageId }).catch(() => {})
    }
    for (const c of comments) {
      await tablesDB.deleteRow({ databaseId: DB_ID, tableId: 'comments', rowId: c.$id })
    }
    await account.updateStatus() // blocks the account and ends all sessions
    await loadUser() // now logged out
  }

  return { changeName, changePassword, deleteAccount }
}
