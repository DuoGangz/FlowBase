import { d as defineEventHandler, c as createError, g as getQuery, p as prisma } from '../../nitro/nitro.mjs';
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
  const me = await getCurrentUser(event);
  if (!me) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  if (me.role !== "OWNER" && me.role !== "MANAGER") throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  const query = getQuery(event);
  const userId = query.userId ? Number(query.userId) : void 0;
  const status = query.status || "all";
  const where = { accountId: me.accountId };
  if (status === "completed") where.completed = true;
  if (status === "assigned") where.completed = false;
  if (userId) where.assignedToId = userId;
  const items = await prisma.assignment.findMany({
    where,
    orderBy: [
      { completed: "asc" },
      { completedAt: "desc" },
      { createdAt: "desc" }
    ],
    include: { assignedTo: true, assignedBy: true }
  });
  return items.map((i) => ({
    id: i.id,
    title: i.title,
    createdAt: i.createdAt,
    completedAt: i.completedAt,
    completed: i.completed,
    assignedTo: { id: i.assignedTo.id, name: i.assignedTo.name },
    assignedBy: { id: i.assignedBy.id, name: i.assignedBy.name }
  }));
});

export { index as default };
//# sourceMappingURL=index.mjs.map
