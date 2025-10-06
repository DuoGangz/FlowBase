import { d as defineEventHandler, c as createError, b as getMethod, a as getFirestore, g as getQuery, r as readBody, e as getNextSequence } from '../../nitro/nitro.mjs';
import { g as getCurrentUser } from '../../_/auth.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'firebase-admin';

const index = defineEventHandler(async (event) => {
  var _a;
  const me = await getCurrentUser(event);
  if (!me) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  const method = getMethod(event);
  const db = getFirestore();
  if (method === "GET") {
    const query = getQuery(event);
    const view = query.view || "me";
    const userId = query.userId ? String(query.userId) : void 0;
    const isMgr = me.role === "OWNER" || me.role === "MANAGER" || me.role === "ADMIN_MANAGER" || me.role === "ADMIN";
    if ((view === "all" || view === "byUser" || view === "authored") && !isMgr) {
      throw createError({ statusCode: 403, statusMessage: "Forbidden" });
    }
    let snap;
    if (view === "me") {
      snap = await db.collection("assignments").where("assignedToId", "==", String(me.id)).get();
    } else if (view === "byUser" && userId) {
      snap = await db.collection("assignments").where("assignedToId", "==", userId).get();
    } else if (view === "authored") {
      snap = await db.collection("assignments").where("assignedById", "==", String(me.id)).get();
    } else {
      snap = await db.collection("assignments").get();
    }
    const list = snap.docs.map((d) => d.data()).sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    return list;
  }
  if (method === "POST") {
    const isMgr = me.role === "OWNER" || me.role === "MANAGER" || me.role === "ADMIN_MANAGER" || me.role === "ADMIN";
    if (!isMgr) throw createError({ statusCode: 403, statusMessage: "Forbidden" });
    const body = await readBody(event);
    if (!(body == null ? void 0 : body.title) || !(body == null ? void 0 : body.assignedToId)) throw createError({ statusCode: 400, statusMessage: "title and assignedToId required" });
    const id = await getNextSequence("assignments");
    const doc = {
      id,
      title: body.title,
      details: (_a = body.details) != null ? _a : null,
      assignedToId: String(body.assignedToId),
      assignedById: String(me.id),
      completed: false,
      dueDate: body.dueDate ? new Date(body.dueDate).toISOString() : null,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await db.collection("assignments").doc(String(id)).set(doc);
    return doc;
  }
  if (method === "PUT") {
    const body = await readBody(event);
    if (!(body == null ? void 0 : body.id)) throw createError({ statusCode: 400, statusMessage: "id required" });
    const ref = db.collection("assignments").doc(String(body.id));
    const snap = await ref.get();
    if (!snap.exists) throw createError({ statusCode: 404, statusMessage: "Not found" });
    const a = snap.data();
    const canComplete = String(me.id) === String(a.assignedToId) || me.role === "OWNER" || me.role === "MANAGER" || me.role === "ADMIN";
    if (!canComplete) throw createError({ statusCode: 403, statusMessage: "Forbidden" });
    const completed = body.completed === true;
    await ref.set({ ...a, completed, completedAt: completed ? (/* @__PURE__ */ new Date()).toISOString() : null }, { merge: true });
    return (await ref.get()).data();
  }
  throw createError({ statusCode: 405, statusMessage: "Method Not Allowed" });
});

export { index as default };
//# sourceMappingURL=index2.mjs.map
