import { getCurrentUser } from '~~/server/utils/auth'
import { getFirestore } from '~~/server/utils/firestore'

export default defineEventHandler(async (event) => {
  const me = await getCurrentUser(event)
  if (!me) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  if (me.role !== 'OWNER' && me.role !== 'MANAGER') throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const query = getQuery(event)
  const userId = query.userId ? String(query.userId) : undefined
  const status = (query.status as string) || 'all' // 'all' | 'completed' | 'assigned'

  const db = getFirestore()
  let snap = await db.collection('assignments').orderBy('createdAt', 'desc').limit(100).get().catch(async () => {
    return await db.collection('assignments').get()
  })
  let items = snap.docs.map(d => d.data() as any)
  if (status === 'completed') items = items.filter(i => i.completed)
  if (status === 'assigned') items = items.filter(i => !i.completed)
  if (userId) items = items.filter(i => String(i.assignedToId) === userId)
  return items.map(i => ({
    id: i.id,
    title: i.title,
    createdAt: i.createdAt,
    completedAt: i.completedAt,
    completed: !!i.completed,
    assignedTo: { id: i.assignedToId, name: i.assignedToId },
    assignedBy: { id: i.assignedById, name: i.assignedById }
  }))
})


