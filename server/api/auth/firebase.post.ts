import { setUserSession } from '~~/server/utils/auth'
import { prisma } from '~~/server/utils/prisma'
import admin from 'firebase-admin'

let initialized = false
function ensureAdmin() {
  if (initialized) return
  const config = useRuntimeConfig()
  const privateKey = (config.fbPrivateKey || '').replace(/\\n/g, '\n')
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.fbProjectId,
        clientEmail: config.fbClientEmail,
        privateKey
      })
    })
  }
  initialized = true
}

export default defineEventHandler(async (event) => {
  ensureAdmin()
  const body = await readBody<{ idToken: string }>(event)
  if (!body?.idToken) throw createError({ statusCode: 400, statusMessage: 'idToken required' })

  const decoded = await admin.auth().verifyIdToken(body.idToken)
  const email = decoded.email
  if (!email) throw createError({ statusCode: 400, statusMessage: 'Email required' })

  // Determine role for first user
  const totalUsers = await prisma.user.count()
  const newUserRole = totalUsers === 0 ? 'OWNER' : 'USER'

  let user = await prisma.user.findUnique({ where: { email } })
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

  setUserSession(event, user.id)
  return { ok: true, user: { id: user.id, name: user.name, role: user.role } }
})


