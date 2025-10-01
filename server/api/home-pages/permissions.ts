import { getCurrentUser } from '~~/server/utils/auth'
import { getFirestore } from '~~/server/utils/firestore'

type UpsertBody = {
  homePageId: number
  assignments: Array<{ userId: number; canEdit?: boolean; enabled: boolean }>
}

export default defineEventHandler(async (event) => {
  const me = await getCurrentUser(event)
  if (!me) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const method = getMethod(event)

  if (method === 'POST') {
    if (me.role !== 'OWNER' && me.role !== 'ADMIN') throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    const body = await readBody<UpsertBody>(event)
    if (!body?.homePageId) throw createError({ statusCode: 400, statusMessage: 'homePageId required' })
    const db = getFirestore()
    const pageDoc = await db.collection('homePages').doc(String(body.homePageId)).get()
    const page: any = pageDoc.exists ? pageDoc.data() : null
    if (!page || page.accountId !== me.accountId) throw createError({ statusCode: 404, statusMessage: 'Page not found' })

    // Replace permissions according to assignments
    const existing = await db.collection('homePagePermissions').where('homePageId', '==', page.id).get()
    for (const d of existing.docs) { await d.ref.delete() }
    for (const a of body.assignments.filter(a => a.enabled)) {
      await db.collection('homePagePermissions').add({ homePageId: page.id, userId: String(a.userId), canEdit: !!a.canEdit, createdAt: new Date().toISOString() })
    }
    return { ok: true }
  }

  if (method === 'GET') {
    const query = getQuery(event)
    const homePageId = Number(query.homePageId)
    if (!homePageId) throw createError({ statusCode: 400, statusMessage: 'homePageId required' })
    const db = getFirestore()
    const pageDoc = await db.collection('homePages').doc(String(homePageId)).get()
    const page: any = pageDoc.exists ? pageDoc.data() : null
    if (!page || page.accountId !== me.accountId) throw createError({ statusCode: 404, statusMessage: 'Page not found' })
    if (me.role !== 'OWNER' && me.role !== 'ADMIN') throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    const snap = await db.collection('homePagePermissions').where('homePageId', '==', homePageId).orderBy('createdAt', 'asc').get()
    return snap.docs.map(d => d.data())
  }

  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
})


