import { d as defineEventHandler, j as getRouterParams, c as createError, b as getMethod, a as getFirestore, r as readBody, e as getNextSequence, g as getQuery } from '../../../nitro/nitro.mjs';
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
    const snap = await db.collection("roadmapEntries").where("projectId", "==", projectIdNum).orderBy("date", "asc").get().catch(async () => {
      return await db.collection("roadmapEntries").where("projectId", "==", projectIdNum).get();
    });
    return snap.docs.map((d) => d.data());
  }
  if (method === "POST") {
    const body = await readBody(event);
    if (!(body == null ? void 0 : body.description) || !(body == null ? void 0 : body.date)) {
      throw createError({ statusCode: 400, statusMessage: "description and date are required" });
    }
    const parsedDate = new Date(body.date);
    if (Number.isNaN(parsedDate.getTime())) {
      throw createError({ statusCode: 400, statusMessage: "date must be a valid date" });
    }
    const db = getFirestore();
    const id = await getNextSequence("roadmapEntries");
    const doc = { id, description: body.description, date: parsedDate.toISOString(), userId: String((_a = body.userId) != null ? _a : "1"), projectId: projectIdNum, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
    await db.collection("roadmapEntries").doc(String(id)).set(doc);
    return doc;
  }
  if (method === "PUT") {
    const body = await readBody(event);
    if (!(body == null ? void 0 : body.id)) throw createError({ statusCode: 400, statusMessage: "id is required" });
    const db = getFirestore();
    const ref = db.collection("roadmapEntries").doc(String(body.id));
    const snap = await ref.get();
    if (!snap.exists) throw createError({ statusCode: 404, statusMessage: "Not found" });
    const data = {};
    if (typeof body.description === "string") data.description = body.description;
    if (body.date) {
      const d = new Date(body.date);
      if (Number.isNaN(d.getTime())) {
        throw createError({ statusCode: 400, statusMessage: "date must be a valid date" });
      }
      data.date = d.toISOString();
    }
    await ref.set({ ...snap.data(), ...data, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }, { merge: true });
    return (await ref.get()).data();
  }
  if (method === "DELETE") {
    const query = getQuery(event);
    const id = Number(query.id);
    if (!id) throw createError({ statusCode: 400, statusMessage: "id is required" });
    const db = getFirestore();
    await db.collection("roadmapEntries").doc(String(id)).delete();
    return { ok: true };
  }
  throw createError({ statusCode: 405, statusMessage: "Method Not Allowed" });
});

export { _projectId_ as default };
//# sourceMappingURL=_projectId_.mjs.map
