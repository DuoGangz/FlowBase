import { prisma } from '~~/server/utils/prisma'
import { getCurrentUser, requireRole } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const me = await getCurrentUser(event)
  if (!me) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  if (me.role === 'OWNER' || me.role === 'ADMIN') {
    return prisma.user.findMany({ orderBy: { createdAt: 'desc' } })
  }
  if (me.role === 'MANAGER') {
    // Managers can view all users (read-only for non-subordinates)
    return prisma.user.findMany({ orderBy: { createdAt: 'desc' } })
  }
  // USER sees only self
  return prisma.user.findMany({ where: { id: me.id } })
})


