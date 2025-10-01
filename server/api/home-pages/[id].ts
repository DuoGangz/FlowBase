import { getCurrentUser } from '~~/server/utils/auth'
import { getFirestore } from '~~/server/utils/firestore'

type UpdateBody = {
  name?: string
  layout?: any
  isDefault?: boolean
}

export default defineEventHandler(async (event) => {
  const me = await getCurrentUser(event)
  if (!me) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const { id } = getRouterParams(event)
  const pageId = Number(id)
  if (!pageId) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

  const method = getMethod(event)

  const db = getFirestore()
  const pageDoc = await db.collection('homePages').doc(String(pageId)).get()
  const page: any = pageDoc.exists ? pageDoc.data() : null
  if (!page || page.accountId !== me.accountId) throw createError({ statusCode: 404, statusMessage: 'Not found' })

  if (method === 'GET') {
    // Ensure access
    if (me.role === 'OWNER' || me.role === 'ADMIN') return page
    const accessSnap = await db.collection('homePagePermissions').where('homePageId', '==', pageId).where('userId', '==', String(me.id)).get()
    const access = !accessSnap.empty
    if (!page.isDefault && !access) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    return page
  }

  if (method === 'PUT') {
    // Only OWNER/ADMIN or users with canEdit can update layout/name
    let canEdit = me.role === 'OWNER' || me.role === 'ADMIN'
    if (!canEdit) {
      const permSnap = await db.collection('homePagePermissions').where('homePageId', '==', pageId).where('userId', '==', String(me.id)).where('canEdit', '==', true).get()
      canEdit = !permSnap.empty
    }
    if (!canEdit) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

    const body = await readBody<UpdateBody>(event)
    if (body.isDefault === true) {
      const snap = await db.collection('homePages').where('accountId', '==', me.accountId).where('isDefault', '==', true).get()
      for (const d of snap.docs) { await d.ref.update({ isDefault: false }) }
    }
    const update: any = {}
    if (typeof body.name !== 'undefined') update.name = body.name
    if (typeof body.layout !== 'undefined') update.layout = body.layout
    if (typeof body.isDefault !== 'undefined') update.isDefault = body.isDefault
    await db.collection('homePages').doc(String(pageId)).update(update)
    const newDoc = await db.collection('homePages').doc(String(pageId)).get()
    return newDoc.data()
  }

  if (method === 'DELETE') {
    if (me.role !== 'OWNER' && me.role !== 'ADMIN') throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    const permSnap = await db.collection('homePagePermissions').where('homePageId', '==', pageId).get()
    for (const d of permSnap.docs) { await d.ref.delete() }
    await db.collection('homePages').doc(String(pageId)).delete()
    return { ok: true }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
})


