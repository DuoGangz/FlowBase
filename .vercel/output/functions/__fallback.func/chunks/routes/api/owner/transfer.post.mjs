import { d as defineEventHandler, c as createError, r as readBody, a as getFirestore } from '../../../_/nitro.mjs';
import { g as getCurrentUser } from '../../../_/auth.mjs';
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

const transfer_post = defineEventHandler(async (event) => {
  const me = await getCurrentUser(event);
  if (!me) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  if (me.role !== "OWNER") throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  const body = await readBody(event);
  const targetId = String((body == null ? void 0 : body.targetUserId) || "");
  if (!targetId) throw createError({ statusCode: 400, statusMessage: "targetUserId required" });
  if (String(targetId) === String(me.id)) throw createError({ statusCode: 400, statusMessage: "Already owner" });
  const db = getFirestore();
  const targetSnap = await db.collection("users").doc(targetId).get();
  if (!targetSnap.exists) throw createError({ statusCode: 404, statusMessage: "Target user not found" });
  await db.collection("users").doc(String(me.id)).set({ role: "ADMIN" }, { merge: true });
  await db.collection("users").doc(targetId).set({ role: "OWNER" }, { merge: true });
  return { ok: true };
});

export { transfer_post as default };
//# sourceMappingURL=transfer.post.mjs.map
