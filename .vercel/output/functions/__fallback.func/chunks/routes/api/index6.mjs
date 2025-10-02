import { d as defineEventHandler, c as createError, a as getMethod, r as readBody, p as prisma, g as getQuery } from '../../nitro/nitro.mjs';
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

function normalizeDateForLocalDay(date, tzOffsetMinutes) {
  const local = new Date(date.getTime() - tzOffsetMinutes * 6e4);
  const y = local.getFullYear();
  const m = local.getMonth();
  const d = local.getDate();
  return new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
}
const index = defineEventHandler(async (event) => {
  const me = await getCurrentUser(event);
  if (!me) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  const method = getMethod(event);
  if (method === "POST") {
    const body = await readBody(event);
    if (!(body == null ? void 0 : body.userId) || !(body == null ? void 0 : body.action)) {
      throw createError({ statusCode: 400, statusMessage: "userId and action are required" });
    }
    if (me.role !== "ADMIN" && Number(body.userId) !== me.id) {
      throw createError({ statusCode: 403, statusMessage: "Forbidden" });
    }
    const now = body.timestamp ? new Date(body.timestamp) : /* @__PURE__ */ new Date();
    const tz = typeof body.tzOffsetMinutes === "number" ? body.tzOffsetMinutes : 0;
    const date = normalizeDateForLocalDay(now, tz);
    const entry = await prisma.timeEntry.upsert({
      where: { userId_date: { userId: Number(body.userId), date } },
      update: {},
      create: { userId: Number(body.userId), date }
    });
    const field = body.action;
    const current = await prisma.timeEntry.findUnique({ where: { userId_date: { userId: entry.userId, date } } });
    const already = current == null ? void 0 : current[field];
    if (already) {
      return { ok: true, entry: current };
    }
    const updated = await prisma.timeEntry.update({
      where: { id: entry.id },
      data: { [field]: now }
    });
    return { ok: true, entry: updated };
  }
  if (method === "GET") {
    const q = getQuery(event);
    const userId = q.userId ? Number(q.userId) : me.id;
    if (me.role === "USER" && userId !== me.id) throw createError({ statusCode: 403, statusMessage: "Forbidden" });
    if (me.role === "MANAGER" && userId !== me.id) {
      const target = await prisma.user.findUnique({ where: { id: userId } });
      if (!target || target.managerId !== me.id) throw createError({ statusCode: 403, statusMessage: "Forbidden" });
    }
    const startStr = typeof q.start === "string" ? q.start : null;
    const endStr = typeof q.end === "string" ? q.end : null;
    let start;
    let end;
    if (startStr) start = /* @__PURE__ */ new Date(startStr + "T00:00:00.000Z");
    if (endStr) end = /* @__PURE__ */ new Date(endStr + "T23:59:59.999Z");
    if (!start || !end) {
      const today = /* @__PURE__ */ new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      start = start != null ? start : new Date(Date.UTC(thirtyDaysAgo.getUTCFullYear(), thirtyDaysAgo.getUTCMonth(), thirtyDaysAgo.getUTCDate()));
      end = end != null ? end : new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59, 999));
    }
    const entries = await prisma.timeEntry.findMany({
      where: { userId, date: { gte: start, lte: end } },
      orderBy: { date: "desc" }
    });
    return entries;
  }
  throw createError({ statusCode: 405, statusMessage: "Method Not Allowed" });
});

export { index as default };
//# sourceMappingURL=index6.mjs.map
