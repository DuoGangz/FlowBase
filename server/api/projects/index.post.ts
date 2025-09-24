import { prisma } from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name: string; slug: string; accountId?: number }>(event)
  if (!body?.name || !body?.slug) {
    throw createError({ statusCode: 400, statusMessage: 'name and slug are required' })
  }
  const project = await prisma.project.create({
    data: {
      name: body.name,
      slug: body.slug,
      accountId: body.accountId ?? 1
    }
  })
  return project
})


