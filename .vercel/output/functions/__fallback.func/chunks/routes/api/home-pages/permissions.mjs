import { d as defineEventHandler, c as createError, a as getMethod, r as readBody, g as getQuery } from '../../../nitro/nitro.mjs';
import { g as getCurrentUser } from '../../../_/auth.mjs';
import { g as getFirestore } from '../../../_/firestore.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'firebase-admin';

const permissions = defineEventHandler(async (event) => {
  const me = await getCurrentUser(event);
  if (!me) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  const method = getMethod(event);
  if (method === "POST") {
    if (me.role !== "OWNER" && me.role !== "ADMIN") throw createError({ statusCode: 403, statusMessage: "Forbidden" });
    const body = await readBody(event);
    if (!(body == null ? void 0 : body.homePageId)) throw createError({ statusCode: 400, statusMessage: "homePageId required" });
    const db = getFirestore();
    const pageDoc = await db.collection("homePages").doc(String(body.homePageId)).get();
    const page = pageDoc.exists ? pageDoc.data() : null;
    if (!page || page.accountId !== me.accountId) throw createError({ statusCode: 404, statusMessage: "Page not found" });
    const existing = await db.collection("homePagePermissions").where("homePageId", "==", page.id).get();
    for (const d of existing.docs) {
      await d.ref.delete();
    }
    for (const a of body.assignments.filter((a2) => a2.enabled)) {
      await db.collection("homePagePermissions").add({ homePageId: page.id, userId: String(a.userId), canEdit: !!a.canEdit, createdAt: (/* @__PURE__ */ new Date()).toISOString() });
    }
    return { ok: true };
  }
  if (method === "GET") {
    const query = getQuery(event);
    const homePageId = Number(query.homePageId);
    if (!homePageId) throw createError({ statusCode: 400, statusMessage: "homePageId required" });
    const db = getFirestore();
    const pageDoc = await db.collection("homePages").doc(String(homePageId)).get();
    const page = pageDoc.exists ? pageDoc.data() : null;
    if (!page || page.accountId !== me.accountId) throw createError({ statusCode: 404, statusMessage: "Page not found" });
    if (me.role !== "OWNER" && me.role !== "ADMIN") throw createError({ statusCode: 403, statusMessage: "Forbidden" });
    const snap = await db.collection("homePagePermissions").where("homePageId", "==", homePageId).orderBy("createdAt", "asc").get();
    return snap.docs.map((d) => d.data());
  }
  throw createError({ statusCode: 405, statusMessage: "Method Not Allowed" });
});

export { permissions as default };
//# sourceMappingURL=permissions.mjs.map
