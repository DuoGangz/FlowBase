import { defineComponent, ref, mergeProps, unref, computed, reactive, watch, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderClass, ssrRenderComponent, ssrRenderList, ssrRenderAttr, ssrIncludeBooleanAttr, ssrRenderStyle } from 'vue/server-renderer';
import { storeToRefs } from 'pinia';
import { u as useUserStore } from './user-CDPif6pO.mjs';
import { a as useRoute } from './server.mjs';
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
import 'vue-router';

const _sfc_main$4 = /* @__PURE__ */ defineComponent({
  __name: "MessageBoard",
  __ssrInlineRender: true,
  props: {
    projectId: {}
  },
  setup(__props) {
    const props = __props;
    const { id: userId } = storeToRefs(useUserStore());
    const messages = ref([]);
    const title = ref("");
    const content = ref("");
    async function load() {
      messages.value = await $fetch(`/api/messages/${props.projectId}`);
    }
    watch(() => props.projectId, load);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "space-y-4" }, _attrs))}><form class="space-y-2"><input${ssrRenderAttr("value", unref(title))} placeholder="Title" class="border rounded px-3 py-2 w-full"><textarea placeholder="Write a message..." class="border rounded px-3 py-2 w-full h-24">${ssrInterpolate(unref(content))}</textarea><button class="bg-black text-white px-4 py-2 rounded">Post</button></form><ul class="divide-y"><!--[-->`);
      ssrRenderList(unref(messages), (m) => {
        _push(`<li class="py-3"><p class="font-medium">${ssrInterpolate(m.title)}</p><p class="text-gray-700 whitespace-pre-line">${ssrInterpolate(m.content)}</p></li>`);
      });
      _push(`<!--]--></ul></div>`);
    };
  }
});
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/MessageBoard.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const MessageBoard = Object.assign(_sfc_main$4, { __name: "MessageBoard" });
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "TodoModule",
  __ssrInlineRender: true,
  props: {
    projectId: {},
    listId: {},
    title: {}
  },
  emits: ["created", "remove"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const title = computed(() => props.title ?? "Todo List");
    const items = ref([]);
    const view = ref("inprogress");
    const newItem = ref("");
    const listId = ref(props.listId ?? null);
    const subItemDraft = reactive({});
    const showSubForm = reactive({});
    reactive({ type: null });
    const dragOverItemId = ref(null);
    const dragOverParentId = ref(null);
    const dragOverSubId = ref(null);
    const filteredItems = computed(() => {
      const arr = Array.isArray(items.value) ? items.value : [];
      return arr.filter((it) => it && (view.value === "inprogress" ? !Boolean(it.done) : Boolean(it.done)));
    });
    watch(() => props.listId, async (v) => {
      if (v && v !== listId.value) {
        listId.value = v;
        await load();
      }
    });
    watch(() => props.projectId, async (v) => {
      if (v && v > 0) {
        await init();
      }
    });
    async function load() {
      if (!listId.value) return;
      const lists = await $fetch(`/api/todos/${props.projectId}`);
      const found = lists.find((l) => l.id === listId.value);
      const raw = Array.isArray(found?.items) ? found.items : [];
      items.value = raw.filter((it) => it && typeof it.id === "number").map((it) => ({
        id: it.id,
        content: String(it.content ?? it.title ?? ""),
        done: Boolean(it.done),
        subItems: Array.isArray(it.subItems) ? it.subItems.filter((s) => s && typeof s.id === "number").map((s) => ({ id: s.id, content: String(s.content || ""), done: Boolean(s.done), todoItemId: Number(s.todoItemId || it.id) })) : []
      }));
    }
    async function init() {
      try {
        if (!props.projectId || props.projectId <= 0) return;
        if (!listId.value) {
          const created = await $fetch(`/api/todos/${props.projectId}`, { method: "POST", body: { title: title.value } });
          listId.value = created.id;
          emit("created", created.id);
        }
        await load();
      } catch (e) {
        console.error("TodoModule init failed", e);
      }
    }
    function visibleSubItems(it) {
      if (!it || typeof it !== "object") return [];
      if (it.done) return [];
      return Array.isArray(it.subItems) ? it.subItems : [];
    }
    function isItemRenderable(it) {
      return it && typeof it === "object" && "done" in it && "id" in it;
    }
    const visibleSubItemsFiltered = (it) => (visibleSubItems(it) || []).filter((s) => s && typeof s === "object");
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "border rounded p-4 space-y-3" }, _attrs))}><div class="flex items-center justify-between"><h3 class="font-medium">${ssrInterpolate(unref(title))}</h3><button class="text-sm text-red-600">Remove</button></div><form class="flex gap-2"><input${ssrRenderAttr("value", unref(newItem))} placeholder="Add item" class="border rounded px-2 py-1 flex-1"><button class="bg-gray-800 text-white px-2 py-1 rounded">Add</button></form><ul class="space-y-2">`);
      if (isItemRenderable(_ctx.it)) {
        _push(`<!--[-->`);
        ssrRenderList(unref(filteredItems), (it) => {
          _push(`<li draggable="true" class="${ssrRenderClass([{ "bg-gray-50 rounded": unref(dragOverItemId) === it.id }, "space-y-1"])}"><div class="flex items-center gap-2"><input type="checkbox"${ssrIncludeBooleanAttr(Boolean(it?.done)) ? " checked" : ""}><span class="${ssrRenderClass({ "line-through text-gray-500": Boolean(it?.done) })}">${ssrInterpolate(it?.content ?? "")}</span><div class="ml-auto inline-flex gap-1"><button class="px-2 py-0.5 border rounded text-xs">↑</button><button class="px-2 py-0.5 border rounded text-xs">↓</button></div></div>`);
          if (Array.isArray(it.subItems)) {
            _push(`<div class="pl-6 space-y-2">`);
            if (Array.isArray(it.subItems)) {
              _push(`<ul class="space-y-1"><!--[-->`);
              ssrRenderList(visibleSubItemsFiltered(it), (sub) => {
                _push(`<li draggable="true" class="${ssrRenderClass([{ "bg-gray-50 rounded": unref(dragOverSubId) === sub.id && unref(dragOverParentId) === it.id }, "flex items-center gap-2"])}"><input type="checkbox"${ssrIncludeBooleanAttr(Boolean(sub?.done)) ? " checked" : ""}><span class="${ssrRenderClass({ "line-through text-gray-400": Boolean(sub?.done) })}">${ssrInterpolate(sub?.content ?? "")}</span><div class="ml-auto inline-flex gap-1"><button class="px-2 py-0.5 border rounded text-xs">↑</button><button class="px-2 py-0.5 border rounded text-xs">↓</button></div></li>`);
              });
              _push(`<!--]--></ul>`);
            } else {
              _push(`<!---->`);
            }
            if (unref(showSubForm)[it.id] && !it.done) {
              _push(`<form class="flex gap-2"><input${ssrRenderAttr("value", unref(subItemDraft)[it.id])} placeholder="Add subtask" class="border rounded px-2 py-1 flex-1"><button class="border px-2 py-1 rounded">Add</button></form>`);
            } else {
              _push(`<!---->`);
            }
            if (!it.done) {
              _push(`<button type="button" class="w-8 h-8 rounded-full border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center"${ssrRenderAttr("aria-label", unref(showSubForm)[it.id] ? "Hide subtask input" : "Add subtask")}><span class="text-lg leading-none">+</span></button>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</li>`);
        });
        _push(`<!--]-->`);
      } else {
        _push(`<!---->`);
      }
      _push(`</ul><div class="mt-2"><div class="inline-flex border rounded overflow-hidden"><button class="${ssrRenderClass([unref(view) === "inprogress" ? "bg-black text-white" : "", "px-2 py-1 text-xs"])}">In Progress</button><button class="${ssrRenderClass([unref(view) === "completed" ? "bg-black text-white" : "", "px-2 py-1 text-xs"])}">Completed</button></div></div></div>`);
    };
  }
});
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../components/TodoModule.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const TW = 800;
const TH = 140;
const P = 32;
const BASE = 100;
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "RoadmapModule",
  __ssrInlineRender: true,
  props: {
    projectId: {}
  },
  setup(__props) {
    const props = __props;
    const { id: userId } = storeToRefs(useUserStore());
    const entries = ref([]);
    const description = ref("");
    const dateStr = ref("");
    async function load() {
      entries.value = await $fetch(`/api/roadmap/${props.projectId}`);
    }
    watch(() => props.projectId, load);
    function shortDate(d) {
      const dt = new Date(d);
      return dt.toLocaleDateString(void 0, { month: "short", day: "numeric" });
    }
    const minDate = computed(() => {
      if (entries.value.length === 0) return null;
      return new Date(Math.min(...entries.value.map((e) => new Date(e.date).getTime())));
    });
    const maxDate = computed(() => {
      if (entries.value.length === 0) return null;
      return new Date(Math.max(...entries.value.map((e) => new Date(e.date).getTime())));
    });
    function dateToX(d) {
      const date = new Date(d);
      if (!minDate.value || !maxDate.value) return TW / 2;
      const min = minDate.value.getTime();
      const max = maxDate.value.getTime();
      if (max === min) return (TW - 2 * P) / 2 + P;
      const t = (date.getTime() - min) / (max - min);
      return P + t * (TW - 2 * P);
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "border rounded p-4 space-y-3" }, _attrs))}><div class="flex items-center justify-between"><h3 class="font-medium">Road Map</h3><button class="text-sm text-red-600">Remove</button></div><form class="flex flex-col md:flex-row gap-2"><input${ssrRenderAttr("value", unref(description))} placeholder="Short description" class="border rounded px-2 py-1 flex-1"><input${ssrRenderAttr("value", unref(dateStr))} type="date" class="border rounded px-2 py-1"><button class="bg-gray-800 text-white px-2 py-1 rounded">Add</button></form><div class="w-full overflow-x-auto"><svg${ssrRenderAttr("viewBox", `0 0 ${TW} ${TH}`)} class="w-full min-w-[600px]" preserveAspectRatio="xMidYMid meet"><line${ssrRenderAttr("x1", P)}${ssrRenderAttr("x2", TW - P)}${ssrRenderAttr("y1", BASE)}${ssrRenderAttr("y2", BASE)} stroke="#111827" stroke-width="2"></line><!--[-->`);
      ssrRenderList(unref(entries), (e) => {
        _push(`<g${ssrRenderAttr("transform", `translate(${dateToX(e.date)},0)`)} class="cursor-pointer"><line${ssrRenderAttr("x1", 0)}${ssrRenderAttr("x2", 0)}${ssrRenderAttr("y1", BASE)}${ssrRenderAttr("y2", BASE - 32)} stroke="#6b7280" stroke-width="2"></line><circle${ssrRenderAttr("cx", 0)}${ssrRenderAttr("cy", BASE - 34)} r="5" fill="#111827"></circle><text${ssrRenderAttr("x", 0)}${ssrRenderAttr("y", BASE - 44)} text-anchor="middle" class="fill-gray-800" style="${ssrRenderStyle({ "font-size": "10px" })}">${ssrInterpolate(shortDate(e.date))}</text><text${ssrRenderAttr("x", 0)}${ssrRenderAttr("y", BASE - 58)} text-anchor="middle" class="fill-gray-700" style="${ssrRenderStyle({ "font-size": "11px" })}">${ssrInterpolate(e.description)}</text></g>`);
      });
      _push(`<!--]--></svg></div></div>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../components/RoadmapModule.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "AttachmentsModule",
  __ssrInlineRender: true,
  props: {
    projectId: {},
    title: {},
    scope: {}
  },
  emits: ["remove"],
  setup(__props) {
    const props = __props;
    const title = computed(() => props.title ?? (props.scope === "private" ? "My Attachments" : "Shared Attachments"));
    const uploading = ref(false);
    ref(null);
    const files = ref([]);
    watch(() => props.projectId, () => load());
    async function load() {
      if (!props.projectId) return;
      const scope = props.scope || "shared";
      files.value = await $fetch(`/api/files/${props.projectId}?scope=${scope}`);
    }
    function fileName(p) {
      try {
        return p.split("/").filter(Boolean).pop() || p;
      } catch {
        return p;
      }
    }
    function sizeOf(f) {
      const size = f?.metadata?.size;
      if (!size || typeof size !== "number") return "";
      if (size < 1024) return `${size} B`;
      if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
      return `${(size / 1024 / 1024).toFixed(1)} MB`;
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "border rounded p-4 space-y-3" }, _attrs))}><div class="flex items-center justify-between"><h3 class="font-medium">${ssrInterpolate(unref(title))}</h3><button class="text-sm text-red-600">Remove</button></div><form class="flex items-center gap-2"><input type="file"${ssrIncludeBooleanAttr(unref(uploading)) ? " disabled" : ""}><button class="bg-gray-800 text-white px-3 py-1 rounded disabled:opacity-50"${ssrIncludeBooleanAttr(unref(uploading)) ? " disabled" : ""}>${ssrInterpolate(unref(uploading) ? "Uploading..." : "Upload")}</button></form><ul class="space-y-1"><!--[-->`);
      ssrRenderList(unref(files), (f) => {
        _push(`<li class="flex items-center gap-2"><a class="text-blue-600 underline"${ssrRenderAttr("href", f.path)} target="_blank">${ssrInterpolate(fileName(f.path))}</a>`);
        if (sizeOf(f)) {
          _push(`<span class="text-gray-400 text-xs">(${ssrInterpolate(sizeOf(f))})</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<button class="text-red-600 text-sm ml-auto">Delete</button></li>`);
      });
      _push(`<!--]--></ul></div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../components/AttachmentsModule.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[slug]",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const activeTab = ref("messages");
    const project = ref(null);
    const todoModules = ref([]);
    ref("");
    function tabClass(tab) {
      return [
        "px-3 py-2 rounded border",
        activeTab.value === tab ? "bg-black text-white" : "bg-white"
      ];
    }
    function removeModule(key) {
      todoModules.value = todoModules.value.filter((m) => m.key !== key);
    }
    function updateModuleListId(key, id) {
      const m = todoModules.value.find((m2) => m2.key === key);
      if (m) m.listId = id;
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "p-6" }, _attrs))}><div class="flex items-center justify-between"><div><h1 class="text-2xl font-semibold">${ssrInterpolate(unref(project)?.name)}</h1><p class="text-gray-500">/${ssrInterpolate(unref(route).params.slug)}</p></div><div class="flex gap-2"><button class="${ssrRenderClass(tabClass("messages"))}">Messages</button><button class="${ssrRenderClass(tabClass("todos"))}">Todos</button><button class="${ssrRenderClass(tabClass("roadmap"))}">Road Map</button><button class="${ssrRenderClass(tabClass("files"))}">Files</button></div></div><div class="mt-6">`);
      if (unref(activeTab) === "messages") {
        _push(ssrRenderComponent(MessageBoard, {
          "project-id": unref(project)?.id || 0
        }, null, _parent));
      } else if (unref(activeTab) === "todos") {
        _push(`<div class="space-y-4"><div class="flex justify-between items-center"><h2 class="text-xl font-semibold">Todo Modules</h2><button class="bg-black text-white px-3 py-2 rounded">Add module</button></div><div class="grid md:grid-cols-2 gap-6"><!--[-->`);
        ssrRenderList(unref(todoModules), (mod) => {
          _push(ssrRenderComponent(_sfc_main$3, {
            key: mod.key,
            "project-id": unref(project)?.id || 0,
            "list-id": mod.listId,
            title: mod.title,
            onCreated: (id) => updateModuleListId(mod.key, id),
            onRemove: ($event) => removeModule(mod.key)
          }, null, _parent));
        });
        _push(`<!--]--></div></div>`);
      } else if (unref(activeTab) === "roadmap") {
        _push(`<div class="space-y-4"><h2 class="text-xl font-semibold">Road Map</h2>`);
        _push(ssrRenderComponent(_sfc_main$2, {
          "project-id": unref(project)?.id || 0
        }, null, _parent));
        _push(`</div>`);
      } else {
        _push(`<div class="space-y-4"><h2 class="text-xl font-semibold">Files</h2><div class="grid md:grid-cols-2 gap-6">`);
        _push(ssrRenderComponent(_sfc_main$1, {
          "project-id": unref(project)?.id || 0,
          scope: "shared"
        }, null, _parent));
        _push(ssrRenderComponent(_sfc_main$1, {
          "project-id": unref(project)?.id || 0,
          scope: "private"
        }, null, _parent));
        _push(`</div></div>`);
      }
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/projects/[slug].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_slug_-C77utPWD.mjs.map
