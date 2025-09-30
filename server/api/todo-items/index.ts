import { prisma } from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  if (method === 'POST') {
    const body = await readBody<{ todoId: number; content: string; position?: number }>(event)
    if (!body?.todoId || !body?.content) throw createError({ statusCode: 400, statusMessage: 'todoId and content required' })
    return prisma.todoItem.create({ data: { todoId: Number(body.todoId), content: body.content, position: body.position ?? 0 } })
  }
  if (method === 'PUT') {
    const body = await readBody<{ id?: number; content?: string; done?: boolean; position?: number; order?: { id:number; position:number }[] }>(event)
    // Bulk order update
    if (Array.isArray(body?.order)) {
      await prisma.$transaction(body.order.map(it => prisma.todoItem.update({ where: { id: it.id }, data: { position: it.position } })))
      return { ok: true }
    }
    if (!body?.id) throw createError({ statusCode: 400, statusMessage: 'id required' })
    return prisma.todoItem.update({ where: { id: Number(body.id) }, data: { content: body.content, done: body.done, position: body.position } })
  }
  if (method === 'DELETE') {
    const query = getQuery(event)
    const id = Number(query.id)
    if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })
    await prisma.todoItem.delete({ where: { id } })
    return { ok: true }
  }
  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
})


