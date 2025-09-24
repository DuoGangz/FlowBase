import { prisma } from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  if (method === 'POST') {
    const body = await readBody<{ todoId: number; content: string }>(event)
    if (!body?.todoId || !body?.content) throw createError({ statusCode: 400, statusMessage: 'todoId and content required' })
    return prisma.todoItem.create({ data: { todoId: Number(body.todoId), content: body.content } })
  }
  if (method === 'PUT') {
    const body = await readBody<{ id: number; content?: string; done?: boolean }>(event)
    if (!body?.id) throw createError({ statusCode: 400, statusMessage: 'id required' })
    return prisma.todoItem.update({ where: { id: Number(body.id) }, data: { content: body.content, done: body.done } })
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


