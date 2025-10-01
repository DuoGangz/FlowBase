import { getFirestore, getNextSequence } from '~~/server/utils/firestore'

export default defineEventHandler(async (event) => {
  const { projectId } = getRouterParams(event)
  const projectIdNum = Number(projectId)
  if (!projectId || Number.isNaN(projectIdNum)) {
    throw createError({ statusCode: 400, statusMessage: 'projectId must be a number' })
  }

  const method = getMethod(event)
  if (method === 'GET') {
    const db = getFirestore()
    const snap = await db.collection('messages').where('projectId', '==', projectIdNum).orderBy('createdAt', 'desc').get()
    return snap.docs.map(d => d.data())
  }
  if (method === 'POST') {
    const body = await readBody<{ title: string; content: string; userId?: number }>(event)
    if (!body?.title || !body?.content) {
      throw createError({ statusCode: 400, statusMessage: 'title and content are required' })
    }
    const db = getFirestore()
    const id = await getNextSequence('messages')
    const doc = { id, title: body.title, content: body.content, userId: body.userId ?? 1, projectId: projectIdNum, createdAt: new Date().toISOString() }
    await db.collection('messages').doc(String(id)).set(doc)
    return doc
  }
  if (method === 'PUT') {
    const body = await readBody<{ id: number; title?: string; content?: string }>(event)
    if (!body?.id) throw createError({ statusCode: 400, statusMessage: 'id is required' })
    const db = getFirestore()
    await db.collection('messages').doc(String(body.id)).update({ title: body.title, content: body.content })
    const snap = await db.collection('messages').doc(String(body.id)).get()
    return snap.data()
  }
  if (method === 'DELETE') {
    const query = getQuery(event)
    const id = Number(query.id)
    if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })
    const db = getFirestore()
    await db.collection('messages').doc(String(id)).delete()
    return { ok: true }
  }
  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
})


