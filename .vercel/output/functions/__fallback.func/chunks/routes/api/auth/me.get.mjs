import { d as defineEventHandler, c as createError } from '../../../nitro/nitro.mjs';
import { g as getCurrentUser } from '../../../_/auth.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'firebase-admin';

const me_get = defineEventHandler(async (event) => {
  const me = await getCurrentUser(event);
  if (!me) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  return { id: me.id, name: me.name, email: me.email, role: me.role };
});

export { me_get as default };
//# sourceMappingURL=me.get.mjs.map
