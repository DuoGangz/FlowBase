<template>
  <div
    :class="wrapperClass"
    :style="wrapperStyle"
    @mousedown.capture="onActivate"
    @mousedown="onWrapperMouseDown"
  >
    <div class="flex items-center justify-between">
      <div class="flex-1 min-w-0 cursor-move">
        <span
          v-if="!editingTitle"
          class="font-medium inline-block mr-2 px-2 py-1 rounded hover:bg-gray-50 cursor-text truncate max-w-full"
          @mousedown.stop
          @click.stop="startEditTitle"
        >{{ title }}</span>
        <input
          v-else
          ref="titleInput"
          v-model="title"
          class="font-medium mr-2 border-b rounded-md px-2 py-1"
          @mousedown.stop
          @blur="stopEditTitle"
          @keydown.enter.prevent="stopEditTitle"
        />
      </div>
      <div class="inline-flex items-center gap-2">
        <select v-model.number="selectedProjectId" class="border rounded px-2 py-1 text-sm" @change="load">
          <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
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
        <!-- Make the thumbnail itself the clickable area (only within the square) -->
        <a :href="f.path" target="_blank" class="w-6 h-6 flex items-center justify-center rounded border overflow-hidden bg-gray-50 dark:bg-gray-800 dark:border-gray-700 shrink-0" :title="fileName(f.path)">
          <img v-if="isImage(f)" :src="f.path" alt="preview" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex items-center justify-center select-none" :class="iconClass(f)">
            <span class="text-[8px] font-semibold uppercase">{{ fileExt(f.path) }}</span>
          </div>
        </a>
        <div class="min-w-0 flex-1">
          <!-- Only the text itself is clickable; whitespace to the right is not -->
          <span class="block truncate">
            <a class="text-blue-600 underline inline" :href="f.path" target="_blank" :title="fileName(f.path)">{{ fileName(f.path) }}</a>
          </span>
          <span class="text-gray-400 text-xs" v-if="sizeOf(f)">({{ sizeOf(f) }})</span>
        </div>
        <button class="text-red-600 text-sm ml-2" @click="remove(f)">Delete</button>
      </li>
    </ul>
    <div v-if="error" class="text-red-600 text-sm">{{ error }}</div>

    <!-- Resize handle -->
    <div
      class="absolute right-1 bottom-1 w-4 h-4 cursor-se-resize"
      style="border-right: 2px solid #9ca3af; border-bottom: 2px solid #9ca3af;"
      @mousedown.stop="startResize"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ snap?: boolean; uid: string; projectId?: number; active?: boolean }>()
const emit = defineEmits(['remove','activate'])
import { useSnapGridStore, GRID } from '~~/stores/snapGrid'
const gridStore = useSnapGridStore()

const title = ref('Attachments')
const editingTitle = ref(false)
const titleInput = ref<HTMLInputElement | null>(null)
function startEditTitle() {
  editingTitle.value = true
  nextTick(() => titleInput.value?.focus())
}
function stopEditTitle() {
  editingTitle.value = false
}
const scope = ref<'shared' | 'private'>('shared')
const files = ref<any[]>([])
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const error = ref('')
const projects = ref<{ id:number; name:string }[]>([])
const selectedProjectId = ref<number | null>(null)

// drag + resize state
const position = reactive({ x: 0, y: 0 })
const size = reactive({ w: GRID.colWidth, h: GRID.rowHeight })
const dragState = reactive({ dragging: false, startX: 0, startY: 0, originX: 0, originY: 0 })
const resizeState = reactive({ resizing: false, startX: 0, startY: 0, originW: 0, originH: 0 })
const DRAG_MOVE_THRESHOLD = 4
const pressTimerId = ref<number | null>(null)
const pendingDrag = ref(false)

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
  'border rounded-2xl p-2 space-y-2 shadow bg-white dark:bg-gray-900 dark:border-gray-700 overflow-hidden z-20',
  props.active ? 'ring-2 ring-blue-300' : '',
  dragState.dragging ? 'select-none cursor-grabbing z-50' : 'select-text cursor-default'
])

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

function onWrapperMouseDown(e: MouseEvent) {
  if (e.button !== 0) return
  dragState.startX = e.clientX
  dragState.startY = e.clientY
  dragState.originX = position.x
  dragState.originY = position.y
  pendingDrag.value = true
}
function onActivate() { emit('activate') }
function startResize(e: MouseEvent) {
  resizeState.resizing = true
  resizeState.startX = e.clientX
  resizeState.startY = e.clientY
  resizeState.originW = size.w
  resizeState.originH = size.h
}
function onMouseMove(e: MouseEvent) {
  if (pendingDrag.value && !dragState.dragging && !resizeState.resizing) {
    const dx = e.clientX - dragState.startX
    const dy = e.clientY - dragState.startY
    if (Math.hypot(dx, dy) >= DRAG_MOVE_THRESHOLD) {
      dragState.dragging = true
      try { gridStore.setDragActive(true); gridStore.startPreview(props.uid) } catch {}
    }
  }
  if (dragState.dragging) {
    position.x = dragState.originX + (e.clientX - dragState.startX)
    position.y = dragState.originY + (e.clientY - dragState.startY)
    // Proximity push: when near an occupied cell (including neighbors), move it out of the way
    if (props.snap) {
      const desired = gridStore.colRowFromPx(position.x, position.y)
      const base = gridStore.pxFromColRow(desired.col, desired.row)
      const cx = base.x + GRID.colWidth / 2
      const cy = base.y + GRID.rowHeight / 2
      const dxp = position.x - cx
      const dyp = position.y - cy
      const approach = Math.abs(dxp) >= Math.abs(dyp) ? (dxp < 0 ? 'right' : 'left') : (dyp < 0 ? 'down' : 'up')
      const occ = gridStore.cellToId[gridStore.key(desired.col, desired.row)]
      const enterX = GRID.colWidth * 0.75
      const enterY = GRID.rowHeight * 0.75
      const keepX = GRID.colWidth * 0.35
      const keepY = GRID.rowHeight * 0.35
      const meta = gridStore.getPreviewMeta()
      const sameTarget = !!meta.target && meta.target.col === desired.col && meta.target.row === desired.row && meta.actorId === props.uid && meta.active
      if (Math.abs(dxp) <= enterX && Math.abs(dyp) <= enterY) {
        gridStore.updatePreview(props.uid, desired.col, desired.row, approach as any)
      } else if (sameTarget && Math.abs(dxp) <= keepX && Math.abs(dyp) <= keepY) {
        gridStore.updatePreview(props.uid, desired.col, desired.row, approach as any)
      } else {
        gridStore.updatePreview(props.uid)
      }
    }
  } else if (resizeState.resizing) {
    size.w = Math.max(260, resizeState.originW + (e.clientX - resizeState.startX))
    size.h = Math.max(220, resizeState.originH + (e.clientY - resizeState.startY))
  }
}
function onMouseUp() {
  pendingDrag.value = false
  dragState.dragging = false
  try { gridStore.setDragActive(false) } catch {}
  resizeState.resizing = false
  if (pressTimerId.value !== null) { clearTimeout(pressTimerId.value); pressTimerId.value = null }
  if (props.snap) {
    const desired = gridStore.colRowFromPx(position.x, position.y)
    const cell = gridStore.commitPreviewPlacement(props.uid, desired)
    const px = gridStore.pxFromColRow(cell.col, cell.row)
    position.x = px.x
    position.y = px.y
  } else {
    // persist free-form position
    try { localStorage.setItem(`mod.freepos:${props.uid}`, JSON.stringify({ x: position.x, y: position.y, w: size.w, h: size.h })) } catch {}
  }
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
  init()
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
onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  gridStore.release(props.uid)
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
watch(scope, load)
watch(selectedProjectId, load)

async function init() {
  await loadProjects()
  await load()
}

async function load() {
  error.value = ''
  const projId = selectedProjectId.value || null
  if (!projId) { files.value = []; return }
  try {
    files.value = await $fetch(`/api/files/${projId}?scope=${scope.value}`)
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Failed to load files'
  }
}

async function onUpload() {
  error.value = ''
  const projId = selectedProjectId.value || null
  if (!projId || !fileInput.value || !fileInput.value.files || fileInput.value.files.length === 0) return
  const file = fileInput.value.files[0]
  const fd = new FormData()
  fd.append('file', file)
  uploading.value = true
  try {
    const created = await $fetch(`/api/files/${projId}?scope=${scope.value}`, { method: 'POST', body: fd })
    files.value.unshift(created)
    if (fileInput.value) fileInput.value.value = ''
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Upload failed'
  } finally {
    uploading.value = false
  }
}

async function remove(f: any) {
  error.value = ''
  const projId = selectedProjectId.value || null
  if (!projId) return
  try {
    await $fetch(`/api/files/${projId}?id=${f.id}`, { method: 'DELETE' })
    files.value = files.value.filter(x => x.id !== f.id)
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Delete failed'
  }
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

function fileExt(p: string) {
  try {
    const base = p.split('?')[0] || p
    const ext = (base.split('.')?.pop() || '').toLowerCase()
    if (ext === 'jpeg') return 'jpg'
    if (ext === 'docx') return 'doc'
    if (ext === 'xlsx') return 'xls'
    if (ext === 'pptx') return 'ppt'
    return ext || 'file'
  } catch { return 'file' }
}

function isImage(f: any) {
  const mime = f?.metadata?.type || ''
  if (typeof mime === 'string' && mime.startsWith('image/')) return true
  const ext = fileExt(String(f?.path || ''))
  return ['png','jpg','jpeg','gif','webp','svg','bmp','avif'].includes(ext)
}

function iconClass(f: any) {
  const ext = fileExt(String(f?.path || '')).toLowerCase()
  const map: Record<string, string> = {
    pdf: 'bg-red-100 text-red-700',
    doc: 'bg-blue-100 text-blue-700', docx: 'bg-blue-100 text-blue-700',
    xls: 'bg-green-100 text-green-700', xlsx: 'bg-green-100 text-green-700', csv: 'bg-green-100 text-green-700',
    ppt: 'bg-orange-100 text-orange-700', pptx: 'bg-orange-100 text-orange-700',
    zip: 'bg-yellow-100 text-yellow-700', rar: 'bg-yellow-100 text-yellow-700', '7z': 'bg-yellow-100 text-yellow-700',
    txt: 'bg-gray-100 text-gray-700', md: 'bg-gray-100 text-gray-700',
    mp3: 'bg-purple-100 text-purple-700', wav: 'bg-purple-100 text-purple-700',
    mp4: 'bg-indigo-100 text-indigo-700', mov: 'bg-indigo-100 text-indigo-700', webm: 'bg-indigo-100 text-indigo-700'
  }
  return map[ext] || 'bg-gray-100 text-gray-600'
}

async function loadProjects() {
  try {
    const list = await $fetch<any[]>(`/api/projects`)
    projects.value = Array.isArray(list) ? list.map(p => ({ id: p.id, name: p.name })) : []
    if (!selectedProjectId.value) selectedProjectId.value = projects.value[0]?.id ?? null
    if (!selectedProjectId.value && projects.value.length === 0) {
      // auto-create a General project for convenience
      try {
        const created = await $fetch<any>(`/api/projects`, { method: 'POST', body: { name: 'General', slug: 'general' } })
        if (created?.id) {
          projects.value = [{ id: created.id, name: created.name }]
          selectedProjectId.value = created.id
        }
      } catch {}
    }
  } catch {}
}
</script>
