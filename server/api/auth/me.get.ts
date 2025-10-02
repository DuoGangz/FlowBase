import { getCurrentUser } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const me = await getCurrentUser(event)
  if (!me) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  return { id: me.id, name: me.name, email: me.email, role: me.role }
})


