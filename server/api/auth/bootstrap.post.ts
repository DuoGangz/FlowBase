import { prisma } from '~~/server/utils/prisma'

export default defineEventHandler(async () => {
  // Idempotent: create default account and admin if not exists
  const account = await prisma.account.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: 'Default' }
  })
  const existing = await prisma.user.findUnique({ where: { username: 'admin' } })
  if (existing) return { ok: true, userId: existing.id }
  const user = await prisma.user.create({
    data: {
      name: 'Administrator',
      email: 'admin@example.com',
      username: 'admin',
      passwordHash: '1234', // demo-only
      role: 'OWNER',
      accountId: account.id
    }
  })
  return { ok: true, userId: user.id }
})


