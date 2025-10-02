import { _ as __nuxt_component_0 } from './server.mjs';
import { defineComponent, ref, mergeProps, unref, withCtx, createTextVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderAttr, ssrRenderList, ssrRenderComponent, ssrInterpolate } from 'vue/server-renderer';
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
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const projects = ref([]);
    const name = ref("");
    const slug = ref("");
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "p-6 space-y-6" }, _attrs))}><h1 class="text-2xl font-semibold">Projects</h1><form class="flex gap-2"><input${ssrRenderAttr("value", unref(name))} placeholder="New project name" class="border rounded px-3 py-2 w-64"><input${ssrRenderAttr("value", unref(slug))} placeholder="slug" class="border rounded px-3 py-2 w-48"><button class="bg-black text-white px-4 py-2 rounded">Create</button></form><ul class="divide-y"><!--[-->`);
      ssrRenderList(unref(projects), (p) => {
        _push(`<li class="py-2">`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          class: "text-blue-600 hover:underline",
          to: `/projects/${p.slug}`
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(p.name)}`);
            } else {
              return [
                createTextVNode(toDisplayString(p.name), 1)
              ];
            }
          }),
          _: 2
        }, _parent));
        _push(`</li>`);
      });
      _push(`<!--]--></ul></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/projects/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-DlxR3K6K.mjs.map
