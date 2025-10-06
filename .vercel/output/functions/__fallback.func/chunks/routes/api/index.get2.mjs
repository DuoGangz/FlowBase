import { d as defineEventHandler, a as getFirestore } from '../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'firebase-admin';

const index_get = defineEventHandler(async () => {
  const db = getFirestore();
  const snap = await db.collection("projects").orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => ({ id: Number(d.get("id")), name: d.get("name"), slug: d.get("slug") }));
});

export { index_get as default };
//# sourceMappingURL=index.get2.mjs.map
