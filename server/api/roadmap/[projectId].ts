import { prisma } from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const { projectId } = getRouterParams(event)
  const projectIdNum = Number(projectId)
  if (!projectId || Number.isNaN(projectIdNum)) {
    throw createError({ statusCode: 400, statusMessage: 'projectId must be a number' })
  }

  const method = getMethod(event)
  if (method === 'GET') {
    return prisma.roadmapEntry.findMany({
      where: { projectId: projectIdNum },
      orderBy: { date: 'asc' }
    })
  }
  if (method === 'POST') {
    const body = await readBody<{ description: string; date: string | Date; userId?: number }>(event)
    if (!body?.description || !body?.date) {
      throw createError({ statusCode: 400, statusMessage: 'description and date are required' })
    }
    const parsedDate = new Date(body.date)
    if (Number.isNaN(parsedDate.getTime())) {
      throw createError({ statusCode: 400, statusMessage: 'date must be a valid date' })
    }
    return prisma.roadmapEntry.create({
      data: {
        description: body.description,
        date: parsedDate,
        userId: body.userId ?? 1,
        projectId: projectIdNum
      }
    })
  }
  if (method === 'PUT') {
    const body = await readBody<{ id: number; description?: string; date?: string | Date }>(event)
    if (!body?.id) throw createError({ statusCode: 400, statusMessage: 'id is required' })
    const data: any = {}
    if (typeof body.description === 'string') data.description = body.description
    if (body.date) {
      const d = new Date(body.date)
      if (Number.isNaN(d.getTime())) {
        throw createError({ statusCode: 400, statusMessage: 'date must be a valid date' })
      }
      data.date = d
    }
    return prisma.roadmapEntry.update({ where: { id: Number(body.id) }, data })
  }
  if (method === 'DELETE') {
    const query = getQuery(event)
    const id = Number(query.id)
    if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })
    await prisma.roadmapEntry.delete({ where: { id } })
    return { ok: true }
  }
  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
})





