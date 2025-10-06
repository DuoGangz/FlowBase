import { d as defineEventHandler, c as createError } from '../../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'firebase-admin';

const settings = defineEventHandler(() => {
  throw createError({ statusCode: 404, statusMessage: "Not Found" });
});

export { settings as default };
//# sourceMappingURL=settings.mjs.map
