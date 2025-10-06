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

const password_post = defineEventHandler(async (event) => {
  const me = await getCurrentUser(event);
  if (!me) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  throw createError({ statusCode: 400, statusMessage: "Password login disabled. Use Google sign-in." });
});

export { password_post as default };
//# sourceMappingURL=password.post.mjs.map
