import { d as defineEventHandler } from '../../../_/nitro.mjs';
import { c as clearUserSession } from '../../../_/auth.mjs';
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

const logout_post = defineEventHandler(async (event) => {
  clearUserSession(event);
  return { ok: true };
});

export { logout_post as default };
//# sourceMappingURL=logout.post.mjs.map
