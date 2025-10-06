import { d as defineEventHandler, b as getMethod, a as getFirestore, c as createError, f as readMultipartFormData, h as getFirebaseBucket } from '../../nitro/nitro.mjs';
import { g as getCurrentUser } from '../../_/auth.mjs';
import { promises } from 'node:fs';
import path from 'node:path';
import { put } from '@vercel/blob';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:crypto';
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
  var _a;
  const method = getMethod(event);
  if (method === "GET") {
    try {
      const db = getFirestore();
      const snap = await db.collection("settings").doc("site").get();
      const url = (snap.exists ? (_a = snap.data()) == null ? void 0 : _a.bannerUrl : void 0) || null;
      if (url) return { url };
    } catch {
    }
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
    let publicUrl = null;
    const storageMode = (process.env.FILES_STORAGE || "").toLowerCase();
    const isVercel = Boolean(process.env.VERCEL);
    try {
      if (storageMode === "firebase") {
        const bucket = getFirebaseBucket();
        const pathname = `banner/${BASENAME}${ext}`;
        const fileRef = bucket.file(pathname);
        await fileRef.save(file.data, { contentType: file.type || void 0, resumable: false, public: true });
        publicUrl = `https://storage.googleapis.com/${bucket.name}/${pathname}`;
      } else if (isVercel) {
        const token = process.env.BLOB_READ_WRITE_TOKEN;
        if (!token) throw new Error("Missing BLOB_READ_WRITE_TOKEN");
        const pathname = `banner/${BASENAME}${ext}`;
        const uploaded = await put(pathname, file.data, { access: "public", addRandomSuffix: false, token });
        publicUrl = uploaded.url;
      } else {
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
        publicUrl = `/${BASENAME}${ext}?v=${encodeURIComponent(stat.mtimeMs.toString())}`;
      }
    } catch (e) {
      throw createError({ statusCode: 500, statusMessage: "Failed to save banner. Configure storage (Firebase or Vercel Blob)." });
    }
    try {
      const db = getFirestore();
      await db.collection("settings").doc("site").set({ bannerUrl: publicUrl }, { merge: true });
    } catch {
    }
    return { ok: true, url: publicUrl };
  }
  throw createError({ statusCode: 405, statusMessage: "Method Not Allowed" });
});

export { index as default };
//# sourceMappingURL=index3.mjs.map
