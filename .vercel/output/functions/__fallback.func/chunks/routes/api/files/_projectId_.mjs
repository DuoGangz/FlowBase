import { d as defineEventHandler, j as getRouterParams, c as createError, b as getMethod, g as getQuery, a as getFirestore, h as readMultipartFormData, i as getFirebaseBucket, e as getNextSequence } from '../../../nitro/nitro.mjs';
import { g as getCurrentUser } from '../../../_/auth.mjs';
import path from 'node:path';
import { promises } from 'node:fs';
import { put, del } from '@vercel/blob';
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

const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads", "projects");
async function ensureDir(dir) {
  try {
    await promises.mkdir(dir, { recursive: true });
  } catch {
  }
}
function sanitizeFilename(name) {
  const base = path.basename(name);
  return base.replace(/[^a-zA-Z0-9._-]/g, "_");
}
const _projectId_ = defineEventHandler(async (event) => {
  const { projectId } = getRouterParams(event);
  const projectIdNum = Number(projectId);
  if (!projectId || Number.isNaN(projectIdNum)) {
    throw createError({ statusCode: 400, statusMessage: "projectId must be a number" });
  }
  const method = getMethod(event);
  if (method === "GET") {
    const me = await getCurrentUser(event);
    const scope = String(getQuery(event).scope || "shared");
    const db = getFirestore();
    let q = db.collection("files").where("projectId", "==", projectIdNum);
    if (scope === "private") {
      if (!me) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
      q = q.where("ownerUserId", "==", String(me.id));
    } else {
      q = q.where("ownerUserId", "==", null);
    }
    const snap = await q.orderBy("createdAt", "desc").get();
    return snap.docs.map((d) => d.data());
  }
  if (method === "POST") {
    const me = await getCurrentUser(event);
    if (!me) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    const query = getQuery(event);
    const scope = String(query.scope || "shared");
    const form = await readMultipartFormData(event);
    const file = form == null ? void 0 : form.find((f) => f && f.filename && f.data);
    if (!file || !file.filename || !file.data) throw createError({ statusCode: 400, statusMessage: "No file uploaded" });
    const safe = sanitizeFilename(file.filename);
    const storageMode = (process.env.FILES_STORAGE || "").toLowerCase();
    const isVercel = Boolean(process.env.VERCEL);
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    let publicPath = "";
    if (storageMode === "firebase") {
      const bucket = getFirebaseBucket();
      const pathname = `projects/${projectIdNum}/${Date.now()}-${safe}`;
      const fileRef = bucket.file(pathname);
      await fileRef.save(file.data, { contentType: file.type || void 0, resumable: false, public: true });
      publicPath = `https://storage.googleapis.com/${bucket.name}/${pathname}`;
    } else if (isVercel) {
      if (!blobToken) {
        throw createError({ statusCode: 500, statusMessage: "Blob storage not configured. Create a Vercel Blob store." });
      }
      const pathname = `projects/${projectIdNum}/${Date.now()}-${safe}`;
      const uploaded = await put(pathname, file.data, { access: "public", addRandomSuffix: false, token: blobToken });
      publicPath = uploaded.url;
    } else {
      const projectDir = path.join(UPLOADS_ROOT, String(projectIdNum));
      await ensureDir(projectDir);
      let dest = path.join(projectDir, safe);
      try {
        await promises.stat(dest);
        const ext = path.extname(safe);
        const nameOnly = path.basename(safe, ext);
        const unique = `${nameOnly}-${Date.now()}${ext || ""}`;
        dest = path.join(projectDir, unique);
      } catch {
      }
      await promises.writeFile(dest, file.data);
      publicPath = dest.replace(path.join(process.cwd(), "public"), "").replace(/\\/g, "/");
    }
    const db = getFirestore();
    const id = await getNextSequence("files");
    const createdAt = (/* @__PURE__ */ new Date()).toISOString();
    const doc = {
      id,
      path: publicPath,
      metadata: { filename: safe, size: file.data.length, type: file.type || null, scope },
      projectId: projectIdNum,
      ownerUserId: scope === "private" ? String(me.id) : null,
      createdAt
    };
    await db.collection("files").doc(String(id)).set(doc);
    return doc;
  }
  if (method === "DELETE") {
    const me = await getCurrentUser(event);
    if (!me) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    const query = getQuery(event);
    const id = Number(query.id);
    if (!id) throw createError({ statusCode: 400, statusMessage: "id is required" });
    const db = getFirestore();
    const existingSnap = await db.collection("files").doc(String(id)).get();
    if (!existingSnap.exists) throw createError({ statusCode: 404, statusMessage: "File not found" });
    const existing = existingSnap.data();
    if (existing.ownerUserId && existing.ownerUserId !== me.id) {
      throw createError({ statusCode: 403, statusMessage: "Forbidden" });
    }
    try {
      const isBlobUrl = typeof existing.path === "string" && existing.path.startsWith("http");
      if (isBlobUrl) {
        if (existing.path.includes("storage.googleapis.com")) {
          try {
            const bucket = getFirebaseBucket();
            const pathname = existing.path.split(`https://storage.googleapis.com/${bucket.name}/`)[1];
            if (pathname) await bucket.file(pathname).delete({ ignoreNotFound: true });
          } catch {
          }
        } else {
          const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
          await del(existing.path, blobToken ? { token: blobToken } : void 0);
        }
      } else {
        const fileFsPath = path.join(process.cwd(), "public", existing.path);
        await promises.unlink(fileFsPath);
      }
    } catch {
    }
    await db.collection("files").doc(String(id)).delete();
    return { ok: true };
  }
  throw createError({ statusCode: 405, statusMessage: "Method Not Allowed" });
});

export { _projectId_ as default };
//# sourceMappingURL=_projectId_.mjs.map
