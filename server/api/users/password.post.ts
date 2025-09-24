import { prisma } from '~~/server/utils/prisma'
import { getCurrentUser } from '~~/server/utils/auth'

type Body = { id: number; password: string }

export default defineEventHandler(async (event) => {
  const me = await getCurrentUser(event)
  if (!me) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const body = await readBody<Body>(event)
  const id = Number(body?.id)
  const password = body?.password ?? ''
  if (!id || !password) throw createError({ statusCode: 400, statusMessage: 'id and password required' })

  const target = await prisma.user.findUnique({ where: { id } })
  if (!target) throw createError({ statusCode: 404, statusMessage: 'User not found' })

  // Permissions
  if (me.role === 'OWNER') {
    // allowed
  } else if (me.role === 'ADMIN') {
    if (target.role === 'OWNER') throw createError({ statusCode: 403, statusMessage: 'Cannot modify OWNER' })
  } else if (me.role === 'MANAGER') {
    const editable = target.managerId === me.id
    if (!editable) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  } else {
    if (me.id !== target.id) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  // Demo: store plaintext in passwordHash
  const updated = await prisma.user.update({ where: { id: target.id }, data: { passwordHash: password } })
  return { ok: true, id: updated.id }
})


