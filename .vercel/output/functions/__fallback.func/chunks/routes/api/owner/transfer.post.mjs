import { d as defineEventHandler, c as createError, r as readBody, p as prisma } from '../../../nitro/nitro.mjs';
import { g as getCurrentUser } from '../../../_/auth.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import '../../../_/firestore.mjs';
import 'firebase-admin';

const transfer_post = defineEventHandler(async (event) => {
  const me = await getCurrentUser(event);
  if (!me) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  if (me.role !== "OWNER") throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  const body = await readBody(event);
  const targetId = Number(body == null ? void 0 : body.targetUserId);
  if (!targetId) throw createError({ statusCode: 400, statusMessage: "targetUserId required" });
  if (targetId === me.id) throw createError({ statusCode: 400, statusMessage: "Already owner" });
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) throw createError({ statusCode: 404, statusMessage: "Target user not found" });
  if (target.accountId !== me.accountId) throw createError({ statusCode: 403, statusMessage: "Must be same account" });
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: me.id }, data: { role: "ADMIN" } });
    await tx.user.update({ where: { id: target.id }, data: { role: "OWNER" } });
    await tx.auditLog.create({ data: { action: "OWNERSHIP_TRANSFER", actorUserId: me.id, targetUserId: target.id, details: { fromUserId: me.id, toUserId: target.id } } });
  });
  return { ok: true };
});

export { transfer_post as default };
//# sourceMappingURL=transfer.post.mjs.map
