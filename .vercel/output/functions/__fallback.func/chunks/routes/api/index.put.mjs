import { d as defineEventHandler, c as createError, r as readBody, p as prisma } from '../../nitro/nitro.mjs';
import { g as getCurrentUser } from '../../_/auth.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import '../../_/firestore.mjs';
import 'firebase-admin';

const index_put = defineEventHandler(async (event) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q;
  const me = await getCurrentUser(event);
  if (!me) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  const body = await readBody(event);
  if (!(body == null ? void 0 : body.id)) throw createError({ statusCode: 400, statusMessage: "id required" });
  const target = await prisma.user.findUnique({ where: { id: Number(body.id) } });
  if (!target) throw createError({ statusCode: 404, statusMessage: "User not found" });
  if (me.role === "OWNER") {
    const updated2 = await prisma.user.update({ where: { id: target.id }, data: { role: (_a = body.role) != null ? _a : void 0, managerId: (_b = body.managerId) != null ? _b : void 0, name: (_c = body.name) != null ? _c : void 0, email: (_d = body.email) != null ? _d : void 0, username: (_e = body.username) != null ? _e : void 0 } });
    await prisma.auditLog.create({ data: { action: "ROLE_CHANGE", actorUserId: me.id, targetUserId: updated2.id, details: { from: target.role, to: updated2.role, managerId: updated2.managerId } } });
    return updated2;
  }
  if (me.role === "ADMIN") {
    if (body.role === "OWNER" || body.role === "ADMIN_MANAGER") throw createError({ statusCode: 403, statusMessage: "Cannot assign OWNER/ADMIN_MANAGER" });
    const updated2 = await prisma.user.update({ where: { id: target.id }, data: { role: (_f = body.role) != null ? _f : void 0, managerId: (_g = body.managerId) != null ? _g : void 0, name: (_h = body.name) != null ? _h : void 0, email: (_i = body.email) != null ? _i : void 0, username: (_j = body.username) != null ? _j : void 0 } });
    await prisma.auditLog.create({ data: { action: "ROLE_CHANGE", actorUserId: me.id, targetUserId: updated2.id, details: { from: target.role, to: updated2.role, managerId: updated2.managerId } } });
    return updated2;
  }
  if (me.role === "MANAGER" || me.role === "ADMIN_MANAGER") {
    const isEditableTarget = target.managerId === me.id;
    if (!isEditableTarget) throw createError({ statusCode: 403, statusMessage: "Forbidden" });
    if (body.role === "ADMIN" || body.role === "OWNER" || body.role === "ADMIN_MANAGER") throw createError({ statusCode: 403, statusMessage: "Cannot assign ADMIN/OWNER/ADMIN_MANAGER" });
    if (body.managerId !== void 0) {
      throw createError({ statusCode: 403, statusMessage: "Managers cannot change manager assignment" });
    }
    const updated2 = await prisma.user.update({ where: { id: target.id }, data: { role: (_k = body.role) != null ? _k : void 0, name: (_l = body.name) != null ? _l : void 0, email: (_m = body.email) != null ? _m : void 0, username: (_n = body.username) != null ? _n : void 0 } });
    await prisma.auditLog.create({ data: { action: "ROLE_CHANGE", actorUserId: me.id, targetUserId: updated2.id, details: { from: target.role, to: updated2.role, managerId: updated2.managerId } } });
    return updated2;
  }
  if (me.id !== target.id) throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  const updated = await prisma.user.update({ where: { id: target.id }, data: { name: (_o = body.name) != null ? _o : void 0, email: (_p = body.email) != null ? _p : void 0, username: (_q = body.username) != null ? _q : void 0 } });
  return updated;
});

export { index_put as default };
//# sourceMappingURL=index.put.mjs.map
