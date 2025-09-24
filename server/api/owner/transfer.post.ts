import { prisma } from '~~/server/utils/prisma'
import { getCurrentUser } from '~~/server/utils/auth'

type Body = { targetUserId: number }

export default defineEventHandler(async (event) => {
  const me = await getCurrentUser(event)
  if (!me) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  if (me.role !== 'OWNER') throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const body = await readBody<Body>(event)
  const targetId = Number(body?.targetUserId)
  if (!targetId) throw createError({ statusCode: 400, statusMessage: 'targetUserId required' })
  if (targetId === me.id) throw createError({ statusCode: 400, statusMessage: 'Already owner' })

  const target = await prisma.user.findUnique({ where: { id: targetId } })
  if (!target) throw createError({ statusCode: 404, statusMessage: 'Target user not found' })
  if (target.accountId !== me.accountId) throw createError({ statusCode: 403, statusMessage: 'Must be same account' })

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: me.id }, data: { role: 'ADMIN' } })
    await tx.user.update({ where: { id: target.id }, data: { role: 'OWNER' } })
    await tx.auditLog.create({ data: { action: 'OWNERSHIP_TRANSFER', actorUserId: me.id, targetUserId: target.id, details: { fromUserId: me.id, toUserId: target.id } } })
  })

  return { ok: true }
})


