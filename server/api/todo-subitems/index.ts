import { prisma } from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  if (method === 'POST') {
    const body = await readBody<{ todoItemId: number; content: string }>(event)
    if (!body?.todoItemId || !body?.content) {
      throw createError({ statusCode: 400, statusMessage: 'todoItemId and content required' })
    }
    return prisma.todoSubItem.create({ data: { todoItemId: Number(body.todoItemId), content: body.content } })
  }

  if (method === 'PUT') {
    const body = await readBody<{ id: number; content?: string; done?: boolean }>(event)
    if (!body?.id) throw createError({ statusCode: 400, statusMessage: 'id required' })
    return prisma.todoSubItem.update({ where: { id: Number(body.id) }, data: { content: body.content, done: body.done } })
  }

  if (method === 'DELETE') {
    const query = getQuery(event)
    const id = Number(query.id)
    if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })
    await prisma.todoSubItem.delete({ where: { id } })
    return { ok: true }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
})


