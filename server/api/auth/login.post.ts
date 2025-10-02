import { setUserSession } from '~~/server/utils/auth'

type Body = { username: string; password: string }

export default defineEventHandler(async (event) => {
  // Password login disabled; use Google (Firebase) sign-in
  throw createError({ statusCode: 400, statusMessage: 'Password login disabled. Use Google sign-in.' })
})


