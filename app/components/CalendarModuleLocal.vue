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

    <div class="flex items-center gap-2">
      <button class="px-2 py-1 border rounded-md" @click="prevMonth">&lt;</button>
      <div class="font-medium">{{ monthLabel }}</div>
      <button class="px-2 py-1 border rounded-md" @click="nextMonth">&gt;</button>
    </div>

    <div class="grid grid-cols-7 gap-1 text-center select-none">
      <div class="text-xs text-gray-500" v-for="d in daysShort" :key="d">{{ d }}</div>
      <div
        v-for="day in gridDays"
        :key="day.key"
        class="h-8 flex items-center justify-center rounded-md"
        :class="day.inMonth ? 'bg-gray-50' : 'bg-white text-gray-400'"
      >
        {{ day.date.getDate() }}
      </div>
    </div>

    <div
      class="absolute right-1 bottom-1 w-4 h-4 cursor-se-resize"
      style="border-right: 2px solid #9ca3af; border-bottom: 2px solid #9ca3af;"
      @mousedown.stop="startResize"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ snap?: boolean; uid: string }>()
import { useSnapGridStore, GRID } from '~~/stores/snapGrid'
const gridStore = useSnapGridStore()
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
type GridDay = { date: Date; inMonth: boolean; key: string }

const uid = Math.random().toString(36).slice(2)
const title = ref('Calendar')
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

const daysShort = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const viewDate = ref(new Date())
const monthLabel = computed(() => viewDate.value.toLocaleString(undefined, { month: 'long', year: 'numeric' }))
const gridDays = computed<GridDay[]>(() => {
  const first = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth(), 1)
  const start = new Date(first)
  start.setDate(first.getDate() - first.getDay())
  const days: GridDay[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    days.push({ date: d, inMonth: d.getMonth() === viewDate.value.getMonth(), key: d.toISOString() })
  }
  return days
})

function prevMonth() {
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() - 1, 1)
}
function nextMonth() {
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() + 1, 1)
}

function onMouseMove(e: MouseEvent) {
  if (dragState.dragging) {
    position.x = dragState.originX + (e.clientX - dragState.startX)
    position.y = dragState.originY + (e.clientY - dragState.startY)
  } else if (resizeState.resizing) {
    const nextW = Math.max(300, resizeState.originW + (e.clientX - resizeState.startX))
    const nextH = Math.max(260, resizeState.originH + (e.clientY - resizeState.startY))
    size.w = nextW
    size.h = nextH
  }
}
function onMouseUp() {
  dragState.dragging = false
  resizeState.resizing = false
  interactive.value = true
  applySnap()
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
onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  gridStore.release(props.uid)
})
</script>



