import { getFirestore } from '~~/server/utils/firestore'

export default defineNitroPlugin(async () => {
  try {
    const enabled = process.env.SEED_OWNER_EMAIL && process.env.SEED_OWNER_PASSWORD
    if (!enabled) return
    const db = getFirestore()
    const email = String(process.env.SEED_OWNER_EMAIL)
    const id = email
    const snap = await db.collection('users').doc(id).get()
    if (snap.exists && String(process.env.SEED_FORCE || '').toLowerCase() !== 'true') return
    const name = process.env.SEED_OWNER_NAME || 'Owner'
    const usernameEnv = process.env.SEED_OWNER_USERNAME || (email.split('@')[0])
    await db.collection('users').doc(id).set({
      id,
      name,
      email,
      username: usernameEnv,
      accountId: 1,
      role: 'OWNER',
      // passwordHash kept for legacy UI forms but not used by auth
      passwordHash: String(process.env.SEED_OWNER_PASSWORD),
      createdAt: new Date().toISOString()
    }, { merge: true })
    console.log('[seed] OWNER user created via Firestore SEED_* envs')
  } catch (err) {
    console.error('[seed] failed:', err)
  }
})


