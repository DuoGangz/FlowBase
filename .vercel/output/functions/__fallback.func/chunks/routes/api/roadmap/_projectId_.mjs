import { d as defineEventHandler, e as getRouterParams, c as createError, a as getMethod, p as prisma, r as readBody, g as getQuery } from '../../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';

const _projectId_ = defineEventHandler(async (event) => {
  var _a;
  const { projectId } = getRouterParams(event);
  const projectIdNum = Number(projectId);
  if (!projectId || Number.isNaN(projectIdNum)) {
    throw createError({ statusCode: 400, statusMessage: "projectId must be a number" });
  }
  const method = getMethod(event);
  if (method === "GET") {
    return prisma.roadmapEntry.findMany({
      where: { projectId: projectIdNum },
      orderBy: { date: "asc" }
    });
  }
  if (method === "POST") {
    const body = await readBody(event);
    if (!(body == null ? void 0 : body.description) || !(body == null ? void 0 : body.date)) {
      throw createError({ statusCode: 400, statusMessage: "description and date are required" });
    }
    const parsedDate = new Date(body.date);
    if (Number.isNaN(parsedDate.getTime())) {
      throw createError({ statusCode: 400, statusMessage: "date must be a valid date" });
    }
    return prisma.roadmapEntry.create({
      data: {
        description: body.description,
        date: parsedDate,
        userId: (_a = body.userId) != null ? _a : 1,
        projectId: projectIdNum
      }
    });
  }
  if (method === "PUT") {
    const body = await readBody(event);
    if (!(body == null ? void 0 : body.id)) throw createError({ statusCode: 400, statusMessage: "id is required" });
    const data = {};
    if (typeof body.description === "string") data.description = body.description;
    if (body.date) {
      const d = new Date(body.date);
      if (Number.isNaN(d.getTime())) {
        throw createError({ statusCode: 400, statusMessage: "date must be a valid date" });
      }
      data.date = d;
    }
    return prisma.roadmapEntry.update({ where: { id: Number(body.id) }, data });
  }
  if (method === "DELETE") {
    const query = getQuery(event);
    const id = Number(query.id);
    if (!id) throw createError({ statusCode: 400, statusMessage: "id is required" });
    await prisma.roadmapEntry.delete({ where: { id } });
    return { ok: true };
  }
  throw createError({ statusCode: 405, statusMessage: "Method Not Allowed" });
});

export { _projectId_ as default };
//# sourceMappingURL=_projectId_.mjs.map
