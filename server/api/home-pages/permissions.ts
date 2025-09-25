import { prisma } from '~~/server/utils/prisma'
import { getCurrentUser } from '~~/server/utils/auth'

type UpsertBody = {
  homePageId: number
  assignments: Array<{ userId: number; canEdit?: boolean; enabled: boolean }>
}

export default defineEventHandler(async (event) => {
  const me = await getCurrentUser(event)
  if (!me) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const method = getMethod(event)

  if (method === 'POST') {
    if (me.role !== 'OWNER' && me.role !== 'ADMIN') throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    const body = await readBody<UpsertBody>(event)
    if (!body?.homePageId) throw createError({ statusCode: 400, statusMessage: 'homePageId required' })
    const page = await prisma.homePage.findUnique({ where: { id: Number(body.homePageId) } })
    if (!page || page.accountId !== me.accountId) throw createError({ statusCode: 404, statusMessage: 'Page not found' })

    // Replace permissions according to assignments
    await prisma.homePagePermission.deleteMany({ where: { homePageId: page.id } })
    const toCreate = body.assignments
      .filter(a => a.enabled)
      .map(a => ({ homePageId: page.id, userId: a.userId, canEdit: !!a.canEdit }))
    if (toCreate.length > 0) {
      await prisma.homePagePermission.createMany({ data: toCreate, skipDuplicates: true })
    }
    return { ok: true }
  }

  if (method === 'GET') {
    const query = getQuery(event)
    const homePageId = Number(query.homePageId)
    if (!homePageId) throw createError({ statusCode: 400, statusMessage: 'homePageId required' })
    const page = await prisma.homePage.findUnique({ where: { id: homePageId } })
    if (!page || page.accountId !== me.accountId) throw createError({ statusCode: 404, statusMessage: 'Page not found' })
    if (me.role !== 'OWNER' && me.role !== 'ADMIN') throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    const perms = await prisma.homePagePermission.findMany({ where: { homePageId }, orderBy: { createdAt: 'asc' } })
    return perms
  }

  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
})


