import { prisma } from '~~/server/utils/prisma'
import { getCurrentUser } from '~~/server/utils/auth'

type PostBody = {
  userId: number
  action: 'clockIn' | 'lunchOut' | 'lunchIn' | 'clockOut'
  timestamp?: string
  tzOffsetMinutes?: number
}

function normalizeDateForLocalDay(date: Date, tzOffsetMinutes: number): Date {
  const local = new Date(date.getTime() - tzOffsetMinutes * 60_000)
  const y = local.getFullYear()
  const m = local.getMonth()
  const d = local.getDate()
  // Return as UTC midnight for that local day
  return new Date(Date.UTC(y, m, d, 0, 0, 0, 0))
}

export default defineEventHandler(async (event) => {
  const me = await getCurrentUser(event)
  if (!me) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const method = getMethod(event)

  if (method === 'POST') {
    const body = await readBody<PostBody>(event)
    if (!body?.userId || !body?.action) {
      throw createError({ statusCode: 400, statusMessage: 'userId and action are required' })
    }
    // Only allow posting for self unless ADMIN
    if (me.role !== 'ADMIN' && Number(body.userId) !== me.id) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }
    const now = body.timestamp ? new Date(body.timestamp) : new Date()
    const tz = typeof body.tzOffsetMinutes === 'number' ? body.tzOffsetMinutes : 0
    const date = normalizeDateForLocalDay(now, tz)

    // Ensure the entry exists for this local day
    const entry = await prisma.timeEntry.upsert({
      where: { userId_date: { userId: Number(body.userId), date } },
      update: {},
      create: { userId: Number(body.userId), date }
    })

    // Determine field to set
    const field = body.action
    const current = await prisma.timeEntry.findUnique({ where: { userId_date: { userId: entry.userId, date } } })
    const already = (current as any)?.[field] as Date | null
    if (already) {
      return { ok: true, entry: current }
    }

    const updated = await prisma.timeEntry.update({
      where: { id: entry.id },
      data: { [field]: now }
    })
    return { ok: true, entry: updated }
  }

  if (method === 'GET') {
    const q = getQuery(event)
    const userId = q.userId ? Number(q.userId) : me.id
    // RBAC: USER can see only self; MANAGER can see subordinates; ADMIN any
    if (me.role === 'USER' && userId !== me.id) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    if (me.role === 'MANAGER' && userId !== me.id) {
      const target = await prisma.user.findUnique({ where: { id: userId } })
      if (!target || target.managerId !== me.id) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    // Optional date range (YYYY-MM-DD) treated as UTC midnight boundaries
    const startStr = typeof q.start === 'string' ? q.start : null
    const endStr = typeof q.end === 'string' ? q.end : null

    let start: Date | undefined
    let end: Date | undefined
    if (startStr) start = new Date(startStr + 'T00:00:00.000Z')
    if (endStr) end = new Date(endStr + 'T23:59:59.999Z')
    if (!start || !end) {
      const today = new Date()
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(today.getDate() - 30)
      start = start ?? new Date(Date.UTC(thirtyDaysAgo.getUTCFullYear(), thirtyDaysAgo.getUTCMonth(), thirtyDaysAgo.getUTCDate()))
      end = end ?? new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59, 999))
    }

    const entries = await prisma.timeEntry.findMany({
      where: { userId, date: { gte: start, lte: end } },
      orderBy: { date: 'desc' }
    })
    return entries
  }

  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
})


