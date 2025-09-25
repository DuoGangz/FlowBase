import { prisma } from '~~/server/utils/prisma'
import { getCurrentUser } from '~~/server/utils/auth'

type UpdateBody = {
  name?: string
  layout?: any
  isDefault?: boolean
}

export default defineEventHandler(async (event) => {
  const me = await getCurrentUser(event)
  if (!me) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const { id } = getRouterParams(event)
  const pageId = Number(id)
  if (!pageId) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

  const method = getMethod(event)

  const page = await prisma.homePage.findUnique({ where: { id: pageId } })
  if (!page || page.accountId !== me.accountId) throw createError({ statusCode: 404, statusMessage: 'Not found' })

  if (method === 'GET') {
    // Ensure access
    if (me.role === 'OWNER' || me.role === 'ADMIN') return page
    const access = await prisma.homePagePermission.findFirst({ where: { homePageId: pageId, userId: me.id } })
    if (!page.isDefault && !access) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    return page
  }

  if (method === 'PUT') {
    // Only OWNER/ADMIN or users with canEdit can update layout/name
    let canEdit = me.role === 'OWNER' || me.role === 'ADMIN'
    if (!canEdit) {
      const perm = await prisma.homePagePermission.findFirst({ where: { homePageId: pageId, userId: me.id, canEdit: true } })
      canEdit = !!perm
    }
    if (!canEdit) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

    const body = await readBody<UpdateBody>(event)
    if (body.isDefault === true) {
      await prisma.homePage.updateMany({ where: { accountId: me.accountId, isDefault: true }, data: { isDefault: false } })
    }
    const updated = await prisma.homePage.update({
      where: { id: pageId },
      data: {
        name: body.name ?? undefined,
        layout: body.layout ?? undefined,
        isDefault: body.isDefault ?? undefined
      }
    })
    return updated
  }

  if (method === 'DELETE') {
    if (me.role !== 'OWNER' && me.role !== 'ADMIN') throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    await prisma.homePagePermission.deleteMany({ where: { homePageId: pageId } })
    await prisma.homePage.delete({ where: { id: pageId } })
    return { ok: true }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
})


