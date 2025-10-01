import { getFirestore, getNextSequence } from '~~/server/utils/firestore'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name: string; slug: string; accountId?: number }>(event)
  if (!body?.name || !body?.slug) {
    throw createError({ statusCode: 400, statusMessage: 'name and slug are required' })
  }
  const db = getFirestore()
  const id = await getNextSequence('projects')
  const now = new Date()
  await db.collection('projects').doc(String(id)).set({
    id,
    name: body.name,
    slug: body.slug,
    accountId: body.accountId ?? 1,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  })
  return { id, name: body.name, slug: body.slug, accountId: body.accountId ?? 1 }
})


