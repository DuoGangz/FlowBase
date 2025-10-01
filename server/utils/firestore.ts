import { ensureFirebaseAdmin } from '~~/server/utils/firebaseAdmin'

export function getFirestore() {
  const admin = ensureFirebaseAdmin()
  return admin.firestore()
}

export async function getNextSequence(seqName: string): Promise<number> {
  const db = getFirestore()
  const ref = db.collection('_counters').doc(seqName)
  const res = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const current = (snap.exists ? (snap.data()?.value as number) : 0) || 0
    const next = current + 1
    tx.set(ref, { value: next }, { merge: true })
    return next
  })
  return res
}


