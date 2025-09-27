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

    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <button class="px-2 py-1 border rounded-md" @click="goPrev">&lt;</button>
        <div class="font-medium">{{ headerLabel }}</div>
        <button class="px-2 py-1 border rounded-md" @click="goNext">&gt;</button>
      </div>
      <div class="flex items-center gap-1">
        <button :class="viewButtonClass('month')" @click="setView('month')">Month</button>
        <button :class="viewButtonClass('week')" @click="setView('week')">Week</button>
        <button :class="viewButtonClass('day')" @click="setView('day')">Day</button>
      </div>
    </div>

    <div v-if="viewMode !== 'day'" class="grid grid-cols-7 gap-1 text-center select-none">
      <div class="text-xs text-gray-500" v-for="d in daysShort" :key="d">{{ d }}</div>
      <div
        v-for="day in visibleDays"
        :key="day.key"
        class="h-14 flex flex-col items-center justify-start rounded-md p-1 text-xs cursor-pointer"
        :class="[
          day.inMonth ? 'bg-gray-50' : 'bg-white text-gray-400',
          isSameDay(day.date, selectedDate) ? 'ring-2 ring-blue-500' : ''
        ]"
        @click="onSelectDay(day.date)"
      >
        <div class="w-full flex items-center justify-between">
          <div class="font-medium">{{ day.date.getDate() }}</div>
          <div v-if="eventsByDay(day.date).length" class="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center">
            {{ eventsByDay(day.date).length }}
          </div>
        </div>
      </div>
    </div>

    <div v-else class="space-y-2 select-none">
      <div class="text-sm text-gray-600">{{ dayHeaderLabel }}</div>
      <ul class="space-y-1">
        <li v-for="e in eventsByDaySorted(selectedDate)" :key="e.id" class="text-sm flex items-center gap-2">
          <span class="inline-block w-14 text-gray-600">{{ formatTime12h(e.at) }}</span>
          <span>{{ e.title }}</span>
        </li>
        <li v-if="!eventsByDay(selectedDate).length" class="text-sm text-gray-500">No items scheduled</li>
      </ul>
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
type CalEvent = { id:number; title:string; at: Date }
const events = ref<CalEvent[]>([])
function formatDateKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth()+1).padStart(2,'0')
  const day = String(d.getDate()).padStart(2,'0')
  return `${y}-${m}-${day}`
}
function eventsByDay(d: Date) {
  const key = formatDateKey(d)
  return events.value.filter(e => formatDateKey(e.at) === key)
}
async function loadAssignmentEvents() {
  try {
    const list = await $fetch<any[]>(`/api/assignments?view=me`)
    events.value = list
      .filter(a => !!a.dueDate && !a.completed)
      .map(a => ({ id: a.id, title: a.title, at: new Date(a.dueDate) }))
  } catch {}
}
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
const selectedDate = ref(new Date())
const viewMode = ref<'month' | 'week' | 'day'>('month')

const monthLabel = computed(() => viewDate.value.toLocaleString(undefined, { month: 'long', year: 'numeric' }))
function startOfWeek(d: Date) {
  const s = new Date(d)
  s.setHours(0,0,0,0)
  s.setDate(s.getDate() - s.getDay())
  return s
}
function endOfWeek(d: Date) {
  const e = startOfWeek(d)
  e.setDate(e.getDate() + 6)
  return e
}
const headerLabel = computed(() => {
  if (viewMode.value === 'month') return monthLabel.value
  if (viewMode.value === 'week') {
    const s = startOfWeek(viewDate.value)
    const e = endOfWeek(viewDate.value)
    const sLabel = s.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    const eLabel = e.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: s.getFullYear() === e.getFullYear() ? 'numeric' : 'numeric' })
    return `${sLabel} – ${eLabel}`
  }
  return selectedDate.value.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
})
const dayHeaderLabel = computed(() => selectedDate.value.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }))

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

const weekDays = computed<GridDay[]>(() => {
  const start = startOfWeek(viewDate.value)
  const days: GridDay[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    days.push({ date: d, inMonth: d.getMonth() === viewDate.value.getMonth(), key: d.toISOString() })
  }
  return days
})
const visibleDays = computed(() => viewMode.value === 'week' ? weekDays.value : gridDays.value)

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
function onSelectDay(d: Date) {
  selectedDate.value = new Date(d)
}

function setView(mode: 'month' | 'week' | 'day') {
  viewMode.value = mode
  if (mode === 'day') {
    selectedDate.value = new Date(viewDate.value)
  } else if (mode === 'week') {
    // align viewDate to current selectedDate's week for better UX
    viewDate.value = new Date(selectedDate.value)
  }
}

function viewButtonClass(mode: 'month' | 'week' | 'day') {
  return [
    'px-2 py-1 border rounded-md',
    viewMode.value === mode ? 'bg-black text-white' : 'bg-white'
  ]
}

function goPrev() {
  if (viewMode.value === 'month') {
    viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() - 1, 1)
  } else if (viewMode.value === 'week') {
    const d = new Date(viewDate.value)
    d.setDate(d.getDate() - 7)
    viewDate.value = d
  } else {
    const d = new Date(selectedDate.value)
    d.setDate(d.getDate() - 1)
    selectedDate.value = d
    viewDate.value = d
  }
}
function goNext() {
  if (viewMode.value === 'month') {
    viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() + 1, 1)
  } else if (viewMode.value === 'week') {
    const d = new Date(viewDate.value)
    d.setDate(d.getDate() + 7)
    viewDate.value = d
  } else {
    const d = new Date(selectedDate.value)
    d.setDate(d.getDate() + 1)
    selectedDate.value = d
    viewDate.value = d
  }
}

const eventsByDaySorted = (d: Date) => {
  return [...eventsByDay(d)].sort((a, b) => a.at.getTime() - b.at.getTime())
}
function formatTime12h(dt: Date) {
  try {
    return dt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })
  } catch {
    return ''
  }
}

// prev/next are handled by goPrev/goNext now

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
  loadAssignmentEvents()
  // Refresh calendar when a new assignment is created
  window.addEventListener('assignment-created', loadAssignmentEvents as any)
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
  window.removeEventListener('assignment-created', loadAssignmentEvents as any)
})
</script>



