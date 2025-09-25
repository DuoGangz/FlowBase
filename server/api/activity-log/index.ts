import { prisma } from '~~/server/utils/prisma'
import { getCurrentUser } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const me = await getCurrentUser(event)
  if (!me) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  if (me.role !== 'OWNER' && me.role !== 'MANAGER') throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const query = getQuery(event)
  const userId = query.userId ? Number(query.userId) : undefined
  const status = (query.status as string) || 'all' // 'all' | 'completed' | 'assigned'

  const where: any = { accountId: me.accountId }
  if (status === 'completed') where.completed = true
  if (status === 'assigned') where.completed = false
  if (userId) where.assignedToId = userId

  const items = await prisma.assignment.findMany({
    where,
    orderBy: [
      { completed: 'asc' },
      { completedAt: 'desc' },
      { createdAt: 'desc' }
    ],
    include: { assignedTo: true, assignedBy: true }
  })
  return items.map(i => ({
    id: i.id,
    title: i.title,
    createdAt: i.createdAt,
    completedAt: i.completedAt,
    completed: i.completed,
    assignedTo: { id: i.assignedTo.id, name: i.assignedTo.name },
    assignedBy: { id: i.assignedBy.id, name: i.assignedBy.name }
  }))
})


