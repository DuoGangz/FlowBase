import { d as defineEventHandler, c as createError, r as readBody, a as getFirestore } from '../../nitro/nitro.mjs';
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

const index_put = defineEventHandler(async (event) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q;
  const me = await getCurrentUser(event);
  if (!me) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  const body = await readBody(event);
  if (!(body == null ? void 0 : body.id)) throw createError({ statusCode: 400, statusMessage: "id required" });
  const db = getFirestore();
  const ref = db.collection("users").doc(String(body.id));
  const snap = await ref.get();
  if (!snap.exists) throw createError({ statusCode: 404, statusMessage: "User not found" });
  const target = { id: snap.id, ...snap.data() };
  if (me.role === "OWNER") {
    const updated2 = { ...target, role: (_a = body.role) != null ? _a : target.role, managerId: (_b = body.managerId) != null ? _b : target.managerId, name: (_c = body.name) != null ? _c : target.name, email: (_d = body.email) != null ? _d : target.email, username: (_e = body.username) != null ? _e : target.username };
    await ref.set(updated2, { merge: true });
    return updated2;
  }
  if (me.role === "ADMIN") {
    if (body.role === "OWNER" || body.role === "ADMIN_MANAGER") throw createError({ statusCode: 403, statusMessage: "Cannot assign OWNER/ADMIN_MANAGER" });
    const updated2 = { ...target, role: (_f = body.role) != null ? _f : target.role, managerId: (_g = body.managerId) != null ? _g : target.managerId, name: (_h = body.name) != null ? _h : target.name, email: (_i = body.email) != null ? _i : target.email, username: (_j = body.username) != null ? _j : target.username };
    await ref.set(updated2, { merge: true });
    return updated2;
  }
  if (me.role === "MANAGER" || me.role === "ADMIN_MANAGER") {
    const isEditableTarget = target.managerId === me.id;
    if (!isEditableTarget) throw createError({ statusCode: 403, statusMessage: "Forbidden" });
    if (body.role === "ADMIN" || body.role === "OWNER" || body.role === "ADMIN_MANAGER") throw createError({ statusCode: 403, statusMessage: "Cannot assign ADMIN/OWNER/ADMIN_MANAGER" });
    if (body.managerId !== void 0) {
      throw createError({ statusCode: 403, statusMessage: "Managers cannot change manager assignment" });
    }
    const updated2 = { ...target, role: (_k = body.role) != null ? _k : target.role, name: (_l = body.name) != null ? _l : target.name, email: (_m = body.email) != null ? _m : target.email, username: (_n = body.username) != null ? _n : target.username };
    await ref.set(updated2, { merge: true });
    return updated2;
  }
  if (me.id !== target.id) throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  const updated = { ...target, name: (_o = body.name) != null ? _o : target.name, email: (_p = body.email) != null ? _p : target.email, username: (_q = body.username) != null ? _q : target.username };
  await ref.set(updated, { merge: true });
  return updated;
});

export { index_put as default };
//# sourceMappingURL=index.put.mjs.map
