import { d as defineEventHandler, c as createError } from '../../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'firebase-admin';

const bootstrap_post = defineEventHandler(async () => {
  throw createError({ statusCode: 400, statusMessage: "Bootstrap disabled. Use Firebase sign-in." });
});

export { bootstrap_post as default };
//# sourceMappingURL=bootstrap.post.mjs.map
