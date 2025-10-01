import { getFirestore, getNextSequence } from '~~/server/utils/firestore'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  if (method === 'POST') {
    const body = await readBody<{ todoItemId: number; content: string; position?: number }>(event)
    if (!body?.todoItemId || !body?.content) {
      throw createError({ statusCode: 400, statusMessage: 'todoItemId and content required' })
    }
    const db = getFirestore()
    const id = await getNextSequence('todoSubItems')
    const doc = { id, todoItemId: Number(body.todoItemId), content: body.content, position: body.position ?? 0, createdAt: new Date().toISOString() }
    await db.collection('todoSubItems').doc(String(id)).set(doc)
    return doc
  }

  if (method === 'PUT') {
    const body = await readBody<{ id?: number; content?: string; done?: boolean; position?: number; order?: { id:number; position:number }[] }>(event)
    const db = getFirestore()
    if (Array.isArray(body?.order)) {
      await Promise.all(body.order.map(it => db.collection('todoSubItems').doc(String(it.id)).update({ position: it.position })))
      return { ok: true }
    }
    if (!body?.id) throw createError({ statusCode: 400, statusMessage: 'id required' })
    await db.collection('todoSubItems').doc(String(body.id)).update({ content: body.content, done: body.done, position: body.position })
    const snap = await db.collection('todoSubItems').doc(String(body.id)).get()
    return snap.data()
  }

  if (method === 'DELETE') {
    const query = getQuery(event)
    const id = Number(query.id)
    if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })
    const db = getFirestore()
    await db.collection('todoSubItems').doc(String(id)).delete()
    return { ok: true }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
})


