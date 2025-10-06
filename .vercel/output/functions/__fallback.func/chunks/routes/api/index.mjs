import { d as defineEventHandler, c as createError, g as getQuery, a as getFirestore } from '../../nitro/nitro.mjs';
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
  const me = await getCurrentUser(event);
  if (!me) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  if (me.role !== "OWNER" && me.role !== "MANAGER") throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  const query = getQuery(event);
  const userId = query.userId ? String(query.userId) : void 0;
  const status = query.status || "all";
  const db = getFirestore();
  let snap = await db.collection("assignments").orderBy("createdAt", "desc").limit(100).get().catch(async () => {
    return await db.collection("assignments").get();
  });
  let items = snap.docs.map((d) => d.data());
  if (status === "completed") items = items.filter((i) => i.completed);
  if (status === "assigned") items = items.filter((i) => !i.completed);
  if (userId) items = items.filter((i) => String(i.assignedToId) === userId);
  return items.map((i) => ({
    id: i.id,
    title: i.title,
    createdAt: i.createdAt,
    completedAt: i.completedAt,
    completed: !!i.completed,
    assignedTo: { id: i.assignedToId, name: i.assignedToId },
    assignedBy: { id: i.assignedById, name: i.assignedById }
  }));
});

export { index as default };
//# sourceMappingURL=index.mjs.map
