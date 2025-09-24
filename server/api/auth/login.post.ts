import { prisma } from '~~/server/utils/prisma'
import { setUserSession } from '~~/server/utils/auth'

type Body = { username: string; password: string }

export default defineEventHandler(async (event) => {
  const body = await readBody<Body>(event)
  if (!body?.username || !body?.password) throw createError({ statusCode: 400, statusMessage: 'username and password required' })
  const user = await prisma.user.findUnique({ where: { username: body.username } })
  if (!user || !user.passwordHash) throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  // plaintext demo only: do NOT use in production
  if (user.passwordHash !== body.password) throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  setUserSession(event, user.id)
  return { ok: true, user: { id: user.id, name: user.name, role: user.role } }
})


