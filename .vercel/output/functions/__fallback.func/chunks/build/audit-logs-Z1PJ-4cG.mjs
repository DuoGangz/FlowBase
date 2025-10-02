import { _ as __nuxt_component_0 } from './server.mjs';
import { defineComponent, ref, mergeProps, withCtx, createTextVNode, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrInterpolate } from 'vue/server-renderer';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'pinia';
import 'vue-router';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "audit-logs",
  __ssrInlineRender: true,
  setup(__props) {
    const logs = ref([]);
    const action = ref("");
    const start = ref("");
    const end = ref("");
    function formatDate(iso) {
      return new Date(iso).toLocaleString();
    }
    function formatDetails(obj) {
      try {
        return JSON.stringify(obj, null, 2);
      } catch {
        return String(obj);
      }
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "p-6 space-y-4" }, _attrs))}><div class="flex items-center justify-between"><h1 class="text-2xl font-semibold">Audit Logs</h1>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "underline"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Back`);
          } else {
            return [
              createTextVNode("Back")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="flex items-end gap-3"><div><label class="block text-sm text-gray-600">Action</label><select class="border rounded px-2 py-1"><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(action)) ? ssrLooseContain(unref(action), "") : ssrLooseEqual(unref(action), "")) ? " selected" : ""}>All</option><option value="USER_CREATE"${ssrIncludeBooleanAttr(Array.isArray(unref(action)) ? ssrLooseContain(unref(action), "USER_CREATE") : ssrLooseEqual(unref(action), "USER_CREATE")) ? " selected" : ""}>USER_CREATE</option><option value="ROLE_CHANGE"${ssrIncludeBooleanAttr(Array.isArray(unref(action)) ? ssrLooseContain(unref(action), "ROLE_CHANGE") : ssrLooseEqual(unref(action), "ROLE_CHANGE")) ? " selected" : ""}>ROLE_CHANGE</option><option value="OWNERSHIP_TRANSFER"${ssrIncludeBooleanAttr(Array.isArray(unref(action)) ? ssrLooseContain(unref(action), "OWNERSHIP_TRANSFER") : ssrLooseEqual(unref(action), "OWNERSHIP_TRANSFER")) ? " selected" : ""}>OWNERSHIP_TRANSFER</option></select></div><div><label class="block text-sm text-gray-600">Start</label><input type="date"${ssrRenderAttr("value", unref(start))} class="border rounded px-2 py-1"></div><div><label class="block text-sm text-gray-600">End</label><input type="date"${ssrRenderAttr("value", unref(end))} class="border rounded px-2 py-1"></div><button class="px-3 py-2 border rounded">Filter</button><button class="px-3 py-2 border rounded">Download CSV</button></div><div class="overflow-x-auto"><table class="min-w-full text-sm"><thead><tr class="text-left border-b"><th class="py-2 pr-4">When</th><th class="py-2 pr-4">Action</th><th class="py-2 pr-4">Actor</th><th class="py-2 pr-4">Target</th><th class="py-2 pr-4">Details</th></tr></thead><tbody><!--[-->`);
      ssrRenderList(unref(logs), (l) => {
        _push(`<tr class="border-b"><td class="py-2 pr-4">${ssrInterpolate(formatDate(l.createdAt))}</td><td class="py-2 pr-4">${ssrInterpolate(l.action)}</td><td class="py-2 pr-4">${ssrInterpolate(l.actor?.name || l.actorUserId)}</td><td class="py-2 pr-4">${ssrInterpolate(l.target?.name || l.targetUserId || "-")}</td><td class="py-2 pr-4"><pre class="whitespace-pre-wrap">${ssrInterpolate(formatDetails(l.details))}</pre></td></tr>`);
      });
      _push(`<!--]--></tbody></table></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/audit-logs.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=audit-logs-Z1PJ-4cG.mjs.map
