import { defineComponent, ref, computed, watch, mergeProps, unref, createVNode, resolveDynamicComponent, reactive, nextTick, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderAttr, ssrIncludeBooleanAttr, ssrRenderComponent, ssrInterpolate, ssrRenderList, ssrRenderClass, ssrRenderStyle, ssrRenderVNode, ssrLooseContain, ssrLooseEqual } from 'vue/server-renderer';
import { defineStore } from 'pinia';
import { u as useUserStore } from './user-CDPif6pO.mjs';

const GRID = {
  colWidth: 540,
  // +20%
  rowHeight: 360,
  // +20%
  gutterX: 16,
  gutterY: 16,
  COLS: 3,
  ROWS: 3,
  get stepX() {
    return this.colWidth + this.gutterX;
  },
  get stepY() {
    return this.rowHeight + this.gutterY;
  }
};
const useSnapGridStore = defineStore("snapGrid", () => {
  const cellToId = ref({});
  const cells = ref({});
  const maxCols = ref(3);
  const version = ref(0);
  function updateMaxCols(containerPx) {
    const width = containerPx ?? (void 0).innerWidth;
    maxCols.value = Math.max(1, Math.floor((width + GRID.gutterX) / GRID.stepX)) || 3;
  }
  function key(col, row) {
    return `${col},${row}`;
  }
  function release(id) {
    const cell = cells.value[id];
    if (!cell) return;
    delete cells.value[id];
    delete cellToId.value[key(cell.col, cell.row)];
  }
  function isFree(col, row, ignoreId) {
    const k = key(col, row);
    const id = cellToId.value[k];
    return !id || id === ignoreId;
  }
  function placeAt(id, col, row) {
    release(id);
    const k = key(col, row);
    cellToId.value[k] = id;
    cells.value[id] = { col, row };
  }
  function nextCell(from) {
    let { col, row } = from;
    col++;
    if (col >= GRID.COLS) {
      col = 0;
      row++;
    }
    return { col, row };
  }
  function requestSnap(id, desired) {
    console.log(`[SNAP] ${id} requesting cell (${desired.col}, ${desired.row})`);
    updateMaxCols();
    if (isFree(desired.col, desired.row, id)) {
      console.log(`[SNAP] Cell (${desired.col}, ${desired.row}) is free, placing ${id}`);
      placeAt(id, desired.col, desired.row);
      return { ...cells.value[id] };
    }
    const victimId = cellToId.value[key(desired.col, desired.row)];
    console.log(`[SNAP] Cell (${desired.col}, ${desired.row}) occupied by: ${victimId}`);
    if (!victimId) {
      console.log(`[SNAP] No victim found, placing ${id}`);
      placeAt(id, desired.col, desired.row);
      return { ...cells.value[id] };
    }
    let probe = nextCell(desired);
    while (!isFree(probe.col, probe.row, victimId)) {
      probe = nextCell(probe);
      if (probe.row > 1e3) {
        console.log(`[SNAP] No space found for ${victimId}, keeping original position`);
        return { ...cells.value[id] };
      }
    }
    console.log(`[SNAP] Moving ${victimId} from (${desired.col}, ${desired.row}) to (${probe.col}, ${probe.row})`);
    placeAt(victimId, probe.col, probe.row);
    console.log(`[SNAP] Placing ${id} at (${desired.col}, ${desired.row})`);
    placeAt(id, desired.col, desired.row);
    const result = { ...cells.value[id] };
    console.log(`[SNAP] Final result for ${id}:`, result);
    return result;
  }
  function colRowFromPx(x, y) {
    const col = Math.max(0, Math.round(x / GRID.stepX));
    const row = Math.max(0, Math.round(y / GRID.stepY));
    return { col, row };
  }
  function pxFromColRow(col, row) {
    return { x: col * GRID.stepX, y: row * GRID.stepY };
  }
  function setSizePreset(preset) {
    if (preset === "small") {
      GRID.colWidth = 450;
      GRID.rowHeight = 300;
    } else if (preset === "medium") {
      GRID.colWidth = 540;
      GRID.rowHeight = 360;
    } else {
      GRID.colWidth = 660;
      GRID.rowHeight = 440;
    }
    const cloned = {};
    for (const id in cells.value) {
      const c = cells.value[id];
      if (c) cloned[id] = { ...c };
    }
    cells.value = cloned;
    version.value++;
  }
  return {
    cellToId,
    cells,
    maxCols,
    version,
    updateMaxCols,
    key,
    release,
    isFree,
    placeAt,
    nextCell,
    requestSnap,
    colRowFromPx,
    pxFromColRow,
    setSizePreset
  };
});
const _sfc_main$7 = /* @__PURE__ */ defineComponent({
  __name: "TodoModuleLocal",
  __ssrInlineRender: true,
  props: {
    snap: { type: Boolean },
    uid: {}
  },
  setup(__props) {
    const props = __props;
    const gridStore = useSnapGridStore();
    function applySnap() {
      console.log(`[TODO] applySnap called for ${props.uid}, snap=${props.snap}`);
      if (!props.snap) return;
      size.w = GRID.colWidth;
      size.h = GRID.rowHeight;
      const desired = gridStore.colRowFromPx(position.x, position.y);
      console.log(`[TODO] Current position: (${position.x}, ${position.y}) -> desired cell: (${desired.col}, ${desired.row})`);
      const cell = gridStore.requestSnap(props.uid, desired);
      const px = gridStore.pxFromColRow(cell.col, cell.row);
      console.log(`[TODO] Final position: (${px.x}, ${px.y})`);
      position.x = px.x;
      position.y = px.y;
    }
    const title = ref("Todo List");
    const items = ref([]);
    const view = ref("inprogress");
    const newItem = ref("");
    ref(true);
    const subDraft = reactive({});
    const showSubForm = reactive({});
    const dragOverItemIdx = ref(null);
    ref(null);
    ref(null);
    reactive({ type: null });
    const pointerSub = reactive(
      { active: false, parentIdx: null, currentIdx: null, overIdx: null }
    );
    const position = reactive({ x: 0, y: 0 });
    const size = reactive({ w: GRID.colWidth, h: GRID.rowHeight });
    const dragState = reactive({ dragging: false, startX: 0, startY: 0, originX: 0, originY: 0 });
    const resizeState = reactive({ resizing: false, startX: 0, startY: 0, originW: 0, originH: 0 });
    const wrapperStyle = computed(() => ({
      width: size.w + "px",
      height: size.h + "px",
      transform: `translate(${position.x}px, ${position.y}px)`,
      position: props.snap ? "absolute" : "relative",
      top: props.snap ? "0px" : "auto",
      left: props.snap ? "0px" : "auto",
      boxSizing: "border-box"
    }));
    const wrapperClass = computed(() => [
      "border rounded-2xl p-2 space-y-2 shadow bg-white overflow-hidden",
      dragState.dragging ? "select-none cursor-grabbing z-50" : "select-text cursor-default"
    ]);
    ref(null);
    watch(() => props.snap, () => applySnap());
    watch(() => gridStore.cells[props.uid], (cell) => {
      if (!props.snap || !cell) return;
      if (dragState.dragging || resizeState.resizing) return;
      size.w = GRID.colWidth;
      size.h = GRID.rowHeight;
      const px = gridStore.pxFromColRow(cell.col, cell.row);
      position.x = px.x;
      position.y = px.y;
    });
    watch(() => gridStore.version, () => {
      if (!props.snap) return;
      size.w = GRID.colWidth;
      size.h = GRID.rowHeight;
      const cell = gridStore.cells[props.uid];
      if (cell) {
        const px = gridStore.pxFromColRow(cell.col, cell.row);
        position.x = px.x;
        position.y = px.y;
      }
    });
    function visibleSubItems(it) {
      if (it.done) return [];
      return it.subItems ?? [];
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: unref(wrapperClass),
        style: unref(wrapperStyle)
      }, _attrs))}><div class="flex items-center justify-between"><input${ssrRenderAttr("value", unref(title))} class="font-medium w-full mr-2 border-b rounded-md px-2 py-1"><button class="text-sm text-red-600">Remove</button></div><form class="flex gap-2"><input${ssrRenderAttr("value", unref(newItem))} placeholder="Add item" class="border rounded-md px-2 py-1 flex-1"><button class="bg-gray-800 text-white px-2 py-1 rounded-md">Add</button></form><ul class="space-y-2">`);
      if (unref(view) === "inprogress" ? !Boolean(_ctx.it?.done) : Boolean(_ctx.it?.done)) {
        _push(`<!--[-->`);
        ssrRenderList(unref(items), (it, idx) => {
          _push(`<li draggable="true" class="${ssrRenderClass([{ "bg-gray-50 rounded": unref(dragOverItemIdx) === idx }, "space-y-1"])}"><div class="flex items-center gap-2"><input type="checkbox"${ssrIncludeBooleanAttr(Boolean(it?.done)) ? " checked" : ""}><span class="${ssrRenderClass({ "line-through text-gray-500": Boolean(it?.done) })}">${ssrInterpolate(it?.content ?? "")}</span><div class="ml-auto inline-flex gap-1"><button class="px-2 py-0.5 border rounded text-xs">↑</button><button class="px-2 py-0.5 border rounded text-xs">↓</button></div></div><div class="pl-6 space-y-2"><ul class="space-y-1"><!--[-->`);
          ssrRenderList(visibleSubItems(it), (sub, sIdx) => {
            _push(`<li class="${ssrRenderClass([{ "bg-gray-50 rounded": unref(pointerSub).active && unref(pointerSub).parentIdx === idx && unref(pointerSub).overIdx === sIdx }, "flex items-center gap-2 cursor-move"])}"><input type="checkbox"${ssrIncludeBooleanAttr(Boolean(sub?.done)) ? " checked" : ""}><span class="${ssrRenderClass({ "line-through text-gray-400": Boolean(sub?.done) })}">${ssrInterpolate(sub?.content ?? "")}</span><div class="ml-auto inline-flex gap-1"><button class="px-2 py-0.5 border rounded text-xs">↑</button><button class="px-2 py-0.5 border rounded text-xs">↓</button></div></li>`);
          });
          _push(`<!--]--></ul>`);
          if (unref(showSubForm)[idx] && !it.done) {
            _push(`<form class="flex gap-2"><input${ssrRenderAttr("value", unref(subDraft)[idx])} placeholder="Add subtask" class="border rounded-md px-2 py-1 flex-1"><button class="border px-2 py-1 rounded-md">Add</button></form>`);
          } else {
            _push(`<!---->`);
          }
          if (!it.done) {
            _push(`<button type="button" class="w-8 h-8 rounded-full border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center"${ssrRenderAttr("aria-label", unref(showSubForm)[idx] ? "Hide subtask input" : "Add subtask")}><span class="text-lg leading-none">+</span></button>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></li>`);
        });
        _push(`<!--]-->`);
      } else {
        _push(`<!---->`);
      }
      _push(`</ul><div class="mt-2"><div class="inline-flex border rounded overflow-hidden"><button class="${ssrRenderClass([unref(view) === "inprogress" ? "bg-black text-white" : "", "px-2 py-1 text-xs"])}">In Progress</button><button class="${ssrRenderClass([unref(view) === "completed" ? "bg-black text-white" : "", "px-2 py-1 text-xs"])}">Completed</button></div></div><div class="absolute right-1 bottom-1 w-4 h-4 cursor-se-resize" style="${ssrRenderStyle({ "border-right": "2px solid #9ca3af", "border-bottom": "2px solid #9ca3af" })}"></div></div>`);
    };
  }
});
const _sfc_setup$7 = _sfc_main$7.setup;
_sfc_main$7.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/TodoModuleLocal.vue");
  return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
const TodoModuleLocal = Object.assign(_sfc_main$7, { __name: "TodoModuleLocal" });
const _sfc_main$6 = /* @__PURE__ */ defineComponent({
  __name: "CalendarModuleLocal",
  __ssrInlineRender: true,
  props: {
    snap: { type: Boolean },
    uid: {}
  },
  setup(__props) {
    const props = __props;
    const gridStore = useSnapGridStore();
    function applySnap() {
      if (!props.snap) return;
      size.w = GRID.colWidth;
      size.h = GRID.rowHeight;
      const desired = gridStore.colRowFromPx(position.x, position.y);
      const cell = gridStore.requestSnap(props.uid, desired);
      const px = gridStore.pxFromColRow(cell.col, cell.row);
      position.x = px.x;
      position.y = px.y;
    }
    Math.random().toString(36).slice(2);
    const title = ref("Calendar");
    const events = ref([]);
    function formatDateKey(d) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    }
    function eventsByDay(d) {
      const key = formatDateKey(d);
      return events.value.filter((e) => formatDateKey(e.at) === key);
    }
    ref(true);
    const position = reactive({ x: 0, y: 0 });
    const size = reactive({ w: GRID.colWidth, h: GRID.rowHeight });
    const dragState = reactive({ dragging: false, startX: 0, startY: 0, originX: 0, originY: 0 });
    const resizeState = reactive({ resizing: false, startX: 0, startY: 0, originW: 0, originH: 0 });
    const wrapperStyle = computed(() => ({
      width: size.w + "px",
      height: size.h + "px",
      transform: `translate(${position.x}px, ${position.y}px)`,
      position: props.snap ? "absolute" : "relative",
      top: props.snap ? "0px" : "auto",
      left: props.snap ? "0px" : "auto",
      boxSizing: "border-box"
    }));
    const wrapperClass = computed(() => [
      "border rounded-2xl p-2 space-y-2 shadow bg-white overflow-hidden",
      dragState.dragging ? "select-none cursor-grabbing z-50" : "select-text cursor-default"
    ]);
    const daysShort = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    const viewDate = ref(/* @__PURE__ */ new Date());
    const selectedDate = ref(/* @__PURE__ */ new Date());
    const viewMode = ref("month");
    const monthLabel = computed(() => viewDate.value.toLocaleString(void 0, { month: "long", year: "numeric" }));
    function startOfWeek(d) {
      const s = new Date(d);
      s.setHours(0, 0, 0, 0);
      s.setDate(s.getDate() - s.getDay());
      return s;
    }
    function endOfWeek(d) {
      const e = startOfWeek(d);
      e.setDate(e.getDate() + 6);
      return e;
    }
    const headerLabel = computed(() => {
      if (viewMode.value === "month") return monthLabel.value;
      if (viewMode.value === "week") {
        const s = startOfWeek(viewDate.value);
        const e = endOfWeek(viewDate.value);
        const sLabel = s.toLocaleDateString(void 0, { month: "short", day: "numeric" });
        const eLabel = e.toLocaleDateString(void 0, { month: "short", day: "numeric", year: s.getFullYear() === e.getFullYear() ? "numeric" : "numeric" });
        return `${sLabel} – ${eLabel}`;
      }
      return selectedDate.value.toLocaleDateString(void 0, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
    });
    const dayHeaderLabel = computed(() => selectedDate.value.toLocaleDateString(void 0, { weekday: "long", month: "long", day: "numeric", year: "numeric" }));
    const gridDays = computed(() => {
      const first = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth(), 1);
      const start = new Date(first);
      start.setDate(first.getDate() - first.getDay());
      const days = [];
      for (let i = 0; i < 42; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        days.push({ date: d, inMonth: d.getMonth() === viewDate.value.getMonth(), key: d.toISOString() });
      }
      return days;
    });
    const weekDays = computed(() => {
      const start = startOfWeek(viewDate.value);
      const days = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        days.push({ date: d, inMonth: d.getMonth() === viewDate.value.getMonth(), key: d.toISOString() });
      }
      return days;
    });
    const visibleDays = computed(() => viewMode.value === "week" ? weekDays.value : gridDays.value);
    function isSameDay(a, b) {
      return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    }
    function viewButtonClass(mode) {
      return [
        "px-2 py-1 border rounded-md",
        viewMode.value === mode ? "bg-black text-white" : "bg-white"
      ];
    }
    const eventsByDaySorted = (d) => {
      return [...eventsByDay(d)].sort((a, b) => a.at.getTime() - b.at.getTime());
    };
    function formatTime12h(dt) {
      try {
        return dt.toLocaleTimeString(void 0, { hour: "numeric", minute: "2-digit", hour12: true });
      } catch {
        return "";
      }
    }
    const daySlots = computed(() => {
      const slots = [];
      for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 15) {
          const dt = /* @__PURE__ */ new Date();
          dt.setHours(h, m, 0, 0);
          slots.push({
            hour: h,
            minute: m,
            label: dt.toLocaleTimeString(void 0, { hour: "numeric", minute: "2-digit", hour12: true }),
            hourLabel: dt.toLocaleTimeString(void 0, { hour: "numeric", hour12: true }),
            key: `s-${h}-${m}`
          });
        }
      }
      return slots;
    });
    function eventsBySlot(d, hour, minute) {
      return eventsByDaySorted(d).filter((e) => {
        const h = e.at.getHours();
        const m = Math.floor(e.at.getMinutes() / 15) * 15;
        return h === hour && m === minute;
      });
    }
    function unassignedEvents(d) {
      return eventsByDaySorted(d).filter((e) => e.at.getHours() === 0 && e.at.getMinutes() === 0);
    }
    ref(null);
    watch(() => props.snap, () => applySnap());
    watch(() => gridStore.cells[props.uid], (cell) => {
      if (!props.snap || !cell) return;
      if (dragState.dragging || resizeState.resizing) return;
      size.w = GRID.colWidth;
      size.h = GRID.rowHeight;
      const px = gridStore.pxFromColRow(cell.col, cell.row);
      position.x = px.x;
      position.y = px.y;
    });
    watch(() => gridStore.version, () => {
      if (!props.snap) return;
      size.w = GRID.colWidth;
      size.h = GRID.rowHeight;
      const cell = gridStore.cells[props.uid];
      if (cell) {
        const px = gridStore.pxFromColRow(cell.col, cell.row);
        position.x = px.x;
        position.y = px.y;
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: unref(wrapperClass),
        style: unref(wrapperStyle)
      }, _attrs))}><div class="flex items-center justify-between"><input${ssrRenderAttr("value", unref(title))} class="font-medium w-full mr-2 border-b rounded-md px-2 py-1"><button class="text-sm text-red-600">Remove</button></div><div class="flex items-center justify-between"><div class="flex items-center gap-2"><button class="px-2 py-1 border rounded-md">&lt;</button><div class="font-medium">${ssrInterpolate(unref(headerLabel))}</div><button class="px-2 py-1 border rounded-md">&gt;</button></div><div class="flex items-center gap-1"><button class="${ssrRenderClass(viewButtonClass("month"))}">Month</button><button class="${ssrRenderClass(viewButtonClass("week"))}">Week</button><button class="${ssrRenderClass(viewButtonClass("day"))}">Day</button></div></div>`);
      if (unref(viewMode) !== "day") {
        _push(`<div class="grid grid-cols-7 gap-1 text-center select-none"><!--[-->`);
        ssrRenderList(daysShort, (d) => {
          _push(`<div class="text-xs text-gray-500">${ssrInterpolate(d)}</div>`);
        });
        _push(`<!--]--><!--[-->`);
        ssrRenderList(unref(visibleDays), (day) => {
          _push(`<div class="${ssrRenderClass([[
            day.inMonth ? "bg-gray-50" : "bg-white text-gray-400",
            isSameDay(day.date, unref(selectedDate)) ? "ring-2 ring-blue-500" : ""
          ], "h-14 flex flex-col items-center justify-start rounded-md p-1 text-xs cursor-pointer"])}"><div class="w-full flex items-center justify-between"><div class="font-medium">${ssrInterpolate(day.date.getDate())}</div>`);
          if (eventsByDay(day.date).length) {
            _push(`<div class="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center">${ssrInterpolate(eventsByDay(day.date).length)}</div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<div class="space-y-2 select-none"><div class="text-sm text-gray-600">${ssrInterpolate(unref(dayHeaderLabel))}</div><div class="border rounded-md overflow-hidden">`);
        if (unassignedEvents(unref(selectedDate)).length) {
          _push(`<div class="bg-yellow-50 border-b px-3 py-2"><div class="text-xs font-medium text-gray-700">Time Unassigned</div><ul class="mt-1 space-y-1"><!--[-->`);
          ssrRenderList(unassignedEvents(unref(selectedDate)), (e) => {
            _push(`<li class="text-sm flex items-center gap-2"><span class="inline-block w-14 text-gray-400">--:--</span><span>${ssrInterpolate(e.title)}</span></li>`);
          });
          _push(`<!--]--></ul></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="max-h-72 overflow-y-auto"><ul><!--[-->`);
        ssrRenderList(unref(daySlots), (slot) => {
          _push(`<li class="${ssrRenderClass(["border-b last:border-b-0", slot.minute === 0 ? "border-gray-300" : "border-gray-100"])}"><div class="flex items-start"><div class="w-16 shrink-0 text-right pr-2 pt-2 text-xs text-gray-500">${ssrInterpolate(slot.minute === 0 ? slot.hourLabel : "")}</div><div class="flex-1 py-2">`);
          if (eventsBySlot(unref(selectedDate), slot.hour, slot.minute).length) {
            _push(`<ul class="space-y-1"><!--[-->`);
            ssrRenderList(eventsBySlot(unref(selectedDate), slot.hour, slot.minute), (e) => {
              _push(`<li class="text-sm flex items-center gap-2"><span class="inline-block w-14 text-gray-600">${ssrInterpolate(formatTime12h(e.at))}</span><span>${ssrInterpolate(e.title)}</span></li>`);
            });
            _push(`<!--]--></ul>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div></li>`);
        });
        _push(`<!--]--></ul></div></div></div>`);
      }
      _push(`<div class="absolute right-1 bottom-1 w-4 h-4 cursor-se-resize" style="${ssrRenderStyle({ "border-right": "2px solid #9ca3af", "border-bottom": "2px solid #9ca3af" })}"></div></div>`);
    };
  }
});
const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/CalendarModuleLocal.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
const CalendarModuleLocal = Object.assign(_sfc_main$6, { __name: "CalendarModuleLocal" });
const _sfc_main$5 = /* @__PURE__ */ defineComponent({
  __name: "ClockModuleLocal",
  __ssrInlineRender: true,
  props: {
    snap: { type: Boolean },
    uid: {}
  },
  setup(__props) {
    const props = __props;
    const gridStore = useSnapGridStore();
    function applySnap() {
      if (!props.snap) return;
      size.w = GRID.colWidth;
      size.h = GRID.rowHeight;
      const desired = gridStore.colRowFromPx(position.x, position.y);
      const cell = gridStore.requestSnap(props.uid, desired);
      const px = gridStore.pxFromColRow(cell.col, cell.row);
      position.x = px.x;
      position.y = px.y;
    }
    const user = useUserStore();
    const meServer = ref(null);
    computed(() => meServer.value?.id ?? user.id);
    const title = ref("Time Clock");
    const entry = ref(null);
    const todayLabel = computed(() => (/* @__PURE__ */ new Date()).toLocaleDateString());
    function formatTime(iso) {
      if (!iso) return "";
      return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    ref(true);
    const position = reactive({ x: 0, y: 0 });
    const size = reactive({ w: GRID.colWidth, h: GRID.rowHeight });
    const dragState = reactive({ dragging: false, startX: 0, startY: 0, originX: 0, originY: 0 });
    const resizeState = reactive({ resizing: false, startX: 0, startY: 0, originW: 0, originH: 0 });
    const wrapperStyle = computed(() => ({
      width: size.w + "px",
      height: size.h + "px",
      transform: `translate(${position.x}px, ${position.y}px)`,
      position: props.snap ? "absolute" : "relative",
      top: props.snap ? "0px" : "auto",
      left: props.snap ? "0px" : "auto",
      boxSizing: "border-box"
    }));
    const wrapperClass = computed(() => [
      "border rounded-2xl p-2 space-y-2 shadow bg-white overflow-hidden",
      dragState.dragging ? "select-none cursor-grabbing z-50" : "select-text cursor-default"
    ]);
    ref(null);
    watch(() => props.snap, () => applySnap());
    watch(() => gridStore.cells[props.uid], (cell) => {
      if (!props.snap || !cell) return;
      if (dragState.dragging || resizeState.resizing) return;
      size.w = GRID.colWidth;
      size.h = GRID.rowHeight;
      const px = gridStore.pxFromColRow(cell.col, cell.row);
      position.x = px.x;
      position.y = px.y;
    });
    watch(() => gridStore.version, () => {
      if (!props.snap) return;
      size.w = GRID.colWidth;
      size.h = GRID.rowHeight;
      const cell = gridStore.cells[props.uid];
      if (cell) {
        const px = gridStore.pxFromColRow(cell.col, cell.row);
        position.x = px.x;
        position.y = px.y;
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: unref(wrapperClass),
        style: unref(wrapperStyle)
      }, _attrs))}><div class="flex items-center justify-between"><input${ssrRenderAttr("value", unref(title))} class="font-medium w-full mr-2 border-b rounded-md px-2 py-1"><button class="text-sm text-red-600">Remove</button></div><div class="space-y-2"><div class="text-sm text-gray-600">Today: ${ssrInterpolate(unref(todayLabel))}</div><div class="grid grid-cols-2 gap-2"><button class="px-3 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50"${ssrIncludeBooleanAttr(!!unref(entry)?.clockIn) ? " disabled" : ""}>Clock In</button><button class="px-3 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50"${ssrIncludeBooleanAttr(!unref(entry)?.clockIn || !!unref(entry)?.lunchOut) ? " disabled" : ""}>Lunch Out</button><button class="px-3 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50"${ssrIncludeBooleanAttr(!unref(entry)?.lunchOut || !!unref(entry)?.lunchIn) ? " disabled" : ""}>Lunch In</button><button class="px-3 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50"${ssrIncludeBooleanAttr(!unref(entry)?.clockIn || !!unref(entry)?.clockOut) ? " disabled" : ""}>Clock Out</button></div><div class="text-sm space-y-1"><div>Clock In: <span class="font-medium">${ssrInterpolate(formatTime(unref(entry)?.clockIn) || "-")}</span></div><div>Lunch Out: <span class="font-medium">${ssrInterpolate(formatTime(unref(entry)?.lunchOut) || "-")}</span></div><div>Lunch In: <span class="font-medium">${ssrInterpolate(formatTime(unref(entry)?.lunchIn) || "-")}</span></div><div>Clock Out: <span class="font-medium">${ssrInterpolate(formatTime(unref(entry)?.clockOut) || "-")}</span></div></div></div><div class="absolute right-1 bottom-1 w-4 h-4 cursor-se-resize" style="${ssrRenderStyle({ "border-right": "2px solid #9ca3af", "border-bottom": "2px solid #9ca3af" })}"></div></div>`);
    };
  }
});
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ClockModuleLocal.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const ClockModuleLocal = Object.assign(_sfc_main$5, { __name: "ClockModuleLocal" });
const TW = 800;
const TH = 140;
const P = 32;
const BASE = 100;
const _sfc_main$4 = /* @__PURE__ */ defineComponent({
  __name: "RoadmapModuleLocal",
  __ssrInlineRender: true,
  props: {
    snap: { type: Boolean }
  },
  setup(__props) {
    const props = __props;
    const gridStore = useSnapGridStore();
    const uid = Math.random().toString(36).slice(2);
    function applySnap() {
      if (!props.snap) return;
      size.w = GRID.colWidth;
      size.h = GRID.rowHeight;
      const desired = gridStore.colRowFromPx(position.x, position.y);
      const cell = gridStore.requestSnap(props.uid, desired);
      const px = gridStore.pxFromColRow(cell.col, cell.row);
      position.x = px.x;
      position.y = px.y;
    }
    const title = ref("Road Map");
    const description = ref("");
    const dateStr = ref("");
    const entries = ref([]);
    const sortedEntries = computed(() => entries.value.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    function shortDate(d) {
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return d;
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
    ref(true);
    const position = reactive({ x: 0, y: 0 });
    const size = reactive({ w: GRID.colWidth, h: GRID.rowHeight });
    const dragState = reactive({ dragging: false, startX: 0, startY: 0, originX: 0, originY: 0 });
    const resizeState = reactive({ resizing: false, startX: 0, startY: 0, originW: 0, originH: 0 });
    const wrapperStyle = computed(() => ({
      width: size.w + "px",
      height: size.h + "px",
      transform: `translate(${position.x}px, ${position.y}px)`,
      position: props.snap ? "absolute" : "relative",
      top: props.snap ? "0px" : "auto",
      left: props.snap ? "0px" : "auto",
      boxSizing: "border-box"
    }));
    const wrapperClass = computed(() => [
      "border rounded-2xl p-2 space-y-2 shadow bg-white overflow-hidden",
      dragState.dragging ? "select-none cursor-grabbing z-50" : "select-text cursor-default"
    ]);
    ref(null);
    watch(() => props.snap, () => applySnap());
    watch(() => gridStore.cells[props.uid], (cell) => {
      if (!props.snap || !cell) return;
      if (dragState.dragging || resizeState.resizing) return;
      size.w = GRID.colWidth;
      size.h = GRID.rowHeight;
      const px = gridStore.pxFromColRow(cell.col, cell.row);
      position.x = px.x;
      position.y = px.y;
    });
    watch(() => gridStore.version, () => {
      if (!props.snap) return;
      size.w = GRID.colWidth;
      size.h = GRID.rowHeight;
      const cell = gridStore.cells[uid];
      if (cell) {
        const px = gridStore.pxFromColRow(cell.col, cell.row);
        position.x = px.x;
        position.y = px.y;
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: unref(wrapperClass),
        style: unref(wrapperStyle)
      }, _attrs))}><div class="flex items-center justify-between"><input${ssrRenderAttr("value", unref(title))} class="font-medium w-full mr-2 border-b rounded-md px-2 py-1"><button class="text-sm text-red-600">Remove</button></div><form class="flex flex-col md:flex-row gap-2"><input${ssrRenderAttr("value", unref(description))} placeholder="Short description" class="border rounded-md px-2 py-1 flex-1"><input${ssrRenderAttr("value", unref(dateStr))} type="date" class="border rounded-md px-2 py-1"><button class="bg-gray-800 text-white px-2 py-1 rounded-md">Add</button></form><div class="w-full overflow-x-auto"><svg${ssrRenderAttr("viewBox", `0 0 ${TW} ${TH}`)} class="w-full min-w-[600px]" preserveAspectRatio="xMidYMid meet"><line${ssrRenderAttr("x1", P)}${ssrRenderAttr("x2", TW - P)}${ssrRenderAttr("y1", BASE)}${ssrRenderAttr("y2", BASE)} stroke="#111827" stroke-width="2"></line><!--[-->`);
      ssrRenderList(unref(sortedEntries), (e, idx) => {
        _push(`<g${ssrRenderAttr("transform", `translate(${dateToX(e.date)},0)`)} class="cursor-pointer"><line${ssrRenderAttr("x1", 0)}${ssrRenderAttr("x2", 0)}${ssrRenderAttr("y1", BASE)}${ssrRenderAttr("y2", BASE - 32)} stroke="#6b7280" stroke-width="2"></line><circle${ssrRenderAttr("cx", 0)}${ssrRenderAttr("cy", BASE - 34)} r="5" fill="#111827"></circle><text${ssrRenderAttr("x", 0)}${ssrRenderAttr("y", BASE - 44)} text-anchor="middle" class="fill-gray-800" style="${ssrRenderStyle({ "font-size": "10px" })}">${ssrInterpolate(shortDate(e.date))}</text><text${ssrRenderAttr("x", 0)}${ssrRenderAttr("y", BASE - 58)} text-anchor="middle" class="fill-gray-700" style="${ssrRenderStyle({ "font-size": "11px" })}">${ssrInterpolate(e.description)}</text></g>`);
      });
      _push(`<!--]--></svg></div><div class="absolute right-1 bottom-1 w-4 h-4 cursor-se-resize" style="${ssrRenderStyle({ "border-right": "2px solid #9ca3af", "border-bottom": "2px solid #9ca3af" })}"></div></div>`);
    };
  }
});
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/RoadmapModuleLocal.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const RoadmapModuleLocal = Object.assign(_sfc_main$4, { __name: "RoadmapModuleLocal" });
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "AssignmentsModuleLocal",
  __ssrInlineRender: true,
  props: {
    snap: { type: Boolean },
    uid: {}
  },
  setup(__props) {
    const props = __props;
    const gridStore = useSnapGridStore();
    const position = reactive({ x: 0, y: 0 });
    const size = reactive({ w: GRID.colWidth, h: GRID.rowHeight });
    const dragState = reactive({ dragging: false, startX: 0, startY: 0, originX: 0, originY: 0 });
    const resizeState = reactive({ resizing: false, startX: 0, startY: 0, originW: 0, originH: 0 });
    const wrapperStyle = computed(() => ({
      width: size.w + "px",
      height: size.h + "px",
      transform: `translate(${position.x}px, ${position.y}px)`,
      position: props.snap ? "absolute" : "relative",
      top: props.snap ? "0px" : "auto",
      left: props.snap ? "0px" : "auto",
      boxSizing: "border-box"
    }));
    const wrapperClass = computed(() => [
      "border rounded-2xl p-2 shadow bg-white overflow-x-hidden overflow-y-auto relative",
      dragState.dragging ? "select-none cursor-grabbing z-50" : "select-text cursor-default"
    ]);
    watch(() => gridStore.cells[props.uid], (cell) => {
      if (!props.snap || !cell) return;
      if (dragState.dragging || resizeState.resizing) return;
      size.w = GRID.colWidth;
      size.h = Math.max(GRID.rowHeight, 320);
      const px = gridStore.pxFromColRow(cell.col, cell.row);
      position.x = px.x;
      position.y = px.y;
    });
    watch(() => gridStore.version, () => {
      if (!props.snap) return;
      size.w = GRID.colWidth;
      size.h = Math.max(GRID.rowHeight, 320);
      const cell = gridStore.cells[props.uid];
      if (cell) {
        const px = gridStore.pxFromColRow(cell.col, cell.row);
        position.x = px.x;
        position.y = px.y;
      }
    });
    const me = ref(null);
    const assignedToMe = ref([]);
    const authored = ref([]);
    const users = ref([]);
    const userMap = reactive({});
    const filteredUsers = computed(() => {
      if (!me.value) return [];
      if (!canAssign.value) return [];
      if (me.value.role === "OWNER" || me.value.role === "ADMIN_MANAGER") return users.value;
      return users.value.filter((u) => u.role !== "ADMIN");
    });
    const newTitle = ref("");
    const assigneeId = ref(0);
    const viewMode = ref("me");
    const dueDate = ref("");
    const dueTime = ref("");
    const recurrence = ref("");
    const canAssign = computed(() => me.value && (me.value.role === "OWNER" || me.value.role === "MANAGER" || me.value.role === "ADMIN_MANAGER"));
    const canCreate = computed(() => canAssign.value && newTitle.value.trim() && assigneeId.value > 0);
    async function loadAssignments() {
      assignedToMe.value = await $fetch(`/api/assignments?view=me`);
      if (canAssign.value) {
        authored.value = await $fetch(`/api/assignments?view=authored`);
      } else {
        authored.value = [];
      }
    }
    watch(viewMode, async () => {
      await loadAssignments();
    });
    function fmtDate(d) {
      if (!d) return "";
      try {
        const dd = new Date(d);
        const hasTime = dd.getHours() !== 0 || dd.getMinutes() !== 0 || dd.getSeconds() !== 0;
        if (!hasTime) return dd.toLocaleDateString();
        return dd.toLocaleString(void 0, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
      } catch {
        return "";
      }
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: unref(wrapperClass),
        style: unref(wrapperStyle)
      }, _attrs))}><div class="space-y-2 relative"><div class="flex flex-wrap items-end justify-between gap-2 pr-14"><h3 class="font-medium mr-2">Assignments</h3><div class="flex flex-wrap items-end gap-2 w-full md:w-auto order-3 md:order-2">`);
      if (unref(canAssign)) {
        _push(`<div class="order-3 md:order-2 flex flex-col gap-2 flex-1 min-w-[260px]"><div class="flex items-end gap-2 flex-1 min-w-[320px] flex-wrap md:flex-nowrap"><input${ssrRenderAttr("value", unref(newTitle))} placeholder="New task" class="border rounded px-2 h-8 text-sm w-40 md:w-48 flex-1"><div class="flex flex-col"><label class="text-[10px] leading-none uppercase tracking-wide text-gray-500 mb-1">Employee</label><select class="border rounded px-2 h-8 text-sm min-w-[140px]"><option${ssrRenderAttr("value", 0)}${ssrIncludeBooleanAttr(Array.isArray(unref(assigneeId)) ? ssrLooseContain(unref(assigneeId), 0) : ssrLooseEqual(unref(assigneeId), 0)) ? " selected" : ""}>Select user</option><!--[-->`);
        ssrRenderList(unref(filteredUsers), (u) => {
          _push(`<option${ssrRenderAttr("value", u.id)}${ssrIncludeBooleanAttr(Array.isArray(unref(assigneeId)) ? ssrLooseContain(unref(assigneeId), u.id) : ssrLooseEqual(unref(assigneeId), u.id)) ? " selected" : ""}>${ssrInterpolate(u.name)}</option>`);
        });
        _push(`<!--]--></select></div></div><div class="flex items-end gap-2 flex-wrap"><div class="flex items-end gap-2 order-1"><div class="flex flex-col"><label class="text-[10px] leading-none uppercase tracking-wide text-gray-500 mb-1">Date</label><input type="date"${ssrRenderAttr("value", unref(dueDate))} class="border rounded px-2 h-8 text-sm"></div><div class="flex flex-col"><label class="text-[10px] leading-none uppercase tracking-wide text-gray-500 mb-1">Time</label><input type="time"${ssrRenderAttr("value", unref(dueTime))} class="border rounded px-2 h-8 text-sm w-[110px]"></div></div><div class="flex flex-col order-2"><label class="text-[10px] leading-none uppercase tracking-wide text-gray-500 mb-1">Recurring</label><select class="border rounded px-2 h-8 text-sm min-w-[130px]"><option value=""${ssrIncludeBooleanAttr(Array.isArray(unref(recurrence)) ? ssrLooseContain(unref(recurrence), "") : ssrLooseEqual(unref(recurrence), "")) ? " selected" : ""}>One-time</option><option value="DAILY"${ssrIncludeBooleanAttr(Array.isArray(unref(recurrence)) ? ssrLooseContain(unref(recurrence), "DAILY") : ssrLooseEqual(unref(recurrence), "DAILY")) ? " selected" : ""}>Daily</option><option value="WEEKLY"${ssrIncludeBooleanAttr(Array.isArray(unref(recurrence)) ? ssrLooseContain(unref(recurrence), "WEEKLY") : ssrLooseEqual(unref(recurrence), "WEEKLY")) ? " selected" : ""}>Weekly</option><option value="BI_WEEKLY"${ssrIncludeBooleanAttr(Array.isArray(unref(recurrence)) ? ssrLooseContain(unref(recurrence), "BI_WEEKLY") : ssrLooseEqual(unref(recurrence), "BI_WEEKLY")) ? " selected" : ""}>Bi-Weekly</option><option value="MONTHLY"${ssrIncludeBooleanAttr(Array.isArray(unref(recurrence)) ? ssrLooseContain(unref(recurrence), "MONTHLY") : ssrLooseEqual(unref(recurrence), "MONTHLY")) ? " selected" : ""}>Monthly</option></select></div><div class="w-28 order-3"><button class="px-3 h-8 text-sm border rounded w-full"${ssrIncludeBooleanAttr(!unref(canCreate)) ? " disabled" : ""}>Assign</button></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div class="absolute top-1 right-2"><button class="text-sm text-red-600">Remove</button></div><div class="mt-1">`);
      if (!unref(canAssign) || unref(viewMode) === "me") {
        _push(`<div class="flex items-end justify-between mb-1"><div class="text-sm font-medium">Assigned to me</div><span class="text-xs font-bold text-gray-700 w-28 text-right">Due date</span></div>`);
      } else {
        _push(`<div class="flex items-end justify-between mb-1"><div class="text-sm font-medium">Assignments</div><div class="flex items-center gap-4"><span class="text-xs font-bold text-gray-700 w-40 text-right">Employee</span><span class="text-xs font-bold text-gray-700 w-28 text-right">Due date</span></div></div>`);
      }
      if (!unref(canAssign) || unref(viewMode) === "me") {
        _push(`<ul class="space-y-1"><!--[-->`);
        ssrRenderList(unref(assignedToMe), (a) => {
          _push(`<li class="flex items-center gap-2"><div class="flex items-center gap-2 min-w-0"><input type="checkbox"${ssrIncludeBooleanAttr(false) ? " checked" : ""}><span class="truncate">${ssrInterpolate(a.title)}</span></div><span class="text-xs text-gray-500 ml-auto w-28 text-right">${ssrInterpolate(fmtDate(a.dueDate))}</span></li>`);
        });
        _push(`<!--]-->`);
        if (unref(assignedToMe).length === 0) {
          _push(`<li class="text-sm text-gray-500">No assignments</li>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</ul>`);
      } else {
        _push(`<ul class="space-y-1"><!--[-->`);
        ssrRenderList(unref(authored), (a) => {
          _push(`<li class="flex items-center justify-between gap-2"><div class="flex items-center gap-2 min-w-0"><span>•</span><span class="truncate">${ssrInterpolate(a.title)}</span></div><div class="flex items-center gap-4"><span class="text-xs text-gray-500 w-40 text-right truncate">${ssrInterpolate(unref(userMap)[a.assignedToId]?.name || a.assignedToId)}</span><span class="text-xs text-gray-500 w-28 text-right">${ssrInterpolate(fmtDate(a.dueDate))}</span></div></li>`);
        });
        _push(`<!--]-->`);
        if (unref(authored).length === 0) {
          _push(`<li class="text-sm text-gray-500">No pending authored assignments</li>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</ul>`);
      }
      _push(`</div></div>`);
      if (unref(canAssign)) {
        _push(`<div class="absolute left-2 bottom-2"><div class="inline-flex border rounded-full overflow-hidden shadow bg-white pointer-events-auto"><button class="${ssrRenderClass([unref(viewMode) === "me" ? "bg-black text-white" : "bg-white", "px-3 h-8 text-sm"])}">Assigned to me</button><button class="${ssrRenderClass([unref(viewMode) === "authored" ? "bg-black text-white" : "bg-white", "px-3 h-8 text-sm"])}">Assignments</button></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="absolute right-1 bottom-1 w-4 h-4 cursor-se-resize" style="${ssrRenderStyle({ "border-right": "2px solid #9ca3af", "border-bottom": "2px solid #9ca3af" })}"></div></div>`);
    };
  }
});
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/AssignmentsModuleLocal.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const AssignmentsModuleLocal = Object.assign(_sfc_main$3, { __name: "AssignmentsModuleLocal" });
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "AttachmentsModuleLocal",
  __ssrInlineRender: true,
  props: {
    snap: { type: Boolean },
    uid: {},
    projectId: {}
  },
  setup(__props) {
    const props = __props;
    const gridStore = useSnapGridStore();
    const title = ref("Attachments");
    const scope = ref("shared");
    const files = ref([]);
    const uploading = ref(false);
    ref(null);
    const error = ref("");
    const projects = ref([]);
    const selectedProjectId = ref(null);
    const position = reactive({ x: 0, y: 0 });
    const size = reactive({ w: GRID.colWidth, h: GRID.rowHeight * 2 });
    const dragState = reactive({ dragging: false, startX: 0, startY: 0, originX: 0, originY: 0 });
    const resizeState = reactive({ resizing: false, startX: 0, startY: 0, originW: 0, originH: 0 });
    ref(null);
    const wrapperStyle = computed(() => ({
      width: size.w + "px",
      height: size.h + "px",
      transform: `translate(${position.x}px, ${position.y}px)`,
      position: props.snap ? "absolute" : "relative",
      top: props.snap ? "0px" : "auto",
      left: props.snap ? "0px" : "auto",
      boxSizing: "border-box"
    }));
    const wrapperClass = computed(() => [
      "border rounded-2xl p-2 space-y-2 shadow bg-white overflow-hidden",
      dragState.dragging ? "select-none cursor-grabbing z-50" : "select-text cursor-default"
    ]);
    watch(() => gridStore.cells[props.uid], (cell) => {
      if (!props.snap || !cell) return;
      if (dragState.dragging || resizeState.resizing) return;
      size.w = GRID.colWidth;
      size.h = GRID.rowHeight * 2;
      const px = gridStore.pxFromColRow(cell.col, cell.row);
      position.x = px.x;
      position.y = px.y;
    });
    watch(scope, load);
    watch(selectedProjectId, load);
    async function load() {
      error.value = "";
      const projId = selectedProjectId.value || null;
      if (!projId) {
        files.value = [];
        return;
      }
      try {
        files.value = await $fetch(`/api/files/${projId}?scope=${scope.value}`);
      } catch (e) {
        error.value = e?.data?.message || e?.message || "Failed to load files";
      }
    }
    function fileName(p) {
      try {
        return p.split("/").filter(Boolean).pop() || p;
      } catch {
        return p;
      }
    }
    function sizeOf(f) {
      const size2 = f?.metadata?.size;
      if (!size2 || typeof size2 !== "number") return "";
      if (size2 < 1024) return `${size2} B`;
      if (size2 < 1024 * 1024) return `${Math.round(size2 / 1024)} KB`;
      return `${(size2 / 1024 / 1024).toFixed(1)} MB`;
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: unref(wrapperClass),
        style: unref(wrapperStyle)
      }, _attrs))}><div class="flex items-center justify-between"><input${ssrRenderAttr("value", unref(title))} class="font-medium w-full mr-2 border-b rounded-md px-2 py-1"><div class="inline-flex items-center gap-2"><select class="border rounded px-2 py-1 text-sm"><!--[-->`);
      ssrRenderList(unref(projects), (p) => {
        _push(`<option${ssrRenderAttr("value", p.id)}${ssrIncludeBooleanAttr(Array.isArray(unref(selectedProjectId)) ? ssrLooseContain(unref(selectedProjectId), p.id) : ssrLooseEqual(unref(selectedProjectId), p.id)) ? " selected" : ""}>${ssrInterpolate(p.name)}</option>`);
      });
      _push(`<!--]--></select><select class="border rounded px-2 py-1 text-sm"><option value="shared"${ssrIncludeBooleanAttr(Array.isArray(unref(scope)) ? ssrLooseContain(unref(scope), "shared") : ssrLooseEqual(unref(scope), "shared")) ? " selected" : ""}>Shared</option><option value="private"${ssrIncludeBooleanAttr(Array.isArray(unref(scope)) ? ssrLooseContain(unref(scope), "private") : ssrLooseEqual(unref(scope), "private")) ? " selected" : ""}>My Files</option></select><button class="text-sm text-red-600">Remove</button></div></div><form class="flex items-center gap-2"><input type="file"${ssrIncludeBooleanAttr(unref(uploading)) ? " disabled" : ""}><button class="bg-gray-800 text-white px-3 py-1 rounded disabled:opacity-50"${ssrIncludeBooleanAttr(unref(uploading)) ? " disabled" : ""}>${ssrInterpolate(unref(uploading) ? "Uploading..." : "Upload")}</button></form><ul class="space-y-1"><!--[-->`);
      ssrRenderList(unref(files), (f) => {
        _push(`<li class="flex items-center gap-2"><a class="text-blue-600 underline"${ssrRenderAttr("href", f.path)} target="_blank">${ssrInterpolate(fileName(f.path))}</a>`);
        if (sizeOf(f)) {
          _push(`<span class="text-gray-400 text-xs">(${ssrInterpolate(sizeOf(f))})</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<button class="text-red-600 text-sm ml-auto">Delete</button></li>`);
      });
      _push(`<!--]--></ul>`);
      if (unref(error)) {
        _push(`<div class="text-red-600 text-sm">${ssrInterpolate(unref(error))}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="absolute right-1 bottom-1 w-4 h-4 cursor-se-resize" style="${ssrRenderStyle({ "border-right": "2px solid #9ca3af", "border-bottom": "2px solid #9ca3af" })}"></div></div>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/AttachmentsModuleLocal.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const AttachmentsModuleLocal = Object.assign(_sfc_main$2, { __name: "AttachmentsModuleLocal" });
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "BannerCropper",
  __ssrInlineRender: true,
  props: {
    file: {},
    targetWidth: {},
    targetHeight: {}
  },
  emits: ["cancel", "confirm"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const imgUrl = ref(null);
    const naturalWidth = ref(0);
    const naturalHeight = ref(0);
    ref("image/jpeg");
    const ratio = computed(() => props.targetWidth / props.targetHeight);
    const displayWidth = computed(() => Math.min(1e3, Math.max(480, Math.min((void 0).innerWidth * 0.9, props.targetWidth))));
    const displayHeight = computed(() => Math.round(displayWidth.value / ratio.value));
    const scale = ref(1);
    const minScale = ref(0.2);
    const translate = reactive({ x: 0, y: 0 });
    const ready = ref(false);
    ref(null);
    ref(null);
    const zoomUi = computed({
      get: () => Math.round((scale.value - minScale.value) * 100),
      set: (v) => setScale(minScale.value + v / 100)
    });
    function setScale(next) {
      scale.value = Math.max(minScale.value, Math.min(5, next));
      clampTranslate();
    }
    function clampTranslate() {
      const sw = naturalWidth.value * scale.value;
      const sh = naturalHeight.value * scale.value;
      const fw = displayWidth.value;
      const fh = displayHeight.value;
      const minX = Math.min(0, fw - sw);
      const minY = Math.min(0, fh - sh);
      translate.x = Math.min(0, Math.max(minX, translate.x));
      translate.y = Math.min(0, Math.max(minY, translate.y));
    }
    const imgStyle = computed(() => ({
      position: "absolute",
      left: translate.x + "px",
      top: translate.y + "px",
      width: naturalWidth.value * scale.value + "px",
      height: naturalHeight.value * scale.value + "px"
    }));
    const crop = reactive({ x: 0, y: 0, w: 300, h: 100 });
    const handles = [
      { key: "tl", pos: "tl", style: { left: "-6px", top: "-6px", width: "12px", height: "12px", cursor: "nwse-resize" } },
      { key: "tr", pos: "tr", style: { right: "-6px", top: "-6px", width: "12px", height: "12px", cursor: "nesw-resize" } },
      { key: "bl", pos: "bl", style: { left: "-6px", bottom: "-6px", width: "12px", height: "12px", cursor: "nesw-resize" } },
      { key: "br", pos: "br", style: { right: "-6px", bottom: "-6px", width: "12px", height: "12px", cursor: "nwse-resize" } }
    ];
    const cropStyle = computed(() => ({
      left: crop.x + "px",
      top: crop.y + "px",
      width: crop.w + "px",
      height: crop.h + "px"
    }));
    reactive({ on: false, sx: 0, sy: 0, ox: 0, oy: 0 });
    reactive({ on: false, mode: "move", sx: 0, sy: 0, ox: 0, oy: 0, ow: 0, oh: 0 });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "fixed inset-0 z-50 bg-black/60 flex items-center justify-center" }, _attrs))}><div class="bg-white rounded-lg shadow-xl w-[92vw] max-w-5xl p-4"><div class="flex items-center justify-between mb-3"><h3 class="text-lg font-medium">Adjust Banner</h3><button class="px-2 py-1 border rounded">Cancel</button></div><div class="flex flex-col md:flex-row gap-4"><div class="flex-1"><div class="relative bg-gray-200 overflow-hidden mx-auto" style="${ssrRenderStyle({ width: unref(displayWidth) + "px", height: unref(displayHeight) + "px" })}">`);
      if (unref(imgUrl)) {
        _push(`<img${ssrRenderAttr("src", unref(imgUrl))} style="${ssrRenderStyle(unref(imgStyle))}" class="select-none pointer-events-none">`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="absolute border-2 border-white/90 shadow-[0_0_0_10000px_rgba(0,0,0,0.35)] cursor-move" style="${ssrRenderStyle(unref(cropStyle))}"><!--[-->`);
      ssrRenderList(handles, (h) => {
        _push(`<div class="absolute bg-white border border-gray-400" style="${ssrRenderStyle(h.style)}"></div>`);
      });
      _push(`<!--]--></div></div><div class="mt-3 flex flex-wrap items-center gap-2 md:gap-3 justify-end w-full"><label class="text-sm text-gray-600">Zoom</label><input type="range" min="0" max="200"${ssrRenderAttr("value", unref(zoomUi))} class="w-40 h-1.5"><button class="px-3 py-1 border rounded">Center</button><button class="px-3 py-1 border rounded">Change Image</button><input type="file" accept="image/*" class="hidden"><button class="px-3 py-1 rounded bg-black text-white disabled:opacity-50"${ssrIncludeBooleanAttr(!unref(ready)) ? " disabled" : ""}>Save</button></div></div></div></div></div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/BannerCropper.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const BannerCropper = Object.assign(_sfc_main$1, { __name: "BannerCropper" });
const bannerWidth = 1024;
const bannerHeight = 256;
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const modules = ref([]);
    const menuOpen = ref(false);
    const pageMenuOpen = ref(false);
    const pages = ref([]);
    const currentPageId = ref(null);
    const showCreateModal = ref(false);
    const newPageName = ref("");
    const me = useUserStore();
    const meServer = ref(null);
    const bannerUrl = ref(null);
    ref(null);
    const canEditBanner = computed(() => meServer.value ? meServer.value.role === "ADMIN" || meServer.value.role === "OWNER" : me.role === "ADMIN" || me.role === "OWNER");
    const siteTitle = ref("Home");
    const editingTitle = ref(false);
    const titleDraft = ref("Home");
    const cropFile = ref(null);
    const bannerMenuOpen = ref(false);
    const snapMode = ref(false);
    const gridStore = useSnapGridStore();
    const sizePreset = ref("medium");
    ref(null);
    const containerWidth = ref(GRID.COLS * GRID.colWidth + (GRID.COLS - 1) * GRID.gutterX);
    const containerHeight = ref(GRID.ROWS * GRID.rowHeight + (GRID.ROWS - 1) * GRID.gutterY);
    GRID.stepX;
    GRID.stepY;
    async function onCropConfirm(blob) {
      const fd = new FormData();
      const mime = blob.type || "image/jpeg";
      const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
      fd.append("file", new File([blob], `banner.${ext}`, { type: mime }));
      const res = await $fetch("/api/banner", { method: "POST", body: fd });
      bannerUrl.value = res.url;
      cropFile.value = null;
    }
    function removeModule(key) {
      modules.value = modules.value.filter((m) => m.key !== key);
      try {
        gridStore.release(key);
      } catch {
      }
      saveLayout();
    }
    const canManagePages = computed(() => meServer.value ? meServer.value.role === "OWNER" || meServer.value.role === "ADMIN" : me.role === "OWNER" || me.role === "ADMIN");
    async function loadPages() {
      pages.value = await $fetch("/api/home-pages");
      if (!currentPageId.value) {
        const personal = pages.value.find((p) => p.mine);
        const def = personal || pages.value.find((p) => p.isDefault) || pages.value[0];
        if (def) currentPageId.value = def.id;
      }
      if (currentPageId.value) await loadLayout(currentPageId.value);
    }
    async function loadLayout(id) {
      const page = await $fetch(`/api/home-pages/${id}`);
      modules.value = Array.isArray(page.layout?.modules) ? page.layout.modules : [];
      nextTick(() => {
        for (const mod of modules.value) {
          if (mod.cell && typeof mod.cell.col === "number" && typeof mod.cell.row === "number") {
            try {
              gridStore.placeAt(mod.key, mod.cell.col, mod.cell.row);
            } catch {
            }
          }
        }
      });
    }
    async function saveLayout() {
      if (!currentPageId.value) return;
      try {
        await $fetch(`/api/home-pages/${currentPageId.value}`, { method: "PUT", body: { layout: { modules: modules.value } } });
      } catch (e) {
        const status = e?.status || e?.response?.status;
        if (status === 403) {
          const proceed = confirm("You do not have permission to edit this page. Create a personal page and save your layout there?");
          if (!proceed) return;
          try {
            const created = await $fetch(`/api/home-pages`, { method: "POST", body: { name: me.name ? me.name + "’s Page" : "My Page", layout: { modules: modules.value } } });
            if (created?.id) {
              currentPageId.value = created.id;
              await loadPages();
              return;
            }
          } catch (err) {
            console.error("Failed to create personal page:", err);
            alert("Failed to create personal page. Please try again or contact an administrator.");
          }
        } else {
          console.error("Failed to save layout:", e);
          alert("Failed to save layout. Please try again or contact an administrator.");
        }
      }
    }
    function debounce(fn, ms) {
      let t;
      return ((...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
      });
    }
    const saveLayoutDebounced = debounce(saveLayout, 400);
    watch(() => gridStore.cells, (cells) => {
      const map = cells;
      let changed = false;
      modules.value = modules.value.map((m) => {
        const c = map[m.key];
        if (c && (!m.cell || m.cell.col !== c.col || m.cell.row !== c.row)) {
          changed = true;
          return { ...m, cell: { col: c.col, row: c.row } };
        }
        return m;
      });
      if (changed) saveLayoutDebounced();
    }, { deep: true });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "relative p-6 space-y-4" }, _attrs))}><div class="flex items-center justify-between gap-2 relative"><div class="w-full"><div class="relative mx-auto max-w-3xl border rounded-md h-40 flex items-end justify-center bg-gray-50 overflow-hidden">`);
      if (unref(bannerUrl)) {
        _push(`<img${ssrRenderAttr("src", unref(bannerUrl))} alt="Banner" class="w-full h-full object-cover">`);
      } else {
        _push(`<!---->`);
      }
      if (unref(canEditBanner)) {
        _push(`<div class="absolute bottom-2 right-2"><button class="w-6 h-6 border rounded-full bg-white/80 hover:bg-white flex items-center justify-center" aria-label="Banner options"><span class="text-base leading-none">...</span></button>`);
        if (unref(bannerMenuOpen)) {
          _push(`<div class="absolute right-0 bottom-8 w-40 bg-white border rounded-md shadow-md z-50"><button class="w-full text-left px-3 py-2 hover:bg-gray-50">Upload Image</button><button class="w-full text-left px-3 py-2 hover:bg-gray-50"${ssrIncludeBooleanAttr(!unref(bannerUrl)) ? " disabled" : ""}>Properties</button></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(canEditBanner)) {
        _push(`<input type="file" accept="image/*" class="hidden">`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (unref(cropFile)) {
        _push(ssrRenderComponent(BannerCropper, {
          file: unref(cropFile),
          "target-width": bannerWidth,
          "target-height": bannerHeight,
          onCancel: ($event) => cropFile.value = null,
          onConfirm: onCropConfirm
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="mx-auto max-w-3xl text-center mt-2">`);
      if (unref(canEditBanner) && unref(editingTitle)) {
        _push(`<form class="inline-flex items-center gap-2"><input${ssrRenderAttr("value", unref(titleDraft))} class="border rounded px-2 py-1"><button class="px-2 py-1 border rounded">Save</button><button class="px-2 py-1 border rounded" type="button">Cancel</button></form>`);
      } else {
        _push(`<h1 class="text-2xl font-semibold inline-flex items-center gap-2">${ssrInterpolate(unref(siteTitle))} `);
        if (unref(canEditBanner)) {
          _push(`<button class="text-sm underline">Edit</button>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</h1>`);
      }
      _push(`</div></div><div class="absolute right-4 -top-2 flex flex-col items-end gap-2"><div class="relative"><button class="bg-black text-white px-3 py-2 rounded" aria-label="Add module"><span class="font-bold text-xl leading-none">+</span></button>`);
      if (unref(menuOpen)) {
        _push(`<div class="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow-md z-50"><button class="w-full text-left px-3 py-2 hover:bg-gray-50">Todo</button><button class="w-full text-left px-3 py-2 hover:bg-gray-50">Calendar</button><button class="w-full text-left px-3 py-2 hover:bg-gray-50">Time Clock</button><button class="w-full text-left px-3 py-2 hover:bg-gray-50">Road Map</button><button class="w-full text-left px-3 py-2 hover:bg-gray-50">Assignments</button><button class="w-full text-left px-3 py-2 hover:bg-gray-50">Attachments</button></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="relative"><button class="w-8 h-8 border rounded bg-white hover:bg-gray-50 flex items-center justify-center" aria-label="Switch page"><span class="text-xl leading-none">▾</span></button>`);
      if (unref(pageMenuOpen)) {
        _push(`<div class="absolute right-0 mt-2 w-56 bg-white border rounded-md shadow-md z-50"><div class="px-3 py-2 text-xs text-gray-500">Home Pages</div><!--[-->`);
        ssrRenderList(unref(pages), (p) => {
          _push(`<button class="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between"><span class="${ssrRenderClass({ "font-semibold": p.id === unref(currentPageId) })}">${ssrInterpolate(p.name)}</span>`);
          if (p.id === unref(currentPageId)) {
            _push(`<span class="text-xs text-gray-500">current</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</button>`);
        });
        _push(`<!--]-->`);
        if (unref(canManagePages)) {
          _push(`<div class="border-t"><button class="w-full text-left px-3 py-2 hover:bg-gray-50 disabled:opacity-50"${ssrIncludeBooleanAttr(unref(pages).length >= 4) ? " disabled" : ""}>+ New Page</button></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div></div><div class="${ssrRenderClass([unref(snapMode) ? "" : "grid grid-cols-3 gap-4", "relative mx-auto"])}" style="${ssrRenderStyle(unref(snapMode) ? { height: unref(containerHeight) + "px", width: unref(containerWidth) + "px" } : void 0)}"><!--[-->`);
      ssrRenderList(unref(modules), (mod) => {
        ssrRenderVNode(_push, createVNode(resolveDynamicComponent(
          mod.type === "todo" ? TodoModuleLocal : mod.type === "calendar" ? CalendarModuleLocal : mod.type === "clock" ? ClockModuleLocal : mod.type === "roadmap" ? RoadmapModuleLocal : mod.type === "assignments" ? AssignmentsModuleLocal : AttachmentsModuleLocal
        ), {
          key: mod.key,
          snap: unref(snapMode),
          uid: mod.key,
          onRemove: ($event) => removeModule(mod.key)
        }, null), _parent);
      });
      _push(`<!--]--></div><div class="fixed bottom-4 right-4 z-50 flex items-center gap-3"><div class="fixed bottom-4 left-4"><div class="inline-flex border rounded-full overflow-hidden shadow bg-white"><button class="${ssrRenderClass([unref(sizePreset) === "small" ? "bg-black text-white" : "text-gray-700", "px-3 py-1 text-sm"])}">S</button><button class="${ssrRenderClass([unref(sizePreset) === "medium" ? "bg-black text-white" : "text-gray-700", "px-3 py-1 text-sm"])}">M</button><button class="${ssrRenderClass([unref(sizePreset) === "large" ? "bg-black text-white" : "text-gray-700", "px-3 py-1 text-sm"])}">L</button></div></div><div class="inline-flex border rounded-full overflow-hidden shadow bg-white"><button class="${ssrRenderClass([unref(snapMode) ? "text-gray-600" : "bg-black text-white", "px-3 py-1 text-sm"])}">Free Form</button><button class="${ssrRenderClass([unref(snapMode) ? "bg-black text-white" : "text-gray-600", "px-3 py-1 text-sm"])}">Snapping</button></div>`);
      if (unref(showCreateModal)) {
        _push(`<div class="fixed inset-0 bg-black/30 flex items-center justify-center z-50"><div class="bg-white rounded-md p-4 w-96 space-y-3"><h3 class="font-medium">Create New Home Page</h3><input${ssrRenderAttr("value", unref(newPageName))} placeholder="Page name" class="border rounded px-2 py-1 w-full"><div class="flex justify-end gap-2"><button class="px-3 py-1 border rounded">Cancel</button><button class="px-3 py-1 border rounded bg-black text-white"${ssrIncludeBooleanAttr(!unref(newPageName).trim()) ? " disabled" : ""}>Create</button></div></div></div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-eInbT6BX.mjs.map
