import admin from 'firebase-admin'

let initialized = false

export function ensureFirebaseAdmin() {
  if (initialized) return admin
  const config = useRuntimeConfig()
  const projectId = config.fbProjectId
  const clientEmail = config.fbClientEmail
  const privateKeyRaw = config.fbPrivateKey
  const privateKey = (privateKeyRaw || '').replace(/\\n/g, '\n')
  const storageBucket = process.env.FB_STORAGE_BUCKET || (projectId ? `${projectId}.appspot.com` : undefined)

  if (!projectId || !clientEmail || !privateKey) {
    throw createError({ statusCode: 500, statusMessage: 'Firebase Admin not configured. Set FB_PROJECT_ID, FB_CLIENT_EMAIL, FB_PRIVATE_KEY.' })
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      storageBucket
    })
  }
  initialized = true
  return admin
}

export function getFirebaseBucket() {
  const adm = ensureFirebaseAdmin()
  const bucketName = process.env.FB_STORAGE_BUCKET || `${useRuntimeConfig().fbProjectId}.appspot.com`
  return adm.storage().bucket(bucketName)
}



