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
        :key="idx"
        class="space-y-1"
        draggable="true"
        @dragstart="onItemDragStart(idx)"
        @dragover.prevent="onItemDragOver(idx)"
        @drop.prevent="onItemDrop(idx)"
        :class="{ 'bg-gray-50 rounded': dragOverItemIdx===idx }"
      >
        <div class="flex items-center gap-2">
          <input type="checkbox" v-model="it.done" />
          <span :class="{ 'line-through text-gray-500': it.done }">{{ it.content }}</span>
          <div class="ml-auto inline-flex gap-1">
            <button class="px-2 py-0.5 border rounded text-xs" @click="moveItem(idx, -1)">↑</button>
            <button class="px-2 py-0.5 border rounded text-xs" @click="moveItem(idx, 1)">↓</button>
          </div>
        </div>
        <div class="pl-6 space-y-2">
          <ul class="space-y-1">
            <li
              v-for="(sub, sIdx) in visibleSubItems(it)"
              :key="sIdx"
              class="flex items-center gap-2"
              draggable="true"
              @dragstart="onSubDragStart(idx, sIdx)"
              @dragover.prevent="onSubDragOver(idx, sIdx)"
              @drop.prevent="onSubDrop(idx, sIdx)"
              :class="{ 'bg-gray-50 rounded': dragOverParentIdx===idx && dragOverSubIdx===sIdx }"
            >
              <input type="checkbox" v-model="sub.done" />
              <span :class="{ 'line-through text-gray-400': sub.done }">{{ sub.content }}</span>
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
type LocalSub = { content:string; done:boolean }
type LocalItem = { content:string; done:boolean; subItems?: LocalSub[] }
const items = ref<LocalItem[]>([])
const newItem = ref('')
const interactive = ref(true)
const subDraft = reactive<Record<number, string>>({})
const showSubForm = reactive<Record<number, boolean>>({})
const dragOverItemIdx = ref<number | null>(null)
const dragOverParentIdx = ref<number | null>(null)
const dragOverSubIdx = ref<number | null>(null)
const dndState = reactive<{ type:'item'|'sub'|null; itemIdx?:number; parentIdx?:number; subIdx?:number }>({ type: null })

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

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
  if (props.snap) applySnap()
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
  items.value.push({ content: newItem.value, done: false, subItems: [] })
  newItem.value = ''
}

function visibleSubItems(it: LocalItem) {
  if (it.done) return []
  return it.subItems ?? []
}

function addSubItem(idx: number) {
  const txt = subDraft[idx]
  if (!txt) return
  const it = items.value[idx]
  if (!it.subItems) it.subItems = []
  it.subItems.push({ content: txt, done: false })
  subDraft[idx] = ''
  showSubForm[idx] = false
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
}

function onItemDragStart(idx: number) {
  dndState.type = 'item'
  dndState.itemIdx = idx
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
}

function onSubDragStart(parentIdx: number, subIdx: number) {
  dndState.type = 'sub'
  dndState.parentIdx = parentIdx
  dndState.subIdx = subIdx
}
function onSubDragOver(parentIdx: number, subIdx: number) {
  dragOverParentIdx.value = parentIdx
  dragOverSubIdx.value = subIdx
}
function onSubDrop(parentIdx: number, subIdx: number) {
  if (dndState.type !== 'sub' || dndState.parentIdx !== parentIdx || dndState.subIdx === undefined) return
  if (dndState.subIdx === subIdx) return
  const parent = items.value[parentIdx]
  const arr = (parent.subItems ?? []).slice()
  const [moved] = arr.splice(dndState.subIdx, 1)
  arr.splice(subIdx, 0, moved)
  parent.subItems = arr
  dragOverParentIdx.value = null
  dragOverSubIdx.value = null
  dndState.type = null
}
</script>



