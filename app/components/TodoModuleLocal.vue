<template>
  <div
    :class="wrapperClass"
    :style="wrapperStyle"
    @mousedown="onWrapperMouseDown"
  >
    <div class="flex items-center justify-between">
      <input v-model="title" class="font-medium w-full mr-2 border-b rounded-md px-2 py-1" />
      <button class="text-sm text-red-600" @click="$emit('remove')">Remove</button>
    </div>
    <form class="flex gap-2" @submit.prevent="addItem">
      <input v-model="newItem" placeholder="Add item" class="border rounded-md px-2 py-1 flex-1" />
      <button class="bg-gray-800 text-white px-2 py-1 rounded-md">Add</button>
    </form>
    <ul class="space-y-2">
      <li
        v-for="(it, idx) in items"
        :key="it?.id ?? idx"
        class="space-y-1"
        v-if="(view==='inprogress' ? !Boolean(it?.done) : Boolean(it?.done))"
        draggable="true"
        @dragstart="onItemDragStart(idx, $event)"
        @dragover.prevent="onItemDragOver(idx)"
        @drop.prevent="onItemDrop(idx)"
        @mousedown.stop
        :class="{ 'bg-gray-50 rounded': dragOverItemIdx===idx }"
      >
        <div class="flex items-center gap-2">
          <input type="checkbox" :checked="Boolean(it?.done)" @change="(e:any)=>toggleItemCheckedLocal(idx, e?.target?.checked)" />
          <span :class="{ 'line-through text-gray-500': Boolean(it?.done) }">{{ it?.content ?? '' }}</span>
          <div class="ml-auto inline-flex gap-1">
            <button class="px-2 py-0.5 border rounded text-xs" @click="moveItem(idx, -1)">↑</button>
            <button class="px-2 py-0.5 border rounded text-xs" @click="moveItem(idx, 1)">↓</button>
          </div>
        </div>
        <div class="pl-6 space-y-2">
          <ul class="space-y-1">
            <li
              v-for="(sub, sIdx) in visibleSubItems(it)"
              :key="sub?.id ?? sIdx"
              class="flex items-center gap-2 cursor-move"
              @mousedown.stop="onSubPointerDown(idx, sIdx, $event)"
              :ref="el => setSubRef(idx, sIdx, el as HTMLElement)"
              :class="{ 'bg-gray-50 rounded': pointerSub.active && pointerSub.parentIdx===idx && pointerSub.overIdx===sIdx }"
            >
              <input type="checkbox" :checked="Boolean(sub?.done)" @change="(e:any)=>toggleSubItemCheckedLocal(idx, sIdx, e?.target?.checked)" />
              <span :class="{ 'line-through text-gray-400': Boolean(sub?.done) }">{{ sub?.content ?? '' }}</span>
              <div class="ml-auto inline-flex gap-1">
                <button class="px-2 py-0.5 border rounded text-xs" @click="moveSubItem(idx, sIdx, -1)">↑</button>
                <button class="px-2 py-0.5 border rounded text-xs" @click="moveSubItem(idx, sIdx, 1)">↓</button>
              </div>
            </li>
          </ul>
          <!-- Input appears after pressing plus -->
          <form v-if="showSubForm[idx] && !it.done" class="flex gap-2" @submit.prevent="addSubItem(idx)">
            <input v-model="subDraft[idx]" placeholder="Add subtask" class="border rounded-md px-2 py-1 flex-1" />
            <button class="border px-2 py-1 rounded-md">Add</button>
          </form>
          <!-- Plus icon always at the bottom -->
          <button
            v-if="!it.done"
            type="button"
            class="w-8 h-8 rounded-full border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center"
            :aria-label="showSubForm[idx] ? 'Hide subtask input' : 'Add subtask'"
            @click="toggleSubForm(idx)"
          >
            <span class="text-lg leading-none">+</span>
          </button>
        </div>
      </li>
    </ul>
    <div class="mt-2">
      <div class="inline-flex border rounded overflow-hidden">
        <button class="px-2 py-1 text-xs" :class="view==='inprogress' ? 'bg-black text-white' : ''" @click="(view='inprogress', saveLocal())">In Progress</button>
        <button class="px-2 py-1 text-xs" :class="view==='completed' ? 'bg-black text-white' : ''" @click="(view='completed', saveLocal())">Completed</button>
      </div>
    </div>

    <!-- Resize handle (bottom-right) -->
    <div
      class="absolute right-1 bottom-1 w-4 h-4 cursor-se-resize"
      style="border-right: 2px solid #9ca3af; border-bottom: 2px solid #9ca3af;"
      @mousedown.stop="startResize"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ snap?: boolean; uid: string }>()

// Snap grid config (invisible): 2 columns x 3 rows style
import { useSnapGridStore, GRID } from '~~/stores/snapGrid'
const gridStore = useSnapGridStore()
function roundToStep(v: number, step: number) { return Math.round(v / step) * step }
function applySnap() {
  console.log(`[TODO] applySnap called for ${props.uid}, snap=${props.snap}`)
  if (!props.snap) return
  size.w = GRID.colWidth
  size.h = GRID.rowHeight
  const desired = gridStore.colRowFromPx(position.x, position.y)
  console.log(`[TODO] Current position: (${position.x}, ${position.y}) -> desired cell: (${desired.col}, ${desired.row})`)
  const cell = gridStore.requestSnap(props.uid, desired)
  const px = gridStore.pxFromColRow(cell.col, cell.row)
  console.log(`[TODO] Final position: (${px.x}, ${px.y})`)
  position.x = px.x
  position.y = px.y
}
const title = ref('Todo List')
type LocalSub = { id:number; content:string; done:boolean }
type LocalItem = { id:number; content:string; done:boolean; subItems?: LocalSub[] }
const items = ref<LocalItem[]>([])
const view = ref<'inprogress' | 'completed'>('inprogress')
const newItem = ref('')
const interactive = ref(true)
const subDraft = reactive<Record<number, string>>({})
const showSubForm = reactive<Record<number, boolean>>({})
const dragOverItemIdx = ref<number | null>(null)
const dragOverParentIdx = ref<number | null>(null)
const dragOverSubIdx = ref<number | null>(null)
const dndState = reactive<{ type:'item'|'sub'|null; itemIdx?:number; parentIdx?:number; subIdx?:number }>({ type: null })

// Pointer-based DnD for subtasks (robust across browsers)
const pointerSub = reactive<{ active:boolean; parentIdx:number|null; currentIdx:number|null; overIdx:number|null }>(
  { active:false, parentIdx:null, currentIdx:null, overIdx:null }
)
const subItemEls = new Map<string, HTMLElement>()
function subKey(p:number, s:number) { return `${p}:${s}` }
function setSubRef(p:number, s:number, el: HTMLElement | null) {
  if (!el) { subItemEls.delete(subKey(p,s)); return }
  subItemEls.set(subKey(p,s), el)
}

// drag + resize state
const position = reactive({ x: 0, y: 0 })
const size = reactive({ w: GRID.colWidth, h: GRID.rowHeight })
const dragState = reactive({ dragging: false, startX: 0, startY: 0, originX: 0, originY: 0 })
const resizeState = reactive({ resizing: false, startX: 0, startY: 0, originW: 0, originH: 0 })

const wrapperStyle = computed(() => ({
  width: size.w + 'px',
  height: size.h + 'px',
  transform: `translate(${position.x}px, ${position.y}px)`,
  position: props.snap ? 'absolute' : 'relative',
  top: props.snap ? '0px' : 'auto',
  left: props.snap ? '0px' : 'auto',
  boxSizing: 'border-box'
}))

const wrapperClass = computed(() => [
  'border rounded-2xl p-2 space-y-2 shadow bg-white overflow-hidden',
  dragState.dragging ? 'select-none cursor-grabbing z-50' : 'select-text cursor-default'
])

function onMouseMove(e: MouseEvent) {
  if (dragState.dragging) {
    const newX = dragState.originX + (e.clientX - dragState.startX)
    const newY = dragState.originY + (e.clientY - dragState.startY)
    console.log(`[TODO] onMouseMove: dragging, updating position from (${position.x}, ${position.y}) to (${newX}, ${newY})`)
    position.x = newX
    position.y = newY
  } else if (resizeState.resizing) {
    const nextW = Math.max(260, resizeState.originW + (e.clientX - resizeState.startX))
    const nextH = Math.max(200, resizeState.originH + (e.clientY - resizeState.startY))
    size.w = nextW
    size.h = nextH
  }
}
function onMouseUp() {
  console.log(`[TODO] onMouseUp called, snap=${props.snap}`)
  dragState.dragging = false
  resizeState.resizing = false
  interactive.value = true
  if (pressTimerId.value !== null) {
    clearTimeout(pressTimerId.value)
    pressTimerId.value = null
  }
  if (props.snap) {
    console.log(`[TODO] Calling applySnap from onMouseUp`)
    applySnap()
  }
}

function startDrag(e: MouseEvent) {
  dragState.dragging = true
  dragState.startX = e.clientX
  dragState.startY = e.clientY
  dragState.originX = position.x
  dragState.originY = position.y
}

function startResize(e: MouseEvent) {
  resizeState.resizing = true
  resizeState.startX = e.clientX
  resizeState.startY = e.clientY
  resizeState.originW = size.w
  resizeState.originH = size.h
}

const DRAG_HOLD_MS = 200
const pressTimerId = ref<number | null>(null)

function onWrapperMouseDown(e: MouseEvent) {
  console.log(`[TODO] onWrapperMouseDown called`)
  if (e.button !== 0) return
  // prepare potential drag; only start after hold
  dragState.startX = e.clientX
  dragState.startY = e.clientY
  dragState.originX = position.x
  dragState.originY = position.y
  pressTimerId.value = window.setTimeout(() => {
    console.log(`[TODO] Starting drag after ${DRAG_HOLD_MS}ms`)
    dragState.dragging = true
    interactive.value = false
  }, DRAG_HOLD_MS)
}

function cancelWrapperPotentialDrag() {
  if (pressTimerId.value !== null) {
    clearTimeout(pressTimerId.value)
    pressTimerId.value = null
  }
}

// Local persistence (per-module) for home page version
function storageKey() { return `todoLocal:${props.uid}` }
function saveLocal() {
  try {
    const payload = JSON.stringify({ title: title.value, items: items.value, view: view.value })
    localStorage.setItem(storageKey(), payload)
  } catch {}
}
function loadLocal() {
  try {
    const raw = localStorage.getItem(storageKey())
    if (!raw) return
    const data = JSON.parse(raw)
    if (typeof data?.title === 'string') title.value = data.title
    if (Array.isArray(data?.items)) items.value = data.items
    if (data?.view === 'completed' || data?.view === 'inprogress') view.value = data.view
  } catch {}
}

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
  if (props.snap) applySnap()
  loadLocal()
})
watch(() => props.snap, () => applySnap())

watch(() => gridStore.cells[props.uid], (cell) => {
  if (!props.snap || !cell) return
  if (dragState.dragging || resizeState.resizing) return
  size.w = GRID.colWidth
  size.h = GRID.rowHeight
  const px = gridStore.pxFromColRow(cell.col, cell.row)
  position.x = px.x
  position.y = px.y
})
// React to size preset changes
watch(() => gridStore.version, () => {
  if (!props.snap) return
  size.w = GRID.colWidth
  size.h = GRID.rowHeight
  const cell = gridStore.cells[props.uid]
  if (cell) {
    const px = gridStore.pxFromColRow(cell.col, cell.row)
    position.x = px.x
    position.y = px.y
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  gridStore.release(props.uid)
})

function addItem() {
  if (!newItem.value) return
  items.value.push({ id: Date.now(), content: newItem.value, done: false, subItems: [] })
  newItem.value = ''
  saveLocal()
}

function visibleSubItems(it: LocalItem) {
  if (it.done) return []
  return it.subItems ?? []
}

function toggleItemCheckedLocal(idx: number, checked: boolean) {
  const it = items.value[idx]
  if (!it) return
  it.done = Boolean(checked)
  // auto-switch list so the item disappears from current view
  if (it.done && view.value === 'inprogress') view.value = 'completed'
  if (!it.done && view.value === 'completed') view.value = 'inprogress'
  saveLocal()
}

function addSubItem(idx: number) {
  const txt = subDraft[idx]
  if (!txt) return
  const it = items.value[idx]
  if (!it.subItems) it.subItems = []
  it.subItems.push({ id: Date.now() + Math.floor(Math.random()*1000), content: txt, done: false })
  subDraft[idx] = ''
  showSubForm[idx] = false
  saveLocal()
}

function toggleSubItemCheckedLocal(idx: number, sIdx: number, checked: boolean) {
  const it = items.value[idx]
  const sub = it?.subItems?.[sIdx]
  if (!sub) return
  sub.done = Boolean(checked)
  saveLocal()
}

function toggleSubForm(idx: number) {
  showSubForm[idx] = !showSubForm[idx]
}

function moveItem(idx: number, dir: 1 | -1) {
  const target = idx + dir
  if (target < 0 || target >= items.value.length) return
  const copy = items.value.slice()
  const [moved] = copy.splice(idx, 1)
  copy.splice(target, 0, moved)
  items.value = copy
  saveLocal()
}

function moveSubItem(parentIdx: number, subIdx: number, dir: 1 | -1) {
  const parent = items.value[parentIdx]
  if (!parent.subItems) parent.subItems = []
  const target = subIdx + dir
  if (target < 0 || target >= parent.subItems.length) return
  const arr = parent.subItems.slice()
  const [moved] = arr.splice(subIdx, 1)
  arr.splice(target, 0, moved)
  parent.subItems = arr
  saveLocal()
}

function onItemDragStart(idx: number, e: DragEvent) {
  dndState.type = 'item'
  dndState.itemIdx = idx
  cancelWrapperPotentialDrag()
  // Improve DnD fidelity in some browsers
  try { e.dataTransfer?.setData('text/plain', String(idx)) } catch {}
}
function onItemDragOver(idx: number) {
  dragOverItemIdx.value = idx
}
function onItemDrop(idx: number) {
  if (dndState.type !== 'item' || dndState.itemIdx === undefined) return
  if (dndState.itemIdx === idx) return
  const copy = items.value.slice()
  const [moved] = copy.splice(dndState.itemIdx, 1)
  copy.splice(idx, 0, moved)
  items.value = copy
  dragOverItemIdx.value = null
  dndState.type = null
  saveLocal()
}

function onSubDragStart(parentIdx: number, subIdx: number, e: DragEvent) {
  dndState.type = 'sub'
  dndState.parentIdx = parentIdx
  dndState.subIdx = subIdx
  cancelWrapperPotentialDrag()
  try { e.dataTransfer?.setData('text/plain', `${parentIdx}:${subIdx}`) } catch {}
}
function onSubListDragOver(e: DragEvent) {
  // Ensure the drop registers as a move action
  try { if (e && e.dataTransfer) e.dataTransfer.dropEffect = 'move' } catch {}
}

function onSubDragEnter(parentIdx: number, subIdx: number, e: DragEvent) {
  dragOverParentIdx.value = parentIdx
  dragOverSubIdx.value = subIdx
  try { if (e && e.dataTransfer) e.dataTransfer.dropEffect = 'move' } catch {}
}

function onSubDragOver(parentIdx: number, subIdx: number, e?: DragEvent) {
  dragOverParentIdx.value = parentIdx
  dragOverSubIdx.value = subIdx
  try { if (e && e.dataTransfer) e.dataTransfer.dropEffect = 'move' } catch {}
}
function onSubDrop(parentIdx: number, subIdx: number) {
  if (dndState.type !== 'sub' || dndState.parentIdx !== parentIdx || dndState.subIdx === undefined) return
  if (dndState.subIdx === subIdx) {
    dragOverParentIdx.value = null
    dragOverSubIdx.value = null
    dndState.type = null
    return
  }
  const parent = items.value[parentIdx]
  const arr = (parent.subItems ?? [])
  if (dndState.subIdx < 0 || dndState.subIdx >= arr.length || subIdx < 0 || subIdx >= arr.length) {
    dragOverParentIdx.value = null
    dragOverSubIdx.value = null
    dndState.type = null
    return
  }
  const copy = arr.slice()
  const [moved] = copy.splice(dndState.subIdx, 1)
  // If dropping below, account for removed index shift when target is after source
  copy.splice(subIdx, 0, moved)
  parent.subItems = copy
  dragOverParentIdx.value = null
  dragOverSubIdx.value = null
  dndState.type = null
  saveLocal()
}

function onSubDropToEnd(parentIdx: number) {
  if (dndState.type !== 'sub' || dndState.parentIdx !== parentIdx || dndState.subIdx === undefined) return
  const parent = items.value[parentIdx]
  const arr = (parent.subItems ?? [])
  if (dndState.subIdx < 0 || dndState.subIdx >= arr.length) return
  const copy = arr.slice()
  const [moved] = copy.splice(dndState.subIdx, 1)
  copy.push(moved)
  parent.subItems = copy
  dragOverParentIdx.value = null
  dragOverSubIdx.value = null
  dndState.type = null
  saveLocal()
}

function onSubDragEnd(parentIdx: number) {
  // If a drop target didn't fire, finalize using the last hovered index or push to end
  if (dndState.type === 'sub' && dndState.parentIdx === parentIdx && dndState.subIdx !== undefined) {
    const parent = items.value[parentIdx]
    const arr = (parent.subItems ?? [])
    if (dndState.subIdx >= 0 && dndState.subIdx < arr.length) {
      const copy = arr.slice()
      const [moved] = copy.splice(dndState.subIdx, 1)
      const target = (dragOverParentIdx.value === parentIdx && dragOverSubIdx.value != null)
        ? Math.max(0, Math.min(copy.length, dragOverSubIdx.value))
        : copy.length
      copy.splice(target, 0, moved)
      parent.subItems = copy
    }
  }
  dragOverParentIdx.value = null
  dragOverSubIdx.value = null
  dndState.type = null
}

function onSubPointerDown(parentIdx: number, subIdx: number, e: MouseEvent) {
  cancelWrapperPotentialDrag()
  pointerSub.active = true
  pointerSub.parentIdx = parentIdx
  pointerSub.currentIdx = subIdx
  pointerSub.overIdx = subIdx
  e.preventDefault()
  window.addEventListener('mousemove', onSubPointerMove)
  window.addEventListener('mouseup', onSubPointerUp)
}

function onSubPointerMove(e: MouseEvent) {
  if (!pointerSub.active || pointerSub.parentIdx === null || pointerSub.currentIdx === null) return
  // Compute over index by measuring centers; live-reorder array when crossing neighbors
  const parent = items.value[pointerSub.parentIdx]
  const subs = parent.subItems ?? []
  let bestIdx = 0
  let bestDist = Infinity
  for (let i = 0; i < subs.length; i++) {
    const el = subItemEls.get(subKey(pointerSub.parentIdx, i))
    if (!el) continue
    const r = el.getBoundingClientRect()
    const centerY = r.top + r.height / 2
    const d = Math.abs(e.clientY - centerY)
    if (d < bestDist) { bestDist = d; bestIdx = i }
  }
  if (bestIdx !== pointerSub.currentIdx) {
    const arr = (parent.subItems ?? []).slice()
    const [moved] = arr.splice(pointerSub.currentIdx, 1)
    arr.splice(bestIdx, 0, moved)
    parent.subItems = arr
    pointerSub.currentIdx = bestIdx
    pointerSub.overIdx = bestIdx
  } else {
    pointerSub.overIdx = bestIdx
  }
}

function onSubPointerUp() { cleanupPointer() }

function cleanupPointer() {
  pointerSub.active = false
  pointerSub.parentIdx = null
  pointerSub.currentIdx = null
  pointerSub.overIdx = null
  window.removeEventListener('mousemove', onSubPointerMove)
  window.removeEventListener('mouseup', onSubPointerUp)
  saveLocal()
}
</script>



