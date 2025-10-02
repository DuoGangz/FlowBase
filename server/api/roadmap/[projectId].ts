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
    const snap = await db.collection('roadmapEntries').where('projectId', '==', projectIdNum).orderBy('date', 'asc').get().catch(async () => {
      return await db.collection('roadmapEntries').where('projectId', '==', projectIdNum).get()
    })
    return snap.docs.map(d => d.data())
  }
  if (method === 'POST') {
    const body = await readBody<{ description: string; date: string | Date; userId?: string | number }>(event)
    if (!body?.description || !body?.date) {
      throw createError({ statusCode: 400, statusMessage: 'description and date are required' })
    }
    const parsedDate = new Date(body.date)
    if (Number.isNaN(parsedDate.getTime())) {
      throw createError({ statusCode: 400, statusMessage: 'date must be a valid date' })
    }
    const db = getFirestore()
    const id = await getNextSequence('roadmapEntries')
    const doc = { id, description: body.description, date: parsedDate.toISOString(), userId: String(body.userId ?? '1'), projectId: projectIdNum, createdAt: new Date().toISOString() }
    await db.collection('roadmapEntries').doc(String(id)).set(doc)
    return doc
  }
  if (method === 'PUT') {
    const body = await readBody<{ id: number; description?: string; date?: string | Date }>(event)
    if (!body?.id) throw createError({ statusCode: 400, statusMessage: 'id is required' })
    const db = getFirestore()
    const ref = db.collection('roadmapEntries').doc(String(body.id))
    const snap = await ref.get()
    if (!snap.exists) throw createError({ statusCode: 404, statusMessage: 'Not found' })
    const data: any = {}
    if (typeof body.description === 'string') data.description = body.description
    if (body.date) {
      const d = new Date(body.date)
      if (Number.isNaN(d.getTime())) {
        throw createError({ statusCode: 400, statusMessage: 'date must be a valid date' })
      }
      data.date = d.toISOString()
    }
    await ref.set({ ...(snap.data() as any), ...data, updatedAt: new Date().toISOString() }, { merge: true })
    return (await ref.get()).data()
  }
  if (method === 'DELETE') {
    const query = getQuery(event)
    const id = Number(query.id)
    if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })
    const db = getFirestore()
    await db.collection('roadmapEntries').doc(String(id)).delete()
    return { ok: true }
  }
  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
})












