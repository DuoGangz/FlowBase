import { prisma } from '~~/server/utils/prisma'
import { getCurrentUser } from '~~/server/utils/auth'

type CreateBody = {
  title: string
  details?: string
  assignedToId: number
  dueDate?: string
}

type UpdateBody = {
  id: number
  completed?: boolean
}

export default defineEventHandler(async (event) => {
  const me = await getCurrentUser(event)
  if (!me) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const method = getMethod(event)

  if (method === 'GET') {
    // Users see assignments assigned to them; owners/managers can pass filter to see all or by user or authored
    const query = getQuery(event)
    const view = (query.view as string) || 'me' // 'me' | 'all' | 'byUser' | 'authored'
    const userId = query.userId ? Number(query.userId) : undefined
    if (view === 'all' || view === 'byUser' || view === 'authored') {
      if (me.role !== 'OWNER' && me.role !== 'MANAGER' && me.role !== 'ADMIN_MANAGER') throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }
    const where: any = { accountId: me.accountId, completed: false }
    if (view === 'me') where.assignedToId = me.id
    if (view === 'byUser' && userId) where.assignedToId = userId
    if (view === 'authored') {
      delete where.assignedToId
      where.assignedById = me.id
    }
    return prisma.assignment.findMany({ where, orderBy: { createdAt: 'desc' } })
  }

  if (method === 'POST') {
    if (me.role !== 'OWNER' && me.role !== 'MANAGER' && me.role !== 'ADMIN_MANAGER') throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    const body = await readBody<CreateBody>(event)
    if (!body?.title || !body?.assignedToId) throw createError({ statusCode: 400, statusMessage: 'title and assignedToId required' })
    // If assigning to an ADMIN, only OWNER or ADMIN_MANAGER can assign
    const target = await prisma.user.findUnique({ where: { id: Number(body.assignedToId) } })
    if (!target || target.accountId !== me.accountId) throw createError({ statusCode: 404, statusMessage: 'User not found' })
    if (target.role === 'ADMIN' && !(me.role === 'OWNER' || me.role === 'ADMIN_MANAGER')) {
      throw createError({ statusCode: 403, statusMessage: 'Only OWNER or ADMIN_MANAGER can assign to ADMIN' })
    }
    return prisma.assignment.create({
      data: {
        title: body.title,
        details: body.details ?? null,
        assignedToId: Number(body.assignedToId),
        assignedById: me.id,
        accountId: me.accountId,
        dueDate: body.dueDate ? new Date(body.dueDate) : null
      }
    })
  }

  if (method === 'PUT') {
    const body = await readBody<UpdateBody>(event)
    if (!body?.id) throw createError({ statusCode: 400, statusMessage: 'id required' })
    // Only assignee can mark complete; owner/manager can also complete
    const a = await prisma.assignment.findUnique({ where: { id: Number(body.id) } })
    if (!a || a.accountId !== me.accountId) throw createError({ statusCode: 404, statusMessage: 'Not found' })
    const canComplete = me.id === a.assignedToId || me.role === 'OWNER' || me.role === 'MANAGER'
    if (!canComplete) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    const completed = body.completed === true
    return prisma.assignment.update({ where: { id: a.id }, data: { completed, completedAt: completed ? new Date() : null } })
  }

  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
})


