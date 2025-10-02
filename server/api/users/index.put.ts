import { getCurrentUser } from '~~/server/utils/auth'
import { getFirestore } from '~~/server/utils/firestore'

type Body = { id: number; role?: 'OWNER' | 'ADMIN' | 'ADMIN_MANAGER' | 'MANAGER' | 'USER'; managerId?: number | null; name?: string; email?: string; username?: string }

export default defineEventHandler(async (event) => {
  const me = await getCurrentUser(event)
  if (!me) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const body = await readBody<Body>(event)
  if (!body?.id) throw createError({ statusCode: 400, statusMessage: 'id required' })

  const db = getFirestore()
  const ref = db.collection('users').doc(String(body.id))
  const snap = await ref.get()
  if (!snap.exists) throw createError({ statusCode: 404, statusMessage: 'User not found' })
  const target: any = { id: snap.id, ...(snap.data() as any) }

  if (me.role === 'OWNER') {
    const updated = { ...target, role: body.role ?? target.role, managerId: body.managerId ?? target.managerId, name: body.name ?? target.name, email: body.email ?? target.email, username: body.username ?? target.username }
    await ref.set(updated, { merge: true })
    return updated
  }

  if (me.role === 'ADMIN') {
    if (body.role === 'OWNER' || body.role === 'ADMIN_MANAGER') throw createError({ statusCode: 403, statusMessage: 'Cannot assign OWNER/ADMIN_MANAGER' })
    const updated = { ...target, role: body.role ?? target.role, managerId: body.managerId ?? target.managerId, name: body.name ?? target.name, email: body.email ?? target.email, username: body.username ?? target.username }
    await ref.set(updated, { merge: true })
    return updated
  }

  if (me.role === 'MANAGER' || me.role === 'ADMIN_MANAGER') {
    // Managers can edit only current subordinates
    const isEditableTarget = target.managerId === me.id
    if (!isEditableTarget) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    // Managers cannot promote to OWNER or ADMIN or ADMIN_MANAGER
    if (body.role === 'ADMIN' || body.role === 'OWNER' || body.role === 'ADMIN_MANAGER') throw createError({ statusCode: 403, statusMessage: 'Cannot assign ADMIN/OWNER/ADMIN_MANAGER' })
    // Managers cannot change manager assignment at all
    if (body.managerId !== undefined) {
      throw createError({ statusCode: 403, statusMessage: 'Managers cannot change manager assignment' })
    }
    const updated = { ...target, role: body.role ?? target.role, name: body.name ?? target.name, email: body.email ?? target.email, username: body.username ?? target.username }
    await ref.set(updated, { merge: true })
    return updated
  }

  // USER cannot update others
  if (me.id !== target.id) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  const updated = { ...target, name: body.name ?? target.name, email: body.email ?? target.email, username: body.username ?? target.username }
  await ref.set(updated, { merge: true })
  return updated
})


