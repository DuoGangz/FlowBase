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

    <div class="space-y-2">
      <div class="text-sm text-gray-600">Today: {{ todayLabel }}</div>
      <div class="grid grid-cols-2 gap-2">
        <button class="px-3 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50" :disabled="!!entry?.clockIn" @click="record('clockIn')">Clock In</button>
        <button class="px-3 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50" :disabled="!entry?.clockIn || !!entry?.lunchOut" @click="record('lunchOut')">Lunch Out</button>
        <button class="px-3 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50" :disabled="!entry?.lunchOut || !!entry?.lunchIn" @click="record('lunchIn')">Lunch In</button>
        <button class="px-3 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50" :disabled="!entry?.clockIn || !!entry?.clockOut" @click="record('clockOut')">Clock Out</button>
      </div>

      <div class="text-sm space-y-1">
        <div>Clock In: <span class="font-medium">{{ formatTime(entry?.clockIn) || '-' }}</span></div>
        <div>Lunch Out: <span class="font-medium">{{ formatTime(entry?.lunchOut) || '-' }}</span></div>
        <div>Lunch In: <span class="font-medium">{{ formatTime(entry?.lunchIn) || '-' }}</span></div>
        <div>Clock Out: <span class="font-medium">{{ formatTime(entry?.clockOut) || '-' }}</span></div>
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
import { useUserStore } from '~~/stores/user'
import { useSnapGridStore, GRID } from '~~/stores/snapGrid'
const props = defineProps<{ snap?: boolean; uid: string }>()
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

type Entry = {
  id: number
  userId: number
  date: string
  clockIn?: string | null
  lunchOut?: string | null
  lunchIn?: string | null
  clockOut?: string | null
}

const user = useUserStore()
const meServer = ref<{ id:number } | null>(null)
const userId = computed(() => meServer.value?.id ?? user.id)
const title = ref('Time Clock')
const entry = ref<Entry | null>(null)

const todayLabel = computed(() => new Date().toLocaleDateString())

async function fetchToday() {
  const items = await $fetch<Entry[]>('/api/time-entries', { query: { userId: userId.value } })
  const today = new Date()
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  entry.value = items.find(it => new Date(it.date).getTime() === todayUtc) || null
}

function formatTime(iso?: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

async function record(action: 'clockIn' | 'lunchOut' | 'lunchIn' | 'clockOut') {
  const tzOffsetMinutes = new Date().getTimezoneOffset()
  const res = await $fetch<{ ok: boolean; entry: Entry }>(
    '/api/time-entries',
    { method: 'POST', body: { userId: userId.value, action, tzOffsetMinutes } }
  )
  entry.value = res.entry
}

onMounted(async () => {
  try { meServer.value = await $fetch('/api/auth/me') } catch { meServer.value = null }
  fetchToday()
})

// Drag/Resize behavior similar to other local modules
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
    const nextW = Math.max(280, resizeState.originW + (e.clientX - resizeState.startX))
    const nextH = Math.max(200, resizeState.originH + (e.clientY - resizeState.startY))
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
</script>



