import { d as defineEventHandler, b as getMethod, a as getFirestore, c as createError, r as readBody } from '../../nitro/nitro.mjs';
import { promises } from 'node:fs';
import path from 'node:path';
import { g as getCurrentUser } from '../../_/auth.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
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

const titlePath = path.join(process.cwd(), "public", "site-title.json");
const index = defineEventHandler(async (event) => {
  var _a, _b, _c;
  const method = getMethod(event);
  if (method === "GET") {
    try {
      const db = getFirestore();
      const snap = await db.collection("settings").doc("site").get();
      const title = (snap.exists ? (_a = snap.data()) == null ? void 0 : _a.title : void 0) || null;
      if (title) return { title };
    } catch {
    }
    try {
      const raw = await promises.readFile(titlePath, "utf-8");
      const data = JSON.parse(raw);
      return { title: (_b = data.title) != null ? _b : "Home" };
    } catch {
      return { title: "Home" };
    }
  }
  if (method === "POST") {
    const me = await getCurrentUser(event);
    if (!me) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    if (me.role !== "ADMIN" && me.role !== "OWNER") throw createError({ statusCode: 403, statusMessage: "Forbidden" });
    const body = await readBody(event);
    const title = ((_c = body == null ? void 0 : body.title) != null ? _c : "").toString().trim();
    if (!title) throw createError({ statusCode: 400, statusMessage: "Title required" });
    try {
      const db = getFirestore();
      await db.collection("settings").doc("site").set({ title }, { merge: true });
      return { ok: true, title };
    } catch (e) {
      if (!process.env.VERCEL) {
        await promises.writeFile(titlePath, JSON.stringify({ title }, null, 2), "utf-8");
        return { ok: true, title };
      }
      throw createError({ statusCode: 500, statusMessage: "Failed to save title. Configure Firebase Admin for production." });
    }
  }
  throw createError({ statusCode: 405, statusMessage: "Method Not Allowed" });
});

export { index as default };
//# sourceMappingURL=index5.mjs.map
