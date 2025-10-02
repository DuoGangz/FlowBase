import { d as defineEventHandler, c as createError } from '../../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';

const login_post = defineEventHandler(async (event) => {
  throw createError({ statusCode: 400, statusMessage: "Password login disabled. Use Google sign-in." });
});

export { login_post as default };
//# sourceMappingURL=login.post.mjs.map
