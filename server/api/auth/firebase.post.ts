import { setUserSession } from '~~/server/utils/auth'
import { prisma } from '~~/server/utils/prisma'
import admin from 'firebase-admin'

let initialized = false
function ensureAdmin() {
  if (initialized) return
  const config = useRuntimeConfig()
  const projectId = config.fbProjectId
  const clientEmail = config.fbClientEmail
  const privateKeyRaw = config.fbPrivateKey
  const privateKey = (privateKeyRaw || '').replace(/\\n/g, '\n')

  // Basic validation to surface misconfiguration early
  if (!projectId || !clientEmail || !privateKey) {
    console.error('[Auth] Missing Firebase Admin env. Ensure FB_PROJECT_ID, FB_CLIENT_EMAIL, FB_PRIVATE_KEY are set.')
    throw createError({ statusCode: 500, statusMessage: 'Server auth not configured. Missing Firebase Admin credentials.' })
  }

  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey
        })
      })
    } catch (e: any) {
      console.error('[Auth] Failed to initialize Firebase Admin SDK:', e?.message || e)
      throw createError({ statusCode: 500, statusMessage: 'Failed to initialize Firebase Admin SDK' })
    }
  }
  initialized = true
}

export default defineEventHandler(async (event) => {
  ensureAdmin()
  const body = await readBody<{ idToken: string }>(event)
  if (!body?.idToken) throw createError({ statusCode: 400, statusMessage: 'idToken required' })

  let decoded: any
  try {
    decoded = await admin.auth().verifyIdToken(body.idToken)
  } catch (e: any) {
    console.error('[Auth] verifyIdToken failed:', e?.message || e)
    throw createError({ statusCode: 401, statusMessage: 'Invalid or expired Google ID token' })
  }
  const email = decoded.email
  if (!email) throw createError({ statusCode: 400, statusMessage: 'Email required' })

  let user
  try {
    // Determine role for first user
    const totalUsers = await prisma.user.count()
    const newUserRole = totalUsers === 0 ? 'OWNER' : 'USER'

    user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      // Ensure there is an account to attach the user to
      let account = await prisma.account.findFirst()
      if (!account) {
        account = await prisma.account.create({ data: { name: 'Default' } })
      }
      user = await prisma.user.create({
        data: {
          email,
          username: email,
          name: decoded.name || email.split('@')[0],
          role: newUserRole as any,
          accountId: account.id
        }
      })
    }
  } catch (e: any) {
    const code = e?.code || e?.name
    const message = e?.message || String(e)
    console.error('[Auth] Database operation failed:', code, message)
    // Common on Vercel with SQLite: SQLITE_READONLY: attempt to write a readonly database
    throw createError({ statusCode: 500, statusMessage: 'Database error during sign-in. The database may be read-only or unavailable.' })
  }

  setUserSession(event, user.id)
  return { ok: true, user: { id: user.id, name: user.name, role: user.role } }
})


