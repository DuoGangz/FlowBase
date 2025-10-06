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

const index_post = defineEventHandler(async (event) => {
  var _a, _b, _c;
  const me = await getCurrentUser(event);
  if (!me) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  if (me.role !== "ADMIN" && me.role !== "OWNER") throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  const body = await readBody(event);
  if (!(body == null ? void 0 : body.name) || !(body == null ? void 0 : body.email)) throw createError({ statusCode: 400, statusMessage: "name and email required" });
  const username = body.username && body.username.trim() !== "" ? body.username.trim() : body.email.includes("@") ? body.email.split("@")[0] : body.name.toLowerCase().replace(/\s+/g, "");
  const requestedRole = (_a = body.role) != null ? _a : "USER";
  if (requestedRole === "ADMIN_MANAGER" && me.role !== "OWNER") {
    throw createError({ statusCode: 403, statusMessage: "Only OWNER can assign ADMIN_MANAGER" });
  }
  const db = getFirestore();
  const id = body.email;
  const doc = {
    id,
    name: body.name,
    email: body.email,
    username,
    accountId: (_b = me.accountId) != null ? _b : 1,
    role: requestedRole,
    managerId: (_c = body.managerId) != null ? _c : null,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await db.collection("users").doc(String(id)).set(doc);
  return doc;
});

export { index_post as default };
//# sourceMappingURL=index.post2.mjs.map
