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

    // Ensure the user has a personal page with edit permission
    const mineCount = await prisma.homePagePermission.count({ where: { userId: me.id } })
    if (mineCount === 0) {
      // Create a uniquely named personal page to avoid the (accountId, name) unique constraint
      const personalName = `My Page #${me.id}`
      const created = await prisma.homePage.create({
        data: { accountId: me.accountId, name: personalName, layout: { modules: [] }, isDefault: false }
      })
      await prisma.homePagePermission.create({ data: { homePageId: created.id, userId: me.id, canEdit: true } })
    }

    // Everyone sees: default page(s) and any pages they have explicit permission for.
    // Also mark which pages are "mine" (I have an explicit permission entry)
    const pages = await prisma.homePage.findMany({
      where: {
        accountId: me.accountId,
        OR: [
          { isDefault: true },
          { permissions: { some: { userId: me.id } } }
        ]
      },
      include: { permissions: { where: { userId: me.id }, select: { id: true } } },
      orderBy: { createdAt: 'asc' }
    })

    // Attach a computed flag for the client to prefer personal page
    return pages.map(p => ({ ...p, mine: (p.permissions?.length ?? 0) > 0 }))
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


