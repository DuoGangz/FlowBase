import { getCurrentUser } from '~~/server/utils/auth'

type Body = { id: number; password: string }

export default defineEventHandler(async (event) => {
  // Password login is disabled in this app; use Google Auth.
  // Keeping this route to avoid client errors if accidentally called.
  const me = await getCurrentUser(event)
  if (!me) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  throw createError({ statusCode: 400, statusMessage: 'Password login disabled. Use Google sign-in.' })
})


