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

  let user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        username: email,
        name: decoded.name || email.split('@')[0],
        role: 'USER'
      }
    })
  }

  setUserSession(event, user.id)
  return { ok: true, user: { id: user.id, name: user.name, role: user.role } }
})


