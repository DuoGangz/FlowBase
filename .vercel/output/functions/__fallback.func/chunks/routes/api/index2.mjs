import { d as defineEventHandler, c as createError, a as getMethod, g as getQuery, p as prisma, r as readBody } from '../../nitro/nitro.mjs';
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

const index = defineEventHandler(async (event) => {
  var _a;
  const me = await getCurrentUser(event);
  if (!me) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  const method = getMethod(event);
  if (method === "GET") {
    const query = getQuery(event);
    const view = query.view || "me";
    const userId = query.userId ? Number(query.userId) : void 0;
    if (view === "all" || view === "byUser" || view === "authored") {
      if (me.role !== "OWNER" && me.role !== "MANAGER" && me.role !== "ADMIN_MANAGER") throw createError({ statusCode: 403, statusMessage: "Forbidden" });
    }
    const where = { accountId: me.accountId, completed: false };
    if (view === "me") where.assignedToId = me.id;
    if (view === "byUser" && userId) where.assignedToId = userId;
    if (view === "authored") {
      delete where.assignedToId;
      where.assignedById = me.id;
    }
    return prisma.assignment.findMany({ where, orderBy: { createdAt: "desc" } });
  }
  if (method === "POST") {
    if (me.role !== "OWNER" && me.role !== "MANAGER" && me.role !== "ADMIN_MANAGER") throw createError({ statusCode: 403, statusMessage: "Forbidden" });
    const body = await readBody(event);
    if (!(body == null ? void 0 : body.title) || !(body == null ? void 0 : body.assignedToId)) throw createError({ statusCode: 400, statusMessage: "title and assignedToId required" });
    const target = await prisma.user.findUnique({ where: { id: Number(body.assignedToId) } });
    if (!target || target.accountId !== me.accountId) throw createError({ statusCode: 404, statusMessage: "User not found" });
    if (target.role === "ADMIN" && !(me.role === "OWNER" || me.role === "ADMIN_MANAGER")) {
      throw createError({ statusCode: 403, statusMessage: "Only OWNER or ADMIN_MANAGER can assign to ADMIN" });
    }
    return prisma.assignment.create({
      data: {
        title: body.title,
        details: (_a = body.details) != null ? _a : null,
        assignedToId: Number(body.assignedToId),
        assignedById: me.id,
        accountId: me.accountId,
        dueDate: body.dueDate ? new Date(body.dueDate) : null
      }
    });
  }
  if (method === "PUT") {
    const body = await readBody(event);
    if (!(body == null ? void 0 : body.id)) throw createError({ statusCode: 400, statusMessage: "id required" });
    const a = await prisma.assignment.findUnique({ where: { id: Number(body.id) } });
    if (!a || a.accountId !== me.accountId) throw createError({ statusCode: 404, statusMessage: "Not found" });
    const canComplete = me.id === a.assignedToId || me.role === "OWNER" || me.role === "MANAGER";
    if (!canComplete) throw createError({ statusCode: 403, statusMessage: "Forbidden" });
    const completed = body.completed === true;
    return prisma.assignment.update({ where: { id: a.id }, data: { completed, completedAt: completed ? /* @__PURE__ */ new Date() : null } });
  }
  throw createError({ statusCode: 405, statusMessage: "Method Not Allowed" });
});

export { index as default };
//# sourceMappingURL=index2.mjs.map
