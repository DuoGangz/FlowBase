import { d as defineEventHandler, c as createError, g as getQuery, p as prisma, s as setHeader } from '../../nitro/nitro.mjs';
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
  var _a, _b, _c, _d, _e;
  const me = await getCurrentUser(event);
  if (!me) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  if (me.role !== "OWNER" && me.role !== "ADMIN") throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  const q = getQuery(event);
  const action = typeof q.action === "string" ? q.action : void 0;
  const startStr = typeof q.start === "string" ? q.start : void 0;
  const endStr = typeof q.end === "string" ? q.end : void 0;
  const start = startStr ? /* @__PURE__ */ new Date(startStr + "T00:00:00.000Z") : void 0;
  const end = endStr ? /* @__PURE__ */ new Date(endStr + "T23:59:59.999Z") : void 0;
  const where = {};
  if (action) where.action = action;
  if (start || end) where.createdAt = { gte: start, lte: end };
  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      actor: { select: { id: true, name: true } },
      target: { select: { id: true, name: true } }
    }
  });
  if (q.format === "csv") {
    const escape = (v) => {
      if (v === null || v === void 0) return "";
      const s = String(v);
      if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    };
    const rows = [["createdAt", "action", "actorId", "actorName", "targetId", "targetName", "details"]];
    for (const l of logs) {
      rows.push([
        l.createdAt.toISOString(),
        l.action,
        l.actorUserId,
        (_b = (_a = l.actor) == null ? void 0 : _a.name) != null ? _b : "",
        (_c = l.targetUserId) != null ? _c : "",
        (_e = (_d = l.target) == null ? void 0 : _d.name) != null ? _e : "",
        JSON.stringify(l.details)
      ].map(escape));
    }
    const csv = rows.map((r) => r.join(",")).join("\n");
    setHeader(event, "Content-Type", "text/csv; charset=utf-8");
    setHeader(event, "Content-Disposition", 'attachment; filename="audit-logs.csv"');
    return csv;
  }
  return logs;
});

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
