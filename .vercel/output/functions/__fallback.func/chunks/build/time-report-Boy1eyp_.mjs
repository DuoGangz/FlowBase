import { _ as __nuxt_component_0 } from './server.mjs';
import { defineComponent, ref, mergeProps, withCtx, createTextVNode, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderAttr, ssrInterpolate, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList } from 'vue/server-renderer';
import { u as useUserStore } from './user-CDPif6pO.mjs';
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
  __name: "time-report",
  __ssrInlineRender: true,
  setup(__props) {
    const me = useUserStore();
    const entries = ref([]);
    const start = ref("");
    const end = ref("");
    const selectedUserId = ref();
    const allowedUsers = ref([]);
    function formatDate(iso) {
      return new Date(iso).toLocaleDateString();
    }
    function formatTime(iso) {
      if (!iso) return "";
      return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    function computeHours(e) {
      if (!e.clockIn) return "-";
      const start2 = new Date(e.clockIn).getTime();
      const end2 = new Date(e.clockOut || Date.now()).getTime();
      let totalMs = end2 - start2;
      if (e.lunchOut && e.lunchIn) {
        totalMs -= new Date(e.lunchIn).getTime() - new Date(e.lunchOut).getTime();
      }
      const hours = Math.max(0, totalMs) / 36e5;
      return hours.toFixed(2);
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "p-6 space-y-4" }, _attrs))}><div class="flex items-center justify-between"><h1 class="text-2xl font-semibold">Time Report</h1>`);
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
      _push(`</div><div class="flex items-end gap-3">`);
      if (unref(me).role !== "USER") {
        _push(`<div><label class="block text-sm text-gray-600">User</label><select class="border rounded px-2 py-1 min-w-48"><option${ssrRenderAttr("value", unref(me).id)}${ssrIncludeBooleanAttr(Array.isArray(unref(selectedUserId)) ? ssrLooseContain(unref(selectedUserId), unref(me).id) : ssrLooseEqual(unref(selectedUserId), unref(me).id)) ? " selected" : ""}>Me (${ssrInterpolate(unref(me).name)})</option><!--[-->`);
        ssrRenderList(unref(allowedUsers), (u) => {
          _push(`<option${ssrRenderAttr("value", u.id)}${ssrIncludeBooleanAttr(Array.isArray(unref(selectedUserId)) ? ssrLooseContain(unref(selectedUserId), u.id) : ssrLooseEqual(unref(selectedUserId), u.id)) ? " selected" : ""}>${ssrInterpolate(u.name)} (${ssrInterpolate(u.role)})</option>`);
        });
        _push(`<!--]--></select></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div><label class="block text-sm text-gray-600">Start</label><input type="date"${ssrRenderAttr("value", unref(start))} class="border rounded px-2 py-1"></div><div><label class="block text-sm text-gray-600">End</label><input type="date"${ssrRenderAttr("value", unref(end))} class="border rounded px-2 py-1"></div><button class="px-3 py-2 border rounded-md">Load</button></div><div class="overflow-x-auto"><table class="min-w-full text-sm"><thead><tr class="text-left border-b"><th class="py-2 pr-4">Date</th><th class="py-2 pr-4">Clock In</th><th class="py-2 pr-4">Lunch Out</th><th class="py-2 pr-4">Lunch In</th><th class="py-2 pr-4">Clock Out</th><th class="py-2 pr-4">Hours</th></tr></thead><tbody><!--[-->`);
      ssrRenderList(unref(entries), (e) => {
        _push(`<tr class="border-b"><td class="py-2 pr-4">${ssrInterpolate(formatDate(e.date))}</td><td class="py-2 pr-4">${ssrInterpolate(formatTime(e.clockIn) || "-")}</td><td class="py-2 pr-4">${ssrInterpolate(formatTime(e.lunchOut) || "-")}</td><td class="py-2 pr-4">${ssrInterpolate(formatTime(e.lunchIn) || "-")}</td><td class="py-2 pr-4">${ssrInterpolate(formatTime(e.clockOut) || "-")}</td><td class="py-2 pr-4">${ssrInterpolate(computeHours(e))}</td></tr>`);
      });
      _push(`<!--]--></tbody></table></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/time-report.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=time-report-Boy1eyp_.mjs.map
