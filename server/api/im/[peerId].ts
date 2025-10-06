import { getFirestore, getNextSequence } from '~~/server/utils/firestore'
import { getCurrentUser } from '~~/server/utils/auth'

function pairKeyFor(a: string | number, b: string | number) {
  const as = String(a)
  const bs = String(b)
  return as < bs ? `${as}_${bs}` : `${bs}_${as}`
}

export default defineEventHandler(async (event) => {
  const { peerId } = getRouterParams(event)
  if (!peerId) {
    throw createError({ statusCode: 400, statusMessage: 'peerId is required' })
  }

  const me = await getCurrentUser(event)
  if (!me?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const method = getMethod(event)
  const db = getFirestore()
  const key = pairKeyFor(me.id, peerId)

  if (method === 'GET') {
    try {
      const snap = await db
        .collection('directMessages')
        .where('pairKey', '==', key)
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get()
      const list = snap.docs.map(d => d.data())
      return list.sort((a: any, b: any) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')))
    } catch (e: any) {
      // Fallback if composite index is not yet created: remove orderBy and sort in memory
      const msg = String(e?.message || '')
      const code = String(e?.code || '')
      const needsIndex = msg.includes('FAILED_PRECONDITION') || code.includes('failed-precondition')
      if (!needsIndex) throw e
      const snap = await db
        .collection('directMessages')
        .where('pairKey', '==', key)
        .get()
      const list = snap.docs.map(d => d.data() as any)
      list.sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')))
      // keep only latest 100
      return list.slice(-100)
    }
  }

  if (method === 'POST') {
    const body = await readBody<{ content: string }>(event)
    if (!body?.content || !body.content.trim()) {
      throw createError({ statusCode: 400, statusMessage: 'content is required' })
    }
    const id = await getNextSequence('directMessages')
    const doc = {
      id,
      fromUserId: String(me.id),
      toUserId: String(peerId),
      pairKey: key,
      content: body.content.trim(),
      createdAt: new Date().toISOString()
    }
    await db.collection('directMessages').doc(String(id)).set(doc)
    return doc
  }

  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
})


