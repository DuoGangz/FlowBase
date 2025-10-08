import { getCurrentUser } from '~~/server/utils/auth'
import { getFirestore } from '~~/server/utils/firestore'

// Returns a minimal directory for @mentions and DM selection
// Everyone authenticated can see id + name of all users
export default defineEventHandler(async (event) => {
  const me = await getCurrentUser(event)
  if (!me?.id) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const db = getFirestore()
  const snap = await db.collection('users').get()
  const list = snap.docs
    .map(d => ({ id: String(d.id), ...(d.data() as any) }))
    .map(u => ({ id: String(u.id), name: String(u.name || u.email || 'User ' + u.id) }))
    .filter(u => u.id !== String(me.id))
    .sort((a, b) => a.name.localeCompare(b.name))
  return list
})


