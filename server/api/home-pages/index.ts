import { getCurrentUser } from '~~/server/utils/auth'
import { getFirestore, getNextSequence } from '~~/server/utils/firestore'

type CreateBody = {
  name: string
  layout?: any
  isDefault?: boolean
}

export default defineEventHandler(async (event) => {
  const me = await getCurrentUser(event)
  if (!me) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const method = getMethod(event)

  if (method === 'GET') {
    const db = getFirestore()
    // Ensure default exists
    const existing = await db.collection('homePages').where('accountId', '==', me.accountId).get()
    if (existing.empty) {
      const id = await getNextSequence('homePages')
      await db.collection('homePages').doc(String(id)).set({ id, accountId: me.accountId, name: 'Home', layout: { modules: [] }, isDefault: true, createdAt: new Date().toISOString() })
    }
    // Ensure personal exists
    const mine = await db.collection('homePagePermissions').where('userId', '==', String(me.id)).get()
    if (mine.empty) {
      const id = await getNextSequence('homePages')
      const name = `My Page #${me.id}`
      await db.collection('homePages').doc(String(id)).set({ id, accountId: me.accountId, name, layout: { modules: [] }, isDefault: false, createdAt: new Date().toISOString() })
      const pid = await getNextSequence('homePagePermissions')
      await db.collection('homePagePermissions').doc(String(pid)).set({ id: pid, homePageId: id, userId: String(me.id), canEdit: true, createdAt: new Date().toISOString() })
    }

    // Fetch visible pages
    const pageSnap = await db.collection('homePages').where('accountId', '==', me.accountId).get()
    const permSnap = await db.collection('homePagePermissions').where('userId', '==', String(me.id)).get()
    const editableIds = new Set(permSnap.docs.map(d => d.get('homePageId')))
    const pages = pageSnap.docs
      .map(d => d.data())
      .filter((p: any) => p.isDefault || editableIds.has(p.id))
      .sort((a: any, b: any) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')))
      .map((p: any) => ({ ...p, mine: editableIds.has(p.id) }))
    return pages
  }

  if (method === 'POST') {
    const body = await readBody<CreateBody>(event)
    const name = (body?.name || '').trim()
    if (!name) throw createError({ statusCode: 400, statusMessage: 'name is required' })

    // Limit to max 4 pages per account
    const db = getFirestore()
    const countSnap = await db.collection('homePages').where('accountId', '==', me.accountId).get()
    if (countSnap.size >= 4) throw createError({ statusCode: 400, statusMessage: 'Page limit reached (4)' })

    // OWNER/ADMIN: same behavior as before (can set default)
    if (me.role === 'OWNER' || me.role === 'ADMIN') {
      if (body.isDefault) {
        const snap = await db.collection('homePages').where('accountId', '==', me.accountId).where('isDefault', '==', true).get()
        for (const d of snap.docs) { await d.ref.update({ isDefault: false }) }
      }
      const id = await getNextSequence('homePages')
      const doc = { id, accountId: me.accountId, name, layout: body.layout ?? { modules: [] }, isDefault: body.isDefault ?? false, createdAt: new Date().toISOString() }
      await db.collection('homePages').doc(String(id)).set(doc)
      return doc
    }

    // Non-admin users: allow creating a personal page they can edit (not default)
    const id = await getNextSequence('homePages')
    const doc = { id, accountId: me.accountId, name, layout: body.layout ?? { modules: [] }, isDefault: false, createdAt: new Date().toISOString() }
    await db.collection('homePages').doc(String(id)).set(doc)
    const pid = await getNextSequence('homePagePermissions')
    await db.collection('homePagePermissions').doc(String(pid)).set({ id: pid, homePageId: id, userId: String(me.id), canEdit: true, createdAt: new Date().toISOString() })
    return doc
  }

  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
})


