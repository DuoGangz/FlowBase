import { getCurrentUser } from '~~/server/utils/auth'
import { getFirestore } from '~~/server/utils/firestore'

export default defineEventHandler(async (event) => {
  const me = await getCurrentUser(event)
  if (!me) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const db = getFirestore()
  const isMgr = me.role === 'OWNER' || me.role === 'ADMIN' || me.role === 'MANAGER' || me.role === 'ADMIN_MANAGER'

  if (isMgr) {
    const snap = await db.collection('users').get()
    // Sort newest first by createdAt if present
    const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))
      .sort((a: any, b: any) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    return list
  }
  const meSnap = await db.collection('users').doc(String(me.id)).get()
  return meSnap.exists ? [{ id: meSnap.id, ...(meSnap.data() as any) }] : []
})


