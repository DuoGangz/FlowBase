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
    <ul class="space-y-1">
      <li v-for="(it, idx) in items" :key="idx" class="flex items-center gap-2">
        <input type="checkbox" v-model="it.done" />
        <span :class="{ 'line-through text-gray-500': it.done }">{{ it.content }}</span>
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
const props = defineProps<{ snap?: boolean }>()

// Snap grid config (invisible): 2 columns x 3 rows style
const GRID = { colWidth: 360, rowHeight: 240, gutterX: 16, gutterY: 16 }
function roundToStep(v: number, step: number) { return Math.round(v / step) * step }
function applySnap() {
  if (!props.snap) return
  size.w = GRID.colWidth
  size.h = GRID.rowHeight
  const stepX = GRID.colWidth + GRID.gutterX
  const stepY = GRID.rowHeight + GRID.gutterY
  position.x = roundToStep(position.x, stepX)
  position.y = roundToStep(position.y, stepY)
}
const title = ref('Todo List')
const items = ref<{ content:string; done:boolean }[]>([])
const newItem = ref('')
const interactive = ref(true)

// drag + resize state
const position = reactive({ x: 0, y: 0 })
const size = reactive({ w: 320, h: 260 })
const dragState = reactive({ dragging: false, startX: 0, startY: 0, originX: 0, originY: 0 })
const resizeState = reactive({ resizing: false, startX: 0, startY: 0, originW: 0, originH: 0 })

const wrapperStyle = computed(() => ({
  width: size.w + 'px',
  height: size.h + 'px',
  transform: `translate(${position.x}px, ${position.y}px)`,
  position: 'relative'
}))

const wrapperClass = computed(() => [
  'border rounded-2xl p-4 space-y-3 shadow bg-white overflow-hidden',
  dragState.dragging ? 'select-none cursor-grabbing' : 'select-text cursor-default'
])

function onMouseMove(e: MouseEvent) {
  if (dragState.dragging) {
    position.x = dragState.originX + (e.clientX - dragState.startX)
    position.y = dragState.originY + (e.clientY - dragState.startY)
  } else if (resizeState.resizing) {
    const nextW = Math.max(260, resizeState.originW + (e.clientX - resizeState.startX))
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
  // prepare potential drag; only start after hold
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
})
watch(() => props.snap, () => applySnap())
onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
})

function addItem() {
  if (!newItem.value) return
  items.value.push({ content: newItem.value, done: false })
  newItem.value = ''
}
</script>


