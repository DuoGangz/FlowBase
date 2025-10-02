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

const password_post = defineEventHandler(async (event) => {
  var _a;
  const me = await getCurrentUser(event);
  if (!me) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  const body = await readBody(event);
  const id = Number(body == null ? void 0 : body.id);
  const password = (_a = body == null ? void 0 : body.password) != null ? _a : "";
  if (!id || !password) throw createError({ statusCode: 400, statusMessage: "id and password required" });
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw createError({ statusCode: 404, statusMessage: "User not found" });
  if (me.role === "OWNER") ; else if (me.role === "ADMIN") {
    if (target.role === "OWNER") throw createError({ statusCode: 403, statusMessage: "Cannot modify OWNER" });
  } else if (me.role === "MANAGER") {
    const editable = target.managerId === me.id;
    if (!editable) throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  } else {
    if (me.id !== target.id) throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }
  const updated = await prisma.user.update({ where: { id: target.id }, data: { passwordHash: password } });
  return { ok: true, id: updated.id };
});

export { password_post as default };
//# sourceMappingURL=password.post.mjs.map
