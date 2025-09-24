import { prisma } from '~~/server/utils/prisma'
import { getCurrentUser } from '~~/server/utils/auth'

type Body = { id: number; role?: 'OWNER' | 'ADMIN' | 'MANAGER' | 'USER'; managerId?: number | null; name?: string; email?: string; username?: string }

export default defineEventHandler(async (event) => {
  const me = await getCurrentUser(event)
  if (!me) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const body = await readBody<Body>(event)
  if (!body?.id) throw createError({ statusCode: 400, statusMessage: 'id required' })

  // Admin can update anyone. Manager can update only subordinates and cannot elevate to ADMIN.
  const target = await prisma.user.findUnique({ where: { id: Number(body.id) } })
  if (!target) throw createError({ statusCode: 404, statusMessage: 'User not found' })

  if (me.role === 'OWNER') {
    const updated = await prisma.user.update({ where: { id: target.id }, data: { role: body.role ?? undefined, managerId: body.managerId ?? undefined, name: body.name ?? undefined, email: body.email ?? undefined, username: body.username ?? undefined } })
    await prisma.auditLog.create({ data: { action: 'ROLE_CHANGE', actorUserId: me.id, targetUserId: updated.id, details: { from: target.role, to: updated.role, managerId: updated.managerId } } })
    return updated
  }

  if (me.role === 'ADMIN') {
    if (body.role === 'OWNER') throw createError({ statusCode: 403, statusMessage: 'Cannot assign OWNER' })
    const updated = await prisma.user.update({ where: { id: target.id }, data: { role: body.role ?? undefined, managerId: body.managerId ?? undefined, name: body.name ?? undefined, email: body.email ?? undefined, username: body.username ?? undefined } })
    await prisma.auditLog.create({ data: { action: 'ROLE_CHANGE', actorUserId: me.id, targetUserId: updated.id, details: { from: target.role, to: updated.role, managerId: updated.managerId } } })
    return updated
  }

  if (me.role === 'MANAGER') {
    // Managers can edit only current subordinates
    const isEditableTarget = target.managerId === me.id
    if (!isEditableTarget) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    // Managers cannot promote to OWNER or ADMIN
    if (body.role === 'ADMIN' || body.role === 'OWNER') throw createError({ statusCode: 403, statusMessage: 'Cannot assign ADMIN/OWNER' })
    // Managers cannot change manager assignment at all
    if (body.managerId !== undefined) {
      throw createError({ statusCode: 403, statusMessage: 'Managers cannot change manager assignment' })
    }
    const updated = await prisma.user.update({ where: { id: target.id }, data: { role: body.role ?? undefined, name: body.name ?? undefined, email: body.email ?? undefined, username: body.username ?? undefined } })
    await prisma.auditLog.create({ data: { action: 'ROLE_CHANGE', actorUserId: me.id, targetUserId: updated.id, details: { from: target.role, to: updated.role, managerId: updated.managerId } } })
    return updated
  }

  // USER cannot update others
  if (me.id !== target.id) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  const updated = await prisma.user.update({ where: { id: target.id }, data: { name: body.name ?? undefined, email: body.email ?? undefined, username: body.username ?? undefined } })
  return updated
})


