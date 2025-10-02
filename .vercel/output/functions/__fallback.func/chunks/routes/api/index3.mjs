import { d as defineEventHandler, a as getMethod, c as createError, b as readMultipartFormData } from '../../nitro/nitro.mjs';
import { g as getCurrentUser } from '../../_/auth.mjs';
import { promises } from 'node:fs';
import path from 'node:path';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:crypto';
import '../../_/firestore.mjs';
import 'firebase-admin';

const PUBLIC_DIR = path.join(process.cwd(), "public");
const BASENAME = "banner";
const ALLOWED_EXTS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
async function findExistingBanner() {
  for (const ext of ALLOWED_EXTS) {
    const p = path.join(PUBLIC_DIR, `${BASENAME}${ext}`);
    try {
      const stat = await promises.stat(p);
      return { path: p, url: `/${BASENAME}${ext}?v=${encodeURIComponent(stat.mtimeMs.toString())}` };
    } catch {
    }
  }
  return null;
}
const index = defineEventHandler(async (event) => {
  const method = getMethod(event);
  if (method === "GET") {
    const found = await findExistingBanner();
    return { url: found ? found.url : null };
  }
  if (method === "POST") {
    const me = await getCurrentUser(event);
    if (!me) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    if (me.role !== "ADMIN" && me.role !== "OWNER") throw createError({ statusCode: 403, statusMessage: "Forbidden" });
    const form = await readMultipartFormData(event);
    const file = form == null ? void 0 : form.find((f) => f && f.filename && f.data);
    if (!file || !file.filename || !file.data) throw createError({ statusCode: 400, statusMessage: "No file uploaded" });
    const incomingExt = path.extname(file.filename || "").toLowerCase();
    const ext = ALLOWED_EXTS.includes(incomingExt) ? incomingExt : file.type && file.type.includes("png") ? ".png" : file.type && file.type.includes("webp") ? ".webp" : ".jpg";
    for (const e of ALLOWED_EXTS) {
      const p = path.join(PUBLIC_DIR, `${BASENAME}${e}`);
      try {
        await promises.unlink(p);
      } catch {
      }
    }
    const dest = path.join(PUBLIC_DIR, `${BASENAME}${ext}`);
    await promises.writeFile(dest, file.data);
    const stat = await promises.stat(dest);
    const v = stat.mtimeMs.toString();
    return { ok: true, url: `/${BASENAME}${ext}?v=${encodeURIComponent(v)}` };
  }
  throw createError({ statusCode: 405, statusMessage: "Method Not Allowed" });
});

export { index as default };
//# sourceMappingURL=index3.mjs.map
