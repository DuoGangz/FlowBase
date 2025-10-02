import { d as defineEventHandler, c as createError, p as prisma } from '../../nitro/nitro.mjs';
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

const index_get = defineEventHandler(async (event) => {
  const me = await getCurrentUser(event);
  if (!me) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  if (me.role === "OWNER" || me.role === "ADMIN") {
    return prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  }
  if (me.role === "MANAGER") {
    return prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  }
  return prisma.user.findMany({ where: { id: me.id } });
});

export { index_get as default };
//# sourceMappingURL=index.get3.mjs.map
