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

    <form class="flex flex-col md:flex-row gap-2" @submit.prevent="addEntry">
      <input v-model="description" placeholder="Short description" class="border rounded-md px-2 py-1 flex-1" />
      <input v-model="dateStr" type="date" class="border rounded-md px-2 py-1" />
      <button class="bg-gray-800 text-white px-2 py-1 rounded-md">Add</button>
    </form>

    <div class="w-full overflow-x-auto">
      <svg :viewBox="`0 0 ${TW} ${TH}`" class="w-full min-w-[600px]" preserveAspectRatio="xMidYMid meet">
        <line :x1="P" :x2="TW-P" :y1="BASE" :y2="BASE" stroke="#111827" stroke-width="2" />
        <template v-for="(e, idx) in sortedEntries" :key="idx">
          <g :transform="`translate(${dateToX(e.date)},0)`" class="cursor-pointer" @click="remove(idx)">
            <line :x1="0" :x2="0" :y1="BASE" :y2="BASE-32" stroke="#6b7280" stroke-width="2" />
            <circle :cx="0" :cy="BASE-34" r="5" fill="#111827" />
            <text :x="0" :y="BASE-44" text-anchor="middle" class="fill-gray-800" style="font-size: 10px;">
              {{ shortDate(e.date) }}
            </text>
            <text :x="0" :y="BASE-58" text-anchor="middle" class="fill-gray-700" style="font-size: 11px;">
              {{ e.description }}
            </text>
          </g>
        </template>
      </svg>
    </div>

    <div
      class="absolute right-1 bottom-1 w-4 h-4 cursor-se-resize"
      style="border-right: 2px solid #9ca3af; border-bottom: 2px solid #9ca3af;"
      @mousedown.stop="startResize"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ snap?: boolean }>()
import { useSnapGridStore, GRID } from '~~/stores/snapGrid'
const gridStore = useSnapGridStore()
const uid = Math.random().toString(36).slice(2)
function roundToStep(v: number, s: number) { return Math.round(v / s) * s }
function applySnap() {
  if (!props.snap) return
  size.w = GRID.colWidth
  size.h = GRID.rowHeight
  const desired = gridStore.colRowFromPx(position.x, position.y)
  const cell = gridStore.requestSnap(props.uid, desired)
  const px = gridStore.pxFromColRow(cell.col, cell.row)
  position.x = px.x
  position.y = px.y
}
type Entry = { description: string; date: string }

const title = ref('Road Map')
const description = ref('')
const dateStr = ref('')
const entries = ref<Entry[]>([])

const sortedEntries = computed(() => entries.value.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))

function addEntry() {
  if (!description.value || !dateStr.value) return
  entries.value.push({ description: description.value, date: dateStr.value })
  description.value = ''
  dateStr.value = ''
}
function remove(idx: number) {
  entries.value.splice(idx, 1)
}
function shortDate(d: string) {
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return d
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// timeline constants and helpers
const TW = 800
const TH = 140
const P = 32
const BASE = 100

const minDate = computed(() => {
  if (entries.value.length === 0) return null as Date | null
  return new Date(Math.min(...entries.value.map(e => new Date(e.date).getTime())))
})
const maxDate = computed(() => {
  if (entries.value.length === 0) return null as Date | null
  return new Date(Math.max(...entries.value.map(e => new Date(e.date).getTime())))
})

function dateToX(d: string) {
  const date = new Date(d)
  if (!minDate.value || !maxDate.value) return TW / 2
  const min = minDate.value.getTime()
  const max = maxDate.value.getTime()
  if (max === min) return (TW - 2 * P) / 2 + P
  const t = (date.getTime() - min) / (max - min)
  return P + t * (TW - 2 * P)
}

// Drag + Resize behavior
const interactive = ref(true)
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
    position.x = dragState.originX + (e.clientX - dragState.startX)
    position.y = dragState.originY + (e.clientY - dragState.startY)
  } else if (resizeState.resizing) {
    const nextW = Math.max(300, resizeState.originW + (e.clientX - resizeState.startX))
    const nextH = Math.max(220, resizeState.originH + (e.clientY - resizeState.startY))
    size.w = nextW
    size.h = nextH
  }
}
function onMouseUp() {
  dragState.dragging = false
  resizeState.resizing = false
  interactive.value = true
  applySnap()
  if (!props.snap) {
    try { localStorage.setItem(`mod.freepos:${props.uid}`, JSON.stringify({ x: position.x, y: position.y, w: size.w, h: size.h })) } catch {}
  }
  if (pressTimerId.value !== null) {
    clearTimeout(pressTimerId.value)
    pressTimerId.value = null
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
  if (e.button !== 0) return
  dragState.startX = e.clientX
  dragState.startY = e.clientY
  dragState.originX = position.x
  dragState.originY = position.y
  pressTimerId.value = window.setTimeout(() => {
    dragState.dragging = true
    interactive.value = false
  }, DRAG_HOLD_MS)
}

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
  if (props.snap) {
    const cell = gridStore.cells[props.uid]
    if (cell) {
      size.w = GRID.colWidth
      size.h = GRID.rowHeight
      const px = gridStore.pxFromColRow(cell.col, cell.row)
      position.x = px.x
      position.y = px.y
    } else {
      applySnap()
    }
  } else {
    try {
      const raw = localStorage.getItem(`mod.freepos:${props.uid}`)
      if (raw) {
        const p = JSON.parse(raw)
        if (typeof p?.x === 'number') position.x = p.x
        if (typeof p?.y === 'number') position.y = p.y
        if (typeof p?.w === 'number') size.w = p.w
        if (typeof p?.h === 'number') size.h = p.h
      }
    } catch {}
  }
})
watch(() => props.snap, (snap) => {
  if (snap) {
    size.w = GRID.colWidth
    size.h = GRID.rowHeight
    const cell = gridStore.cells[props.uid]
    if (cell) {
      const px = gridStore.pxFromColRow(cell.col, cell.row)
      position.x = px.x
      position.y = px.y
    } else {
      applySnap()
    }
  } else {
    try {
      const raw = localStorage.getItem(`mod.freepos:${props.uid}`)
      if (raw) {
        const p = JSON.parse(raw)
        if (typeof p?.x === 'number') position.x = p.x
        if (typeof p?.y === 'number') position.y = p.y
        if (typeof p?.w === 'number') size.w = p.w
        if (typeof p?.h === 'number') size.h = p.h
      }
    } catch {}
  }
})

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
  const cell = gridStore.cells[uid]
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
</script>



