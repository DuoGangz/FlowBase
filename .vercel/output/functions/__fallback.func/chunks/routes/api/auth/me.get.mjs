import { d as defineEventHandler, c as createError } from '../../../_/nitro.mjs';
import { g as getCurrentUser } from '../../../_/auth.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'fs';
import 'url';
import 'os';
import 'path';
import 'http';
import 'https';
import 'http2';
import 'events';
import 'node:stream';
import 'node:util';
import 'zlib';
import 'jsonwebtoken';
import 'node-forge';
import 'crypto';
import 'jwks-rsa';
import '@firebase/database-compat/standalone';
import '@google-cloud/firestore';
import 'farmhash-modern';
import '@google-cloud/firestore/build/src/path';

const me_get = defineEventHandler(async (event) => {
  const me = await getCurrentUser(event);
  if (!me) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  return { id: me.id, name: me.name, email: me.email, role: me.role };
});

export { me_get as default };
//# sourceMappingURL=me.get.mjs.map
