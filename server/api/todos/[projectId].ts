import { prisma } from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const { projectId } = getRouterParams(event)
  const projectIdNum = Number(projectId)
  if (!projectId || Number.isNaN(projectIdNum)) {
    throw createError({ statusCode: 400, statusMessage: 'projectId must be a number' })
  }

  const method = getMethod(event)
  if (method === 'GET') {
    return prisma.todo.findMany({
      where: { projectId: projectIdNum },
      include: { items: { include: { subItems: true } } },
      orderBy: { createdAt: 'desc' }
    })
  }
  if (method === 'POST') {
    const body = await readBody<{ title: string; userId?: number }>(event)
    if (!body?.title) throw createError({ statusCode: 400, statusMessage: 'title is required' })
    return prisma.todo.create({ data: { title: body.title, userId: body.userId ?? 1, projectId: projectIdNum } })
  }
  if (method === 'PUT') {
    const body = await readBody<{ id: number; title?: string }>(event)
    if (!body?.id) throw createError({ statusCode: 400, statusMessage: 'id is required' })
    return prisma.todo.update({ where: { id: body.id }, data: { title: body.title } })
  }
  if (method === 'DELETE') {
    const query = getQuery(event)
    const id = Number(query.id)
    if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })
    await prisma.todo.delete({ where: { id } })
    return { ok: true }
  }
  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
})


