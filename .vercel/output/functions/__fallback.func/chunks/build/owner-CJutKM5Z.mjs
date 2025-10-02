import { _ as __nuxt_component_0 } from './server.mjs';
import { defineComponent, ref, mergeProps, withCtx, createTextVNode, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderList, ssrRenderAttr, ssrInterpolate, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderClass } from 'vue/server-renderer';
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
  __name: "owner",
  __ssrInlineRender: true,
  setup(__props) {
    const targetUserId = ref();
    const candidates = ref([]);
    const message = ref("");
    const messageType = ref("success");
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "p-6 space-y-4" }, _attrs))}><div class="flex items-center justify-between"><h1 class="text-2xl font-semibold">Owner Tools</h1>`);
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
      _push(`</div><div class="border rounded-md p-4 space-y-3"><h2 class="font-medium">Transfer Ownership</h2><div class="text-sm text-gray-600">Select a user to become the new owner. Your role will become ADMIN.</div><div class="flex items-end gap-3"><div><label class="block text-sm text-gray-600">Target User</label><select class="border rounded px-2 py-1 min-w-64"><!--[-->`);
      ssrRenderList(unref(candidates), (u) => {
        _push(`<option${ssrRenderAttr("value", u.id)}${ssrIncludeBooleanAttr(Array.isArray(unref(targetUserId)) ? ssrLooseContain(unref(targetUserId), u.id) : ssrLooseEqual(unref(targetUserId), u.id)) ? " selected" : ""}>${ssrInterpolate(u.name)} (${ssrInterpolate(u.role)})</option>`);
      });
      _push(`<!--]--></select></div><button class="px-3 py-2 border rounded"${ssrIncludeBooleanAttr(!unref(targetUserId)) ? " disabled" : ""}>Transfer</button></div>`);
      if (unref(message)) {
        _push(`<div class="${ssrRenderClass([unref(messageType) === "success" ? "text-green-700" : "text-red-700", "text-sm"])}">${ssrInterpolate(unref(message))}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/owner.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=owner-CJutKM5Z.mjs.map
