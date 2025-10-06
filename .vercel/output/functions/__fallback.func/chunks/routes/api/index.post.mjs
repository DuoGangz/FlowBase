import { d as defineEventHandler, r as readBody, c as createError, a as getFirestore, e as getNextSequence } from '../../nitro/nitro.mjs';
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
  var _a, _b;
  const body = await readBody(event);
  if (!(body == null ? void 0 : body.name) || !(body == null ? void 0 : body.slug)) {
    throw createError({ statusCode: 400, statusMessage: "name and slug are required" });
  }
  const db = getFirestore();
  const id = await getNextSequence("projects");
  const now = /* @__PURE__ */ new Date();
  await db.collection("projects").doc(String(id)).set({
    id,
    name: body.name,
    slug: body.slug,
    accountId: (_a = body.accountId) != null ? _a : 1,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  });
  return { id, name: body.name, slug: body.slug, accountId: (_b = body.accountId) != null ? _b : 1 };
});

export { index_post as default };
//# sourceMappingURL=index.post.mjs.map
