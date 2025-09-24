import { prisma } from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const { projectId } = getRouterParams(event)
  const projectIdNum = Number(projectId)
  if (!projectId || Number.isNaN(projectIdNum)) {
    throw createError({ statusCode: 400, statusMessage: 'projectId must be a number' })
  }

  const method = getMethod(event)
  if (method === 'GET') {
    return prisma.message.findMany({ where: { projectId: projectIdNum }, orderBy: { createdAt: 'desc' } })
  }
  if (method === 'POST') {
    const body = await readBody<{ title: string; content: string; userId?: number }>(event)
    if (!body?.title || !body?.content) {
      throw createError({ statusCode: 400, statusMessage: 'title and content are required' })
    }
    return prisma.message.create({
      data: { title: body.title, content: body.content, userId: body.userId ?? 1, projectId: projectIdNum }
    })
  }
  if (method === 'PUT') {
    const body = await readBody<{ id: number; title?: string; content?: string }>(event)
    if (!body?.id) throw createError({ statusCode: 400, statusMessage: 'id is required' })
    return prisma.message.update({
      where: { id: body.id },
      data: { title: body.title, content: body.content }
    })
  }
  if (method === 'DELETE') {
    const query = getQuery(event)
    const id = Number(query.id)
    if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })
    await prisma.message.delete({ where: { id } })
    return { ok: true }
  }
  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
})


