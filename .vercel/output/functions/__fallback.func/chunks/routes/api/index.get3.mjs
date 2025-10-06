import { d as defineEventHandler, c as createError, a as getFirestore } from '../../nitro/nitro.mjs';
import { g as getCurrentUser } from '../../_/auth.mjs';
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
import '@fastify/busboy';
import 'zlib';
import 'jsonwebtoken';
import 'node-forge';
import 'crypto';
import 'jwks-rsa';
import '@firebase/database-compat/standalone';
import '@google-cloud/firestore';
import 'farmhash-modern';
import '@google-cloud/firestore/build/src/path';

const index_get = defineEventHandler(async (event) => {
  const me = await getCurrentUser(event);
  if (!me) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  const db = getFirestore();
  const isMgr = me.role === "OWNER" || me.role === "ADMIN" || me.role === "MANAGER" || me.role === "ADMIN_MANAGER";
  if (isMgr) {
    const snap = await db.collection("users").get();
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    return list;
  }
  const meSnap = await db.collection("users").doc(String(me.id)).get();
  return meSnap.exists ? [{ id: meSnap.id, ...meSnap.data() }] : [];
});

export { index_get as default };
//# sourceMappingURL=index.get3.mjs.map
