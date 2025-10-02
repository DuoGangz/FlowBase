import { getCurrentUser } from '~~/server/utils/auth'
import { getFirestore } from '~~/server/utils/firestore'

export default defineEventHandler(async (event) => {
  const me = await getCurrentUser(event)
  if (!me) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  if (me.role !== 'OWNER' && me.role !== 'ADMIN') throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const q = getQuery(event)
  const action = typeof q.action === 'string' ? q.action : undefined
  const startStr = typeof q.start === 'string' ? q.start : undefined
  const endStr = typeof q.end === 'string' ? q.end : undefined
  const start = startStr ? new Date(startStr + 'T00:00:00.000Z') : undefined
  const end = endStr ? new Date(endStr + 'T23:59:59.999Z') : undefined

  const where: any = {}
  if (action) where.action = action
  if (start || end) where.createdAt = { gte: start, lte: end }

  const db = getFirestore()
  // Firestore: simple read of recent logs, filtering client-side for optional fields
  const snap = await db.collection('auditLogs').orderBy('createdAt', 'desc').limit(200).get().catch(async () => {
    return await db.collection('auditLogs').limit(200).get()
  })
  let logs: any[] = snap.docs.map(d => d.data())
  if (where.action) logs = logs.filter(l => l.action === where.action)
  if (where.createdAt?.gte) logs = logs.filter(l => new Date(l.createdAt) >= where.createdAt!.gte)
  if (where.createdAt?.lte) logs = logs.filter(l => new Date(l.createdAt) <= where.createdAt!.lte)
  if (q.format === 'csv') {
    const escape = (v: any) => {
      if (v === null || v === undefined) return ''
      const s = String(v)
      if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
      return s
    }
    const rows = [['createdAt','action','actorId','actorName','targetId','targetName','details']]
    for (const l of logs) {
      rows.push([
        l.createdAt.toISOString(),
        l.action,
        l.actorUserId,
        l.actor?.name ?? '',
        l.targetUserId ?? '',
        l.target?.name ?? '',
        JSON.stringify(l.details)
      ].map(escape) as any)
    }
    const csv = rows.map(r => r.join(',')).join('\n')
    setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
    setHeader(event, 'Content-Disposition', 'attachment; filename="audit-logs.csv"')
    return csv
  }
  return logs
})


