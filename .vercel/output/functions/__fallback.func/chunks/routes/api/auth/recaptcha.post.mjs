import { d as defineEventHandler } from '../../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';

const recaptcha_post = defineEventHandler(() => {
  return { success: false, disabled: true };
});

export { recaptcha_post as default };
//# sourceMappingURL=recaptcha.post.mjs.map
