import { d as defineEventHandler, i as getRouterParams, c as createError, b as getMethod, a as getFirestore, r as readBody, e as getNextSequence, g as getQuery } from '../../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'firebase-admin';

const _projectId_ = defineEventHandler(async (event) => {
  const { projectId } = getRouterParams(event);
  const projectIdNum = Number(projectId);
  if (!projectId || Number.isNaN(projectIdNum)) {
    throw createError({ statusCode: 400, statusMessage: "projectId must be a number" });
  }
  const method = getMethod(event);
  if (method === "GET") {
    const db = getFirestore();
    const listsSnap = await db.collection("todos").where("projectId", "==", projectIdNum).get();
    const lists = listsSnap.docs.map((d) => d.data());
    for (const list of lists) {
      const itemsSnap = await db.collection("todoItems").where("todoId", "==", list.id).orderBy("position", "asc").get();
      const items = itemsSnap.docs.map((d) => d.data());
      for (const it of items) {
        const subsSnap = await db.collection("todoSubItems").where("todoItemId", "==", it.id).orderBy("position", "asc").get();
        it.subItems = subsSnap.docs.map((d) => d.data());
      }
      list.items = items;
    }
    return lists.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  }
  if (method === "POST") {
    const body = await readBody(event);
    if (!(body == null ? void 0 : body.title)) throw createError({ statusCode: 400, statusMessage: "title is required" });
    const db = getFirestore();
    const id = await getNextSequence("todos");
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const doc = { id, title: body.title, userId: Number(body.userId || 1), projectId: projectIdNum, createdAt: now, updatedAt: now };
    await db.collection("todos").doc(String(id)).set(doc);
    return doc;
  }
  if (method === "PUT") {
    const body = await readBody(event);
    if (!(body == null ? void 0 : body.id)) throw createError({ statusCode: 400, statusMessage: "id is required" });
    const db = getFirestore();
    await db.collection("todos").doc(String(body.id)).update({ title: body.title });
    const snap = await db.collection("todos").doc(String(body.id)).get();
    return snap.data();
  }
  if (method === "DELETE") {
    const query = getQuery(event);
    const id = Number(query.id);
    if (!id) throw createError({ statusCode: 400, statusMessage: "id is required" });
    const db = getFirestore();
    const items = await db.collection("todoItems").where("todoId", "==", id).get();
    for (const it of items.docs) {
      const subs = await db.collection("todoSubItems").where("todoItemId", "==", it.get("id")).get();
      for (const s of subs.docs) {
        await s.ref.delete();
      }
      await it.ref.delete();
    }
    await db.collection("todos").doc(String(id)).delete();
    return { ok: true };
  }
  throw createError({ statusCode: 405, statusMessage: "Method Not Allowed" });
});

export { _projectId_ as default };
//# sourceMappingURL=_projectId_.mjs.map
