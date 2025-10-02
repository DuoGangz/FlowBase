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

const index_post = defineEventHandler(async (event) => {
  var _a, _b;
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
  const created = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      username,
      accountId: me.accountId,
      role: requestedRole,
      managerId: (_b = body.managerId) != null ? _b : null
    }
  });
  await prisma.auditLog.create({
    data: {
      action: "USER_CREATE",
      actorUserId: me.id,
      targetUserId: created.id,
      details: { role: created.role, managerId: created.managerId }
    }
  });
  return created;
});

export { index_post as default };
//# sourceMappingURL=index.post2.mjs.map
