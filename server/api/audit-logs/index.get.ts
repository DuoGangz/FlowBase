import { prisma } from '~~/server/utils/prisma'
import { getCurrentUser } from '~~/server/utils/auth'

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

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      actor: { select: { id: true, name: true } },
      target: { select: { id: true, name: true } }
    }
  })
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


