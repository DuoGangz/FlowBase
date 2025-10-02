import { _ as __nuxt_component_0 } from './server.mjs';
import { defineComponent, ref, computed, reactive, watch, mergeProps, withCtx, createTextVNode, unref, useSSRContext } from 'vue';
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
  __name: "users",
  __ssrInlineRender: true,
  setup(__props) {
    const me = ref(null);
    const users = ref([]);
    const managers = computed(() => users.value.filter((u) => u.role === "MANAGER" || u.role === "ADMIN_MANAGER"));
    const dirty = reactive({});
    const createForm = reactive(
      { name: "", email: "", username: "", role: "USER", managerId: void 0 }
    );
    watch(users, (val) => {
      for (const u of val) dirty[u.id] = true;
    }, { deep: true });
    function canEdit(target) {
      if (!me.value) return false;
      if (me.value.role === "OWNER") return true;
      if (me.value.role === "ADMIN") return target.role !== "OWNER";
      if (me.value.role === "MANAGER" || me.value.role === "ADMIN_MANAGER") return target.managerId === me.value.id;
      return false;
    }
    function canChangeManager(target) {
      if (!me.value) return false;
      if (me.value.role === "OWNER") return true;
      if (me.value.role === "ADMIN") return target.role !== "OWNER";
      return false;
    }
    function canReset(target) {
      if (!me.value) return false;
      if (me.value.role === "OWNER") return true;
      if (me.value.role === "ADMIN") return target.role !== "OWNER";
      if (me.value.role === "MANAGER" || me.value.role === "ADMIN_MANAGER") return target.managerId === me.value.id;
      return me.value.id === target.id;
    }
    function canEditRole(target) {
      if (!me.value) return false;
      if (me.value.role === "OWNER") return true;
      if (me.value.role === "ADMIN") return target.role !== "OWNER";
      return false;
    }
    const resetTarget = ref(null);
    const pwd1 = ref("");
    const pwd2 = ref("");
    const pwdError = ref("");
    const canSubmitPwd = computed(() => pwd1.value.length > 0 && pwd1.value === pwd2.value);
    const accessTarget = ref(null);
    const accessPages = ref([]);
    const accessAssignments = ref({});
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "p-6 space-y-4" }, _attrs))}><div class="flex items-center justify-between"><h1 class="text-2xl font-semibold">Users</h1>`);
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
      if (unref(me) && (unref(me).role === "ADMIN" || unref(me).role === "OWNER")) {
        _push(`<div class="border rounded-md p-4 space-y-2"><h2 class="font-medium">Create User</h2><form class="grid gap-2 md:grid-cols-5"><input${ssrRenderAttr("value", unref(createForm).name)} placeholder="Name" class="border rounded px-2 py-1"><input${ssrRenderAttr("value", unref(createForm).email)} placeholder="Email" class="border rounded px-2 py-1"><input${ssrRenderAttr("value", unref(createForm).username)} placeholder="Username (optional)" class="border rounded px-2 py-1"><select class="border rounded px-2 py-1"><option value="USER"${ssrIncludeBooleanAttr(Array.isArray(unref(createForm).role) ? ssrLooseContain(unref(createForm).role, "USER") : ssrLooseEqual(unref(createForm).role, "USER")) ? " selected" : ""}>USER</option><option value="MANAGER"${ssrIncludeBooleanAttr(Array.isArray(unref(createForm).role) ? ssrLooseContain(unref(createForm).role, "MANAGER") : ssrLooseEqual(unref(createForm).role, "MANAGER")) ? " selected" : ""}>MANAGER</option><option value="ADMIN"${ssrIncludeBooleanAttr(Array.isArray(unref(createForm).role) ? ssrLooseContain(unref(createForm).role, "ADMIN") : ssrLooseEqual(unref(createForm).role, "ADMIN")) ? " selected" : ""}>ADMIN</option>`);
        if (unref(me) && unref(me).role === "OWNER") {
          _push(`<option value="ADMIN_MANAGER"${ssrIncludeBooleanAttr(Array.isArray(unref(createForm).role) ? ssrLooseContain(unref(createForm).role, "ADMIN_MANAGER") : ssrLooseEqual(unref(createForm).role, "ADMIN_MANAGER")) ? " selected" : ""}>ADMIN_MANAGER</option>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</select><select class="border rounded px-2 py-1"><option${ssrRenderAttr("value", void 0)}${ssrIncludeBooleanAttr(Array.isArray(unref(createForm).managerId) ? ssrLooseContain(unref(createForm).managerId, void 0) : ssrLooseEqual(unref(createForm).managerId, void 0)) ? " selected" : ""}>No Manager</option><!--[-->`);
        ssrRenderList(unref(managers), (u) => {
          _push(`<option${ssrRenderAttr("value", u.id)}${ssrIncludeBooleanAttr(Array.isArray(unref(createForm).managerId) ? ssrLooseContain(unref(createForm).managerId, u.id) : ssrLooseEqual(unref(createForm).managerId, u.id)) ? " selected" : ""}>Manager: ${ssrInterpolate(u.name)}</option>`);
        });
        _push(`<!--]--></select><div class="md:col-span-5"><button class="px-3 py-2 border rounded">Create</button></div></form></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="overflow-x-auto"><table class="min-w-full text-sm"><thead><tr class="text-left border-b"><th class="py-2 pr-4">Username</th><th class="py-2 pr-4">Name</th><th class="py-2 pr-4">Email</th><th class="py-2 pr-4">Role</th><th class="py-2 pr-4">Manager</th><th class="py-2 pr-4"></th></tr></thead><tbody><!--[-->`);
      ssrRenderList(unref(users), (u) => {
        _push(`<tr class="border-b"><td class="py-2 pr-4"><input${ssrRenderAttr("value", u.username)}${ssrIncludeBooleanAttr(!canEdit(u)) ? " disabled" : ""} class="border rounded px-2 py-1 w-40"></td><td class="py-2 pr-4"><input${ssrRenderAttr("value", u.name)}${ssrIncludeBooleanAttr(!canEdit(u)) ? " disabled" : ""} class="border rounded px-2 py-1 w-40"></td><td class="py-2 pr-4">${ssrInterpolate(u.email)}</td><td class="py-2 pr-4"><select${ssrIncludeBooleanAttr(!canEditRole(u)) ? " disabled" : ""} class="border rounded px-2 py-1"><option value="USER"${ssrIncludeBooleanAttr(Array.isArray(u.role) ? ssrLooseContain(u.role, "USER") : ssrLooseEqual(u.role, "USER")) ? " selected" : ""}>USER</option><option value="MANAGER"${ssrIncludeBooleanAttr(Array.isArray(u.role) ? ssrLooseContain(u.role, "MANAGER") : ssrLooseEqual(u.role, "MANAGER")) ? " selected" : ""}>MANAGER</option>`);
        if (unref(me) && (unref(me).role === "ADMIN" || unref(me).role === "OWNER")) {
          _push(`<option value="ADMIN"${ssrIncludeBooleanAttr(Array.isArray(u.role) ? ssrLooseContain(u.role, "ADMIN") : ssrLooseEqual(u.role, "ADMIN")) ? " selected" : ""}>ADMIN</option>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(me) && unref(me).role === "OWNER") {
          _push(`<option value="ADMIN_MANAGER"${ssrIncludeBooleanAttr(Array.isArray(u.role) ? ssrLooseContain(u.role, "ADMIN_MANAGER") : ssrLooseEqual(u.role, "ADMIN_MANAGER")) ? " selected" : ""}>ADMIN_MANAGER</option>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</select></td><td class="py-2 pr-4"><select${ssrIncludeBooleanAttr(!canChangeManager(u)) ? " disabled" : ""} class="border rounded px-2 py-1"><option${ssrRenderAttr("value", null)}${ssrIncludeBooleanAttr(Array.isArray(u.managerId) ? ssrLooseContain(u.managerId, null) : ssrLooseEqual(u.managerId, null)) ? " selected" : ""}>No Manager</option><!--[-->`);
        ssrRenderList(unref(managers), (m) => {
          _push(`<option${ssrRenderAttr("value", m.id)}${ssrIncludeBooleanAttr(Array.isArray(u.managerId) ? ssrLooseContain(u.managerId, m.id) : ssrLooseEqual(u.managerId, m.id)) ? " selected" : ""}>${ssrInterpolate(m.name)}</option>`);
        });
        _push(`<!--]--></select></td><td class="py-2 pr-4"><button class="px-3 py-1 border rounded disabled:opacity-50"${ssrIncludeBooleanAttr(!unref(dirty)[u.id] || !canEdit(u)) ? " disabled" : ""}>Save</button><button class="ml-2 px-3 py-1 border rounded"${ssrIncludeBooleanAttr(!canReset(u)) ? " disabled" : ""}>Reset Password</button>`);
        if (unref(me) && (unref(me).role === "OWNER" || unref(me).role === "ADMIN")) {
          _push(`<button class="ml-2 px-3 py-1 border rounded">Page Access</button>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</td></tr>`);
      });
      _push(`<!--]--></tbody></table></div>`);
      if (unref(resetTarget)) {
        _push(`<div class="fixed inset-0 bg-black/30 flex items-center justify-center"><div class="bg-white rounded-md p-4 w-96 space-y-2"><h3 class="font-medium">Reset Password for ${ssrInterpolate(unref(resetTarget).name)}</h3><input type="password"${ssrRenderAttr("value", unref(pwd1))} placeholder="New password" class="border rounded px-2 py-1 w-full"><input type="password"${ssrRenderAttr("value", unref(pwd2))} placeholder="Confirm password" class="border rounded px-2 py-1 w-full">`);
        if (unref(pwdError)) {
          _push(`<div class="text-sm text-red-600">${ssrInterpolate(unref(pwdError))}</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="flex justify-end gap-2 pt-2"><button class="px-3 py-1 border rounded">Cancel</button><button class="px-3 py-1 border rounded bg-black text-white"${ssrIncludeBooleanAttr(!unref(canSubmitPwd)) ? " disabled" : ""}>Update</button></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(accessTarget)) {
        _push(`<div class="fixed inset-0 bg-black/30 flex items-center justify-center"><div class="bg-white rounded-md p-4 w-[520px] space-y-3"><h3 class="font-medium">Home Page Access for ${ssrInterpolate(unref(accessTarget).name)}</h3><div class="space-y-2 max-h-80 overflow-auto"><!--[-->`);
        ssrRenderList(unref(accessPages), (p) => {
          _push(`<div class="flex items-center justify-between border rounded px-2 py-1"><div class="flex items-center gap-2"><input type="checkbox"${ssrIncludeBooleanAttr(Array.isArray(unref(accessAssignments)[p.id].enabled) ? ssrLooseContain(unref(accessAssignments)[p.id].enabled, null) : unref(accessAssignments)[p.id].enabled) ? " checked" : ""}><span>${ssrInterpolate(p.name)}</span></div><label class="text-sm flex items-center gap-1"><input type="checkbox"${ssrIncludeBooleanAttr(Array.isArray(unref(accessAssignments)[p.id].canEdit) ? ssrLooseContain(unref(accessAssignments)[p.id].canEdit, null) : unref(accessAssignments)[p.id].canEdit) ? " checked" : ""}${ssrIncludeBooleanAttr(!unref(accessAssignments)[p.id].enabled) ? " disabled" : ""}> Can edit layout </label></div>`);
        });
        _push(`<!--]--></div><div class="flex justify-end gap-2 pt-2"><button class="px-3 py-1 border rounded">Cancel</button><button class="px-3 py-1 border rounded bg-black text-white">Save</button></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/users.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=users-BJtW2Rh_.mjs.map
