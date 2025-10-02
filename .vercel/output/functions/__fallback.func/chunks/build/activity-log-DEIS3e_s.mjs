import { _ as __nuxt_component_0 } from './server.mjs';
import { defineComponent, ref, computed, mergeProps, withCtx, createTextVNode, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrInterpolate, ssrRenderClass } from 'vue/server-renderer';
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
  __name: "activity-log",
  __ssrInlineRender: true,
  setup(__props) {
    const me = ref(null);
    const allowed = computed(() => me.value && (me.value.role === "OWNER" || me.value.role === "MANAGER"));
    const users = ref([]);
    const filterUserId = ref(0);
    const items = ref([]);
    const filterStatus = ref("all");
    function fmt(d) {
      if (!d) return "";
      const dt = new Date(d);
      return dt.toLocaleString();
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "p-6 space-y-4" }, _attrs))}><div class="flex items-center justify-between"><h1 class="text-2xl font-semibold">Activity Log</h1>`);
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
      _push(`</div>`);
      if (!unref(allowed)) {
        _push(`<div class="text-sm text-red-600">Forbidden</div>`);
      } else {
        _push(`<div class="space-y-4"><div class="flex gap-2 items-center"><select class="border rounded px-2 py-1"><option${ssrRenderAttr("value", 0)}${ssrIncludeBooleanAttr(Array.isArray(unref(filterUserId)) ? ssrLooseContain(unref(filterUserId), 0) : ssrLooseEqual(unref(filterUserId), 0)) ? " selected" : ""}>Whole company</option><!--[-->`);
        ssrRenderList(unref(users), (u) => {
          _push(`<option${ssrRenderAttr("value", u.id)}${ssrIncludeBooleanAttr(Array.isArray(unref(filterUserId)) ? ssrLooseContain(unref(filterUserId), u.id) : ssrLooseEqual(unref(filterUserId), u.id)) ? " selected" : ""}>${ssrInterpolate(u.name)}</option>`);
        });
        _push(`<!--]--></select><select class="border rounded px-2 py-1"><option value="all"${ssrIncludeBooleanAttr(Array.isArray(unref(filterStatus)) ? ssrLooseContain(unref(filterStatus), "all") : ssrLooseEqual(unref(filterStatus), "all")) ? " selected" : ""}>All</option><option value="assigned"${ssrIncludeBooleanAttr(Array.isArray(unref(filterStatus)) ? ssrLooseContain(unref(filterStatus), "assigned") : ssrLooseEqual(unref(filterStatus), "assigned")) ? " selected" : ""}>Assigned</option><option value="completed"${ssrIncludeBooleanAttr(Array.isArray(unref(filterStatus)) ? ssrLooseContain(unref(filterStatus), "completed") : ssrLooseEqual(unref(filterStatus), "completed")) ? " selected" : ""}>Completed</option></select><button class="px-3 py-1 border rounded">Apply</button></div><ul class="divide-y"><!--[-->`);
        ssrRenderList(unref(items), (it) => {
          _push(`<li class="py-2 flex items-center justify-between"><div><div class="font-medium">${ssrInterpolate(it.title)}</div><div class="text-xs text-gray-500">Assigned ${ssrInterpolate(fmt(it.createdAt))} by ${ssrInterpolate(it.assignedBy.name)} • `);
          if (it.completed) {
            _push(`<!--[-->Completed ${ssrInterpolate(fmt(it.completedAt))} by ${ssrInterpolate(it.assignedTo.name)}<!--]-->`);
          } else {
            _push(`<!--[-->Not completed<!--]-->`);
          }
          _push(`</div></div><span class="${ssrRenderClass([it.completed ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700", "text-xs px-2 py-0.5 rounded-full"])}">${ssrInterpolate(it.completed ? "Completed" : "Assigned")}</span></li>`);
        });
        _push(`<!--]-->`);
        if (unref(items).length === 0) {
          _push(`<li class="py-2 text-sm text-gray-500">No activity</li>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</ul></div>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/activity-log.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=activity-log-DEIS3e_s.mjs.map
