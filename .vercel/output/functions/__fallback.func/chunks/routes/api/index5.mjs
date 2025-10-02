import { d as defineEventHandler, a as getMethod, c as createError, r as readBody } from '../../nitro/nitro.mjs';
import { promises } from 'node:fs';
import path from 'node:path';
import { g as getCurrentUser } from '../../_/auth.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:crypto';
import '../../_/firestore.mjs';
import 'firebase-admin';

const titlePath = path.join(process.cwd(), "public", "site-title.json");
const index = defineEventHandler(async (event) => {
  var _a, _b;
  const method = getMethod(event);
  if (method === "GET") {
    try {
      const raw = await promises.readFile(titlePath, "utf-8");
      const data = JSON.parse(raw);
      return { title: (_a = data.title) != null ? _a : "Home" };
    } catch {
      return { title: "Home" };
    }
  }
  if (method === "POST") {
    const me = await getCurrentUser(event);
    if (!me) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    if (me.role !== "ADMIN" && me.role !== "OWNER") throw createError({ statusCode: 403, statusMessage: "Forbidden" });
    const body = await readBody(event);
    const title = ((_b = body == null ? void 0 : body.title) != null ? _b : "").toString().trim();
    if (!title) throw createError({ statusCode: 400, statusMessage: "Title required" });
    await promises.writeFile(titlePath, JSON.stringify({ title }, null, 2), "utf-8");
    return { ok: true, title };
  }
  throw createError({ statusCode: 405, statusMessage: "Method Not Allowed" });
});

export { index as default };
//# sourceMappingURL=index5.mjs.map
