import { d as defineEventHandler, a as getMethod, r as readBody, c as createError, g as getQuery } from '../../nitro/nitro.mjs';
import { g as getFirestore, b as getNextSequence } from '../../_/firestore.mjs';
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
  const method = getMethod(event);
  if (method === "POST") {
    const body = await readBody(event);
    if (!(body == null ? void 0 : body.todoId) || !(body == null ? void 0 : body.content)) throw createError({ statusCode: 400, statusMessage: "todoId and content required" });
    const db = getFirestore();
    const id = await getNextSequence("todoItems");
    const doc = { id, todoId: Number(body.todoId), content: body.content, position: (_a = body.position) != null ? _a : 0, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
    await db.collection("todoItems").doc(String(id)).set(doc);
    return doc;
  }
  if (method === "PUT") {
    const body = await readBody(event);
    const db = getFirestore();
    if (Array.isArray(body == null ? void 0 : body.order)) {
      await Promise.all(body.order.map((it) => db.collection("todoItems").doc(String(it.id)).update({ position: it.position })));
      return { ok: true };
    }
    if (!(body == null ? void 0 : body.id)) throw createError({ statusCode: 400, statusMessage: "id required" });
    await db.collection("todoItems").doc(String(body.id)).update({ content: body.content, done: body.done, position: body.position });
    const snap = await db.collection("todoItems").doc(String(body.id)).get();
    return snap.data();
  }
  if (method === "DELETE") {
    const query = getQuery(event);
    const id = Number(query.id);
    if (!id) throw createError({ statusCode: 400, statusMessage: "id required" });
    const db = getFirestore();
    const subs = await db.collection("todoSubItems").where("todoItemId", "==", id).get();
    for (const s of subs.docs) {
      await s.ref.delete();
    }
    await db.collection("todoItems").doc(String(id)).delete();
    return { ok: true };
  }
  throw createError({ statusCode: 405, statusMessage: "Method Not Allowed" });
});

export { index as default };
//# sourceMappingURL=index7.mjs.map
