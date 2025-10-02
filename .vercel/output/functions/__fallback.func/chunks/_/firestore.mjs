import { u as useRuntimeConfig, c as createError } from '../nitro/nitro.mjs';
import admin from 'firebase-admin';

let initialized = false;
function ensureFirebaseAdmin() {
  if (initialized) return admin;
  const config = useRuntimeConfig();
  const projectId = config.fbProjectId;
  const clientEmail = config.fbClientEmail;
  const privateKeyRaw = config.fbPrivateKey;
  const privateKey = (privateKeyRaw || "").replace(/\\n/g, "\n");
  const storageBucket = process.env.FB_STORAGE_BUCKET || (projectId ? `${projectId}.appspot.com` : void 0);
  if (!projectId || !clientEmail || !privateKey) {
    throw createError({ statusCode: 500, statusMessage: "Firebase Admin not configured. Set FB_PROJECT_ID, FB_CLIENT_EMAIL, FB_PRIVATE_KEY." });
  }
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      storageBucket
    });
  }
  initialized = true;
  return admin;
}
function getFirebaseBucket() {
  const adm = ensureFirebaseAdmin();
  const bucketName = process.env.FB_STORAGE_BUCKET || `${useRuntimeConfig().fbProjectId}.appspot.com`;
  return adm.storage().bucket(bucketName);
}

function getFirestore() {
  const admin = ensureFirebaseAdmin();
  return admin.firestore();
}
async function getNextSequence(seqName) {
  const db = getFirestore();
  const ref = db.collection("_counters").doc(seqName);
  const res = await db.runTransaction(async (tx) => {
    var _a;
    const snap = await tx.get(ref);
    const current = (snap.exists ? (_a = snap.data()) == null ? void 0 : _a.value : 0) || 0;
    const next = current + 1;
    tx.set(ref, { value: next }, { merge: true });
    return next;
  });
  return res;
}

export { getFirebaseBucket as a, getNextSequence as b, getFirestore as g };
//# sourceMappingURL=firestore.mjs.map
