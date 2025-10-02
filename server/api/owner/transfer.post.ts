import { getCurrentUser } from '~~/server/utils/auth'
import { getFirestore } from '~~/server/utils/firestore'

type Body = { targetUserId: string }

export default defineEventHandler(async (event) => {
  const me = await getCurrentUser(event)
  if (!me) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  if (me.role !== 'OWNER') throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const body = await readBody<Body>(event)
  const targetId = String(body?.targetUserId || '')
  if (!targetId) throw createError({ statusCode: 400, statusMessage: 'targetUserId required' })
  if (String(targetId) === String(me.id)) throw createError({ statusCode: 400, statusMessage: 'Already owner' })

  const db = getFirestore()
  const targetSnap = await db.collection('users').doc(targetId).get()
  if (!targetSnap.exists) throw createError({ statusCode: 404, statusMessage: 'Target user not found' })

  // Demote current owner to ADMIN, promote target to OWNER (best effort)
  await db.collection('users').doc(String(me.id)).set({ role: 'ADMIN' }, { merge: true })
  await db.collection('users').doc(targetId).set({ role: 'OWNER' }, { merge: true })
  return { ok: true }
})


