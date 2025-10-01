import { getFirestore } from '~~/server/utils/firestore'

export default defineEventHandler(async () => {
  const db = getFirestore()
  const snap = await db.collection('projects').orderBy('createdAt', 'desc').get()
  return snap.docs.map(d => ({ id: Number(d.get('id')), name: d.get('name'), slug: d.get('slug') }))
})


