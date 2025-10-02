import { getCurrentUser } from '~~/server/utils/auth'
import { getFirestore } from '~~/server/utils/firestore'

type PostBody = {
  userId: string | number
  action: 'clockIn' | 'lunchOut' | 'lunchIn' | 'clockOut'
  timestamp?: string
  tzOffsetMinutes?: number
}

function normalizeDateForLocalDay(date: Date, tzOffsetMinutes: number): string {
  const local = new Date(date.getTime() - (tzOffsetMinutes ?? 0) * 60_000)
  const y = local.getUTCFullYear()
  const m = local.getUTCMonth()
  const d = local.getUTCDate()
  const iso = new Date(Date.UTC(y, m, d, 0, 0, 0, 0)).toISOString()
  return iso
}

export default defineEventHandler(async (event) => {
  const me = await getCurrentUser(event)
  if (!me) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const method = getMethod(event)
  const db = getFirestore()

  if (method === 'POST') {
    const body = await readBody<PostBody>(event)
    if (!body?.userId || !body?.action) {
      throw createError({ statusCode: 400, statusMessage: 'userId and action are required' })
    }
    const requestedUserId = String(body.userId)
    if (me.role !== 'ADMIN' && requestedUserId !== String(me.id)) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }
    const now = body.timestamp ? new Date(body.timestamp) : new Date()
    const dayKey = normalizeDateForLocalDay(now, body.tzOffsetMinutes || 0)
    const docId = `${requestedUserId}_${dayKey}`

    const ref = db.collection('timeEntries').doc(docId)
    const snap = await ref.get()
    if (!snap.exists) {
      await ref.set({ id: docId, userId: requestedUserId, date: dayKey })
    }
    const field = body.action
    const data: any = (await ref.get()).data() || { id: docId, userId: requestedUserId, date: dayKey }
    if (data[field]) {
      return { ok: true, entry: data }
    }
    const patch: any = {}
    patch[field] = now.toISOString()
    await ref.set({ ...data, ...patch }, { merge: true })
    const updated = (await ref.get()).data()
    return { ok: true, entry: updated }
  }

  if (method === 'GET') {
    const q = getQuery(event)
    const userId = String(q.userId || me.id)
    // RBAC minimal: users see self; others require ADMIN/MANAGER/OWNER
    if (String(me.id) !== userId && !(me.role === 'ADMIN' || me.role === 'MANAGER' || me.role === 'OWNER' || me.role === 'ADMIN_MANAGER')) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    // Optional date range (YYYY-MM-DD) treated as UTC midnight boundaries
    const startStr = typeof q.start === 'string' ? q.start : null
    const endStr = typeof q.end === 'string' ? q.end : null
    let startIso: string
    let endIso: string
    if (startStr && endStr) {
      startIso = new Date(startStr + 'T00:00:00.000Z').toISOString()
      endIso = new Date(endStr + 'T23:59:59.999Z').toISOString()
    } else {
      const today = new Date()
      const ago = new Date(today)
      ago.setDate(today.getDate() - 30)
      startIso = new Date(Date.UTC(ago.getUTCFullYear(), ago.getUTCMonth(), ago.getUTCDate())).toISOString()
      endIso = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59, 999)).toISOString()
    }

    // Firestore: query by userId and date range
    const snap = await db
      .collection('timeEntries')
      .where('userId', '==', userId)
      .where('date', '>=', startIso)
      .where('date', '<=', endIso)
      .get()
    const items = snap.docs.map(d => d.data()).sort((a: any, b: any) => String(b.date).localeCompare(String(a.date)))
    return items
  }

  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
})
