import { prisma } from '~~/server/utils/prisma'
import { getCurrentUser } from '~~/server/utils/auth'

type CreateBody = {
  name: string
  layout?: any
  isDefault?: boolean
}

export default defineEventHandler(async (event) => {
  const me = await getCurrentUser(event)
  if (!me) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const method = getMethod(event)

  if (method === 'GET') {
    // If no pages exist yet for this account, create a default one
    const existingCount = await prisma.homePage.count({ where: { accountId: me.accountId } })
    if (existingCount === 0) {
      await prisma.homePage.create({ data: { accountId: me.accountId, name: 'Home', layout: { modules: [] }, isDefault: true } })
    }

    // Everyone sees: default page(s) and any pages they have explicit permission for,
    // plus their own personal page if they created one.
    return prisma.homePage.findMany({
      where: {
        accountId: me.accountId,
        OR: [
          { isDefault: true },
          { permissions: { some: { userId: me.id } } }
        ]
      },
      orderBy: { createdAt: 'asc' }
    })
  }

  if (method === 'POST') {
    const body = await readBody<CreateBody>(event)
    const name = (body?.name || '').trim()
    if (!name) throw createError({ statusCode: 400, statusMessage: 'name is required' })

    // Limit to max 4 pages per account
    const count = await prisma.homePage.count({ where: { accountId: me.accountId } })
    if (count >= 4) throw createError({ statusCode: 400, statusMessage: 'Page limit reached (4)' })

    // OWNER/ADMIN: same behavior as before (can set default)
    if (me.role === 'OWNER' || me.role === 'ADMIN') {
      if (body.isDefault) {
        await prisma.homePage.updateMany({ where: { accountId: me.accountId, isDefault: true }, data: { isDefault: false } })
      }
      const created = await prisma.homePage.create({
        data: {
          accountId: me.accountId,
          name,
          layout: body.layout ?? { modules: [] },
          isDefault: body.isDefault ?? false
        }
      })
      return created
    }

    // Non-admin users: allow creating a personal page they can edit (not default)
    const created = await prisma.homePage.create({
      data: {
        accountId: me.accountId,
        name,
        layout: body.layout ?? { modules: [] },
        isDefault: false
      }
    })
    // Grant self-edit permission
    await prisma.homePagePermission.create({ data: { homePageId: created.id, userId: me.id, canEdit: true } })
    return created
  }

  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
})


