import { ID, Permission, Role } from 'appwrite'
import { tablesDB, storage, DB_ID, BUCKET_ID } from '@/lib/appwrite'
import { useAuth } from '@/composables/useAuth'
import { squareImage } from '@/lib/image'

const TABLE = 'profiles'

// URL for a profile picture ('' if there is none)
export function avatarUrl(fileId) {
  return fileId ? String(storage.getFileView({ bucketId: BUCKET_ID, fileId })) : ''
}

// READ: one profile. The row ID is the user's ID, so it's one direct lookup.
// Returns null if this user hasn't got a profile yet.
export async function getProfile(userId) {
  try {
    return await tablesDB.getRow({ databaseId: DB_ID, tableId: TABLE, rowId: userId })
  } catch (e) {
    if (e.code === 404) return null
    throw e
  }
}

export function useProfile() {
  const { user } = useAuth()

  // CREATE or UPDATE my profile
  async function saveProfile(data) {
    const uid = user.value.$id
    const existing = await getProfile(uid)
    if (existing) {
      return tablesDB.updateRow({ databaseId: DB_ID, tableId: TABLE, rowId: uid, data })
    }
    return tablesDB.createRow({
      databaseId: DB_ID,
      tableId: TABLE,
      rowId: uid, // profile ID = user ID
      data: { username: user.value.name, ...data },
      permissions: [Permission.update(Role.user(uid)), Permission.delete(Role.user(uid))], // only I can edit it
    })
  }

  // After sign up: create the profile. Returns false if the username is already taken.
  async function ensureProfile() {
    try {
      await saveProfile({})
      return true
    } catch (e) {
      if (e.code === 409) return false // unique index: someone already has this username
      throw e
    }
  }

  // Upload a new profile picture and replace the old one
  async function changeAvatar(file, oldId) {
    const uid = user.value.$id
    const square = await squareImage(file)
    const uploaded = await storage.createFile({
      bucketId: BUCKET_ID,
      fileId: ID.unique(),
      file: square,
      permissions: [
        Permission.read(Role.any()),
        Permission.update(Role.user(uid)),
        Permission.delete(Role.user(uid)),
      ],
    })
    await saveProfile({ avatarId: uploaded.$id })
    if (oldId) await storage.deleteFile({ bucketId: BUCKET_ID, fileId: oldId }).catch(() => {})
    return uploaded.$id
  }

  return { saveProfile, ensureProfile, changeAvatar }
}
