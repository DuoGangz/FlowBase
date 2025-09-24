import { prisma } from '~~/server/utils/prisma'

export default defineEventHandler(async () => {
  // Ensure default account exists
  const account = await prisma.account.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: 'Default' }
  })

  // Create owner user if missing
  const existing = await prisma.user.findUnique({ where: { username: 'owner' } })
  if (existing) {
    // also ensure the default admin is not marked OWNER anymore
    const admin = await prisma.user.findUnique({ where: { username: 'admin' } })
    if (admin && admin.role === 'OWNER') {
      await prisma.user.update({ where: { id: admin.id }, data: { role: 'ADMIN' } })
      await prisma.auditLog.create({ data: { action: 'ROLE_CHANGE', actorUserId: existing.id, targetUserId: admin.id, details: { from: 'OWNER', to: 'ADMIN' } } })
    }
    return { ok: true, userId: existing.id, existed: true }
  }

  const user = await prisma.user.create({
    data: {
      name: 'Owner',
      email: 'owner@example.com',
      username: 'owner',
      passwordHash: '1234', // demo-only
      role: 'OWNER',
      accountId: account.id
    }
  })
  // demote admin if currently OWNER
  const admin = await prisma.user.findUnique({ where: { username: 'admin' } })
  if (admin && admin.role === 'OWNER') {
    await prisma.user.update({ where: { id: admin.id }, data: { role: 'ADMIN' } })
    await prisma.auditLog.create({ data: { action: 'ROLE_CHANGE', actorUserId: user.id, targetUserId: admin.id, details: { from: 'OWNER', to: 'ADMIN' } } })
  }
  return { ok: true, userId: user.id, existed: false }
})


