import { d as defineEventHandler, r as readBody, c as createError, f as admin, a as getFirestore, h as useRuntimeConfig } from '../../../_/nitro.mjs';
import { s as setUserSession } from '../../../_/auth.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'fs';
import 'url';
import 'os';
import 'path';
import 'http';
import 'https';
import 'http2';
import 'events';
import 'node:stream';
import 'node:util';
import 'zlib';
import 'jsonwebtoken';
import 'node-forge';
import 'crypto';
import 'jwks-rsa';
import '@firebase/database-compat/standalone';
import '@google-cloud/firestore';
import 'farmhash-modern';
import '@google-cloud/firestore/build/src/path';

let initialized = false;
function ensureAdmin() {
  if (initialized) return;
  const config = useRuntimeConfig();
  const projectId = config.fbProjectId;
  const clientEmail = config.fbClientEmail;
  const privateKeyRaw = config.fbPrivateKey;
  const privateKey = (privateKeyRaw || "").replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    console.error("[Auth] Missing Firebase Admin env. Ensure FB_PROJECT_ID, FB_CLIENT_EMAIL, FB_PRIVATE_KEY are set.");
    throw createError({ statusCode: 500, statusMessage: "Server auth not configured. Missing Firebase Admin credentials." });
  }
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey
        })
      });
    } catch (e) {
      const detail = (e == null ? void 0 : e.message) || String(e);
      console.error("[Auth] Failed to initialize Firebase Admin SDK:", detail);
      const statusMessage = "Failed to initialize Firebase Admin SDK";
      throw createError({ statusCode: 500, statusMessage });
    }
  }
  initialized = true;
}
const firebase_post = defineEventHandler(async (event) => {
  ensureAdmin();
  const body = await readBody(event);
  if (!(body == null ? void 0 : body.idToken)) throw createError({ statusCode: 400, statusMessage: "idToken required" });
  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(body.idToken);
  } catch (e) {
    console.error("[Auth] verifyIdToken failed:", (e == null ? void 0 : e.message) || e);
    throw createError({ statusCode: 401, statusMessage: "Invalid or expired Google ID token" });
  }
  const email = decoded.email;
  if (!email) throw createError({ statusCode: 400, statusMessage: "Email required" });
  const db = getFirestore();
  const existing = await db.collection("users").where("email", "==", email).limit(1).get();
  let uid;
  let name = decoded.name || email.split("@")[0];
  let role = "USER";
  if (existing.empty) {
    const totalSnap = await db.collection("users").limit(1).get();
    role = totalSnap.empty ? "OWNER" : "USER";
    uid = decoded.uid || email;
    await db.collection("users").doc(uid).set({ id: uid, email, name, role, accountId: 1, createdAt: (/* @__PURE__ */ new Date()).toISOString() });
  } else {
    const doc = existing.docs[0];
    uid = doc.id;
    const data = doc.data();
    name = data.name || name;
    role = data.role || role;
  }
  setUserSession(event, uid);
  return { ok: true, user: { id: uid, name, role } };
});

export { firebase_post as default };
//# sourceMappingURL=firebase.post.mjs.map
