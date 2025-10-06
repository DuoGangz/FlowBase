import { d as defineEventHandler, c as createError, b as getMethod, a as getFirestore, r as readBody, g as getQuery } from '../../_/nitro.mjs';
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

function normalizeDateForLocalDay(date, tzOffsetMinutes) {
  const local = new Date(date.getTime() - (tzOffsetMinutes != null ? tzOffsetMinutes : 0) * 6e4);
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth();
  const d = local.getUTCDate();
  const iso = new Date(Date.UTC(y, m, d, 0, 0, 0, 0)).toISOString();
  return iso;
}
const index = defineEventHandler(async (event) => {
  const me = await getCurrentUser(event);
  if (!me) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  const method = getMethod(event);
  const db = getFirestore();
  if (method === "POST") {
    const body = await readBody(event);
    if (!(body == null ? void 0 : body.userId) || !(body == null ? void 0 : body.action)) {
      throw createError({ statusCode: 400, statusMessage: "userId and action are required" });
    }
    const requestedUserId = String(body.userId);
    if (me.role !== "ADMIN" && requestedUserId !== String(me.id)) {
      throw createError({ statusCode: 403, statusMessage: "Forbidden" });
    }
    const now = body.timestamp ? new Date(body.timestamp) : /* @__PURE__ */ new Date();
    const dayKey = normalizeDateForLocalDay(now, body.tzOffsetMinutes || 0);
    const docId = `${requestedUserId}_${dayKey}`;
    const ref = db.collection("timeEntries").doc(docId);
    const snap = await ref.get();
    if (!snap.exists) {
      await ref.set({ id: docId, userId: requestedUserId, date: dayKey });
    }
    const field = body.action;
    const data = (await ref.get()).data() || { id: docId, userId: requestedUserId, date: dayKey };
    if (data[field]) {
      return { ok: true, entry: data };
    }
    const patch = {};
    patch[field] = now.toISOString();
    await ref.set({ ...data, ...patch }, { merge: true });
    const updated = (await ref.get()).data();
    return { ok: true, entry: updated };
  }
  if (method === "GET") {
    const q = getQuery(event);
    const userId = String(q.userId || me.id);
    if (String(me.id) !== userId && !(me.role === "ADMIN" || me.role === "MANAGER" || me.role === "OWNER" || me.role === "ADMIN_MANAGER")) {
      throw createError({ statusCode: 403, statusMessage: "Forbidden" });
    }
    const startStr = typeof q.start === "string" ? q.start : null;
    const endStr = typeof q.end === "string" ? q.end : null;
    let startIso;
    let endIso;
    if (startStr && endStr) {
      startIso = (/* @__PURE__ */ new Date(startStr + "T00:00:00.000Z")).toISOString();
      endIso = (/* @__PURE__ */ new Date(endStr + "T23:59:59.999Z")).toISOString();
    } else {
      const today = /* @__PURE__ */ new Date();
      const ago = new Date(today);
      ago.setDate(today.getDate() - 30);
      startIso = new Date(Date.UTC(ago.getUTCFullYear(), ago.getUTCMonth(), ago.getUTCDate())).toISOString();
      endIso = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59, 999)).toISOString();
    }
    const snap = await db.collection("timeEntries").where("userId", "==", userId).where("date", ">=", startIso).where("date", "<=", endIso).orderBy("date", "desc").get();
    const items = snap.docs.map((d) => d.data());
    return items;
  }
  throw createError({ statusCode: 405, statusMessage: "Method Not Allowed" });
});

export { index as default };
//# sourceMappingURL=index6.mjs.map
