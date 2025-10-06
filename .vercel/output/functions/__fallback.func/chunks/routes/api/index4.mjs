import { d as defineEventHandler, c as createError, b as getMethod, a as getFirestore, e as getNextSequence, r as readBody } from '../../nitro/nitro.mjs';
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

const index = defineEventHandler(async (event) => {
  var _a, _b, _c;
  const me = await getCurrentUser(event);
  if (!me) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  const method = getMethod(event);
  if (method === "GET") {
    const db = getFirestore();
    const existing = await db.collection("homePages").where("accountId", "==", me.accountId).get();
    if (existing.empty) {
      const id = await getNextSequence("homePages");
      await db.collection("homePages").doc(String(id)).set({ id, accountId: me.accountId, name: "Home", layout: { modules: [] }, isDefault: true, createdAt: (/* @__PURE__ */ new Date()).toISOString() });
    }
    const mine = await db.collection("homePagePermissions").where("userId", "==", String(me.id)).get();
    if (mine.empty) {
      const id = await getNextSequence("homePages");
      const name = `My Page #${me.id}`;
      await db.collection("homePages").doc(String(id)).set({ id, accountId: me.accountId, name, layout: { modules: [] }, isDefault: false, createdAt: (/* @__PURE__ */ new Date()).toISOString() });
      const pid = await getNextSequence("homePagePermissions");
      await db.collection("homePagePermissions").doc(String(pid)).set({ id: pid, homePageId: id, userId: String(me.id), canEdit: true, createdAt: (/* @__PURE__ */ new Date()).toISOString() });
    }
    const pageSnap = await db.collection("homePages").where("accountId", "==", me.accountId).get();
    const permSnap = await db.collection("homePagePermissions").where("userId", "==", String(me.id)).get();
    const editableIds = new Set(permSnap.docs.map((d) => d.get("homePageId")));
    const pages = pageSnap.docs.map((d) => d.data()).filter((p) => p.isDefault || editableIds.has(p.id)).sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || ""))).map((p) => ({ ...p, mine: editableIds.has(p.id) }));
    return pages;
  }
  if (method === "POST") {
    const body = await readBody(event);
    const name = ((body == null ? void 0 : body.name) || "").trim();
    if (!name) throw createError({ statusCode: 400, statusMessage: "name is required" });
    const db = getFirestore();
    const countSnap = await db.collection("homePages").where("accountId", "==", me.accountId).get();
    if (countSnap.size >= 4) throw createError({ statusCode: 400, statusMessage: "Page limit reached (4)" });
    if (me.role === "OWNER" || me.role === "ADMIN") {
      if (body.isDefault) {
        const snap = await db.collection("homePages").where("accountId", "==", me.accountId).where("isDefault", "==", true).get();
        for (const d of snap.docs) {
          await d.ref.update({ isDefault: false });
        }
      }
      const id2 = await getNextSequence("homePages");
      const doc2 = { id: id2, accountId: me.accountId, name, layout: (_a = body.layout) != null ? _a : { modules: [] }, isDefault: (_b = body.isDefault) != null ? _b : false, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
      await db.collection("homePages").doc(String(id2)).set(doc2);
      return doc2;
    }
    const id = await getNextSequence("homePages");
    const doc = { id, accountId: me.accountId, name, layout: (_c = body.layout) != null ? _c : { modules: [] }, isDefault: false, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
    await db.collection("homePages").doc(String(id)).set(doc);
    const pid = await getNextSequence("homePagePermissions");
    await db.collection("homePagePermissions").doc(String(pid)).set({ id: pid, homePageId: id, userId: String(me.id), canEdit: true, createdAt: (/* @__PURE__ */ new Date()).toISOString() });
    return doc;
  }
  throw createError({ statusCode: 405, statusMessage: "Method Not Allowed" });
});

export { index as default };
//# sourceMappingURL=index4.mjs.map
