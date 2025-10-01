<template>
  <div
    :class="wrapperClass"
    :style="wrapperStyle"
    @mousedown="onWrapperMouseDown"
  >
    <div class="flex items-center justify-between">
      <input v-model="title" class="font-medium w-full mr-2 border-b rounded-md px-2 py-1" />
      <div class="inline-flex items-center gap-2">
        <select v-model="scope" class="border rounded px-2 py-1 text-sm">
          <option value="shared">Shared</option>
          <option value="private">My Files</option>
        </select>
        <button class="text-sm text-red-600" @click="$emit('remove')">Remove</button>
      </div>
    </div>

    <form class="flex items-center gap-2" @submit.prevent="onUpload">
      <input ref="fileInput" type="file" :disabled="uploading" />
      <button class="bg-gray-800 text-white px-3 py-1 rounded disabled:opacity-50" :disabled="uploading">
        {{ uploading ? 'Uploading...' : 'Upload' }}
      </button>
    </form>

    <ul class="space-y-1">
      <li v-for="f in files" :key="f.id" class="flex items-center gap-2">
        <a class="text-blue-600 underline" :href="f.path" target="_blank">{{ fileName(f.path) }}</a>
        <span class="text-gray-400 text-xs" v-if="sizeOf(f)">({{ sizeOf(f) }})</span>
        <button class="text-red-600 text-sm ml-auto" @click="remove(f)">Delete</button>
      </li>
    </ul>

    <!-- Resize handle -->
    <div
      class="absolute right-1 bottom-1 w-4 h-4 cursor-se-resize"
      style="border-right: 2px solid #9ca3af; border-bottom: 2px solid #9ca3af;"
      @mousedown.stop="startResize"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ snap?: boolean; uid: string; projectId?: number }>()
import { useSnapGridStore, GRID } from '~~/stores/snapGrid'
const gridStore = useSnapGridStore()

const title = ref('Attachments')
const scope = ref<'shared' | 'private'>('shared')
const files = ref<any[]>([])
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

// drag + resize state
const position = reactive({ x: 0, y: 0 })
const size = reactive({ w: GRID.colWidth, h: GRID.rowHeight * 2 })
const dragState = reactive({ dragging: false, startX: 0, startY: 0, originX: 0, originY: 0 })
const resizeState = reactive({ resizing: false, startX: 0, startY: 0, originW: 0, originH: 0 })
const DRAG_HOLD_MS = 200
const pressTimerId = ref<number | null>(null)

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

function applySnap() {
  if (!props.snap) return
  size.w = GRID.colWidth
  size.h = GRID.rowHeight * 2
  const desired = gridStore.colRowFromPx(position.x, position.y)
  const cell = gridStore.requestSnap(props.uid, desired)
  const px = gridStore.pxFromColRow(cell.col, cell.row)
  position.x = px.x
  position.y = px.y
}

function onWrapperMouseDown(e: MouseEvent) {
  if (e.button !== 0) return
  dragState.startX = e.clientX
  dragState.startY = e.clientY
  dragState.originX = position.x
  dragState.originY = position.y
  pressTimerId.value = window.setTimeout(() => { dragState.dragging = true }, DRAG_HOLD_MS)
}
function startResize(e: MouseEvent) {
  resizeState.resizing = true
  resizeState.startX = e.clientX
  resizeState.startY = e.clientY
  resizeState.originW = size.w
  resizeState.originH = size.h
}
function onMouseMove(e: MouseEvent) {
  if (dragState.dragging) {
    position.x = dragState.originX + (e.clientX - dragState.startX)
    position.y = dragState.originY + (e.clientY - dragState.startY)
  } else if (resizeState.resizing) {
    size.w = Math.max(260, resizeState.originW + (e.clientX - resizeState.startX))
    size.h = Math.max(220, resizeState.originH + (e.clientY - resizeState.startY))
  }
}
function onMouseUp() {
  dragState.dragging = false
  resizeState.resizing = false
  if (pressTimerId.value !== null) { clearTimeout(pressTimerId.value); pressTimerId.value = null }
  if (props.snap) applySnap()
}

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
  if (props.snap) applySnap()
  load()
})
onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  gridStore.release(props.uid)
})
watch(() => gridStore.cells[props.uid], (cell) => {
  if (!props.snap || !cell) return
  if (dragState.dragging || resizeState.resizing) return
  size.w = GRID.colWidth
  size.h = GRID.rowHeight * 2
  const px = gridStore.pxFromColRow(cell.col, cell.row)
  position.x = px.x
  position.y = px.y
})
watch(scope, load)

async function load() {
  const projId = await defaultProjectId()
  if (!projId) { files.value = []; return }
  files.value = await $fetch(`/api/files/${projId}?scope=${scope.value}`)
}

async function onUpload() {
  const projId = await defaultProjectId()
  if (!projId || !fileInput.value || !fileInput.value.files || fileInput.value.files.length === 0) return
  const file = fileInput.value.files[0]
  const fd = new FormData()
  fd.append('file', file)
  uploading.value = true
  try {
    const created = await $fetch(`/api/files/${projId}?scope=${scope.value}`, { method: 'POST', body: fd })
    files.value.unshift(created)
    if (fileInput.value) fileInput.value.value = ''
  } finally {
    uploading.value = false
  }
}

async function remove(f: any) {
  const projId = await defaultProjectId()
  if (!projId) return
  await $fetch(`/api/files/${projId}?id=${f.id}`, { method: 'DELETE' })
  files.value = files.value.filter(x => x.id !== f.id)
}

function fileName(p: string) {
  try { return p.split('/').filter(Boolean).pop() || p } catch { return p }
}
function sizeOf(f: any) {
  const size = f?.metadata?.size
  if (!size || typeof size !== 'number') return ''
  if (size < 1024) return `${size} B`
  if (size < 1024*1024) return `${Math.round(size/1024)} KB`
  return `${(size/1024/1024).toFixed(1)} MB`
}

// Very simple default project: pick first available
async function defaultProjectId(): Promise<number | null> {
  try {
    const projects = await $fetch<any[]>(`/api/projects`)
    const first = projects?.[0]
    return first?.id || null
  } catch { return null }
}
</script>


