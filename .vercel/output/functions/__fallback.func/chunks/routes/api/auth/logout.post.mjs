import { d as defineEventHandler } from '../../../nitro/nitro.mjs';
import { c as clearUserSession } from '../../../_/auth.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import '../../../_/firestore.mjs';
import 'firebase-admin';

const logout_post = defineEventHandler(async (event) => {
  clearUserSession(event);
  return { ok: true };
});

export { logout_post as default };
//# sourceMappingURL=logout.post.mjs.map
