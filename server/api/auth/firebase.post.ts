import { setUserSession } from '~~/server/utils/auth'
import { getFirestore, getNextSequence } from '~~/server/utils/firestore'
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

  // Helpful debug in dev without leaking secrets
  if (import.meta.dev) {
    console.log('[Auth] Firebase Admin env present:', {
      projectId,
      clientEmail: Boolean(clientEmail),
      privateKeyLen: privateKey.length
    })
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
      const detail = e?.message || String(e)
      console.error('[Auth] Failed to initialize Firebase Admin SDK:', detail)
      // In dev, include the underlying error to speed up setup
      const statusMessage = import.meta.dev
        ? `Failed to initialize Firebase Admin SDK: ${detail}`
        : 'Failed to initialize Firebase Admin SDK'
      throw createError({ statusCode: 500, statusMessage })
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

  const db = getFirestore()
  const existing = await db.collection('users').where('email', '==', email).limit(1).get()
  let uid: string
  let name = decoded.name || email.split('@')[0]
  let role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'USER' = 'USER'
  if (existing.empty) {
    const totalSnap = await db.collection('users').limit(1).get()
    role = totalSnap.empty ? 'OWNER' : 'USER'
    uid = decoded.uid || email
    await db.collection('users').doc(uid).set({ id: uid, email, name, role, accountId: 1, createdAt: new Date().toISOString() })
  } else {
    const doc = existing.docs[0]
    uid = doc.id
    const data: any = doc.data()
    name = data.name || name
    role = data.role || role
  }

  setUserSession(event, uid)
  return { ok: true, user: { id: uid, name, role } }
})

