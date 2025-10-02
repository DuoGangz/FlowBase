import { d as defineEventHandler, e as getRouterParams, c as createError, a as getMethod, r as readBody, g as getQuery } from '../../../nitro/nitro.mjs';
import { g as getFirestore, b as getNextSequence } from '../../../_/firestore.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'firebase-admin';

const _projectId_ = defineEventHandler(async (event) => {
  var _a;
  const { projectId } = getRouterParams(event);
  const projectIdNum = Number(projectId);
  if (!projectId || Number.isNaN(projectIdNum)) {
    throw createError({ statusCode: 400, statusMessage: "projectId must be a number" });
  }
  const method = getMethod(event);
  if (method === "GET") {
    const db = getFirestore();
    const snap = await db.collection("messages").where("projectId", "==", projectIdNum).orderBy("createdAt", "desc").get();
    return snap.docs.map((d) => d.data());
  }
  if (method === "POST") {
    const body = await readBody(event);
    if (!(body == null ? void 0 : body.title) || !(body == null ? void 0 : body.content)) {
      throw createError({ statusCode: 400, statusMessage: "title and content are required" });
    }
    const db = getFirestore();
    const id = await getNextSequence("messages");
    const doc = { id, title: body.title, content: body.content, userId: (_a = body.userId) != null ? _a : 1, projectId: projectIdNum, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
    await db.collection("messages").doc(String(id)).set(doc);
    return doc;
  }
  if (method === "PUT") {
    const body = await readBody(event);
    if (!(body == null ? void 0 : body.id)) throw createError({ statusCode: 400, statusMessage: "id is required" });
    const db = getFirestore();
    await db.collection("messages").doc(String(body.id)).update({ title: body.title, content: body.content });
    const snap = await db.collection("messages").doc(String(body.id)).get();
    return snap.data();
  }
  if (method === "DELETE") {
    const query = getQuery(event);
    const id = Number(query.id);
    if (!id) throw createError({ statusCode: 400, statusMessage: "id is required" });
    const db = getFirestore();
    await db.collection("messages").doc(String(id)).delete();
    return { ok: true };
  }
  throw createError({ statusCode: 405, statusMessage: "Method Not Allowed" });
});

export { _projectId_ as default };
//# sourceMappingURL=_projectId_.mjs.map
