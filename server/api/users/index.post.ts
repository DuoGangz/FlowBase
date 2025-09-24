import { prisma } from '~~/server/utils/prisma'
import { getCurrentUser } from '~~/server/utils/auth'

type Body = { name: string; email: string; username?: string; role?: 'OWNER' | 'ADMIN' | 'MANAGER' | 'USER'; managerId?: number }

export default defineEventHandler(async (event) => {
  const me = await getCurrentUser(event)
  if (!me) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  if (me.role !== 'ADMIN' && me.role !== 'OWNER') throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const body = await readBody<Body>(event)
  if (!body?.name || !body?.email) throw createError({ statusCode: 400, statusMessage: 'name and email required' })

  const username = body.username && body.username.trim() !== ''
    ? body.username.trim()
    : (body.email.includes('@') ? body.email.split('@')[0] : body.name.toLowerCase().replace(/\s+/g, ''))

  const created = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      username,
      accountId: me.accountId,
      role: body.role ?? 'USER',
      managerId: body.managerId ?? null
    }
  })
  await prisma.auditLog.create({
    data: {
      action: 'USER_CREATE',
      actorUserId: me.id,
      targetUserId: created.id,
      details: { role: created.role, managerId: created.managerId }
    }
  })
  return created
})


