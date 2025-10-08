<template>
  <div
    :class="wrapperClass"
    :style="wrapperStyle"
    @mousedown.capture="onActivate"
    @mousedown="onWrapperMouseDown"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2 flex-1 min-w-0 cursor-move">
        <span class="font-medium inline-block px-1 py-0.5 rounded">Messenger</span>
      </div>
      <button class="text-sm text-red-600" @click="$emit('remove')">Remove</button>
    </div>

    <InstantMessenger />

    <div
      class="absolute right-1 bottom-1 w-4 h-4 cursor-se-resize"
      style="border-right: 2px solid #9ca3af; border-bottom: 2px solid #9ca3af;"
      @mousedown.stop="startResize"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ snap?: boolean; uid: string; active?: boolean }>()
const emit = defineEmits(['remove','activate'])

import InstantMessenger from '~/components/InstantMessenger.vue'
import { useSnapGridStore, GRID } from '~~/stores/snapGrid'
const gridStore = useSnapGridStore()

const position = reactive({ x: 0, y: 0 })
const size = reactive({ w: GRID.colWidth, h: GRID.rowHeight })
const dragState = reactive({ dragging: false, startX: 0, startY: 0, originX: 0, originY: 0 })
const resizeState = reactive({ resizing: false, startX: 0, startY: 0, originW: 0, originH: 0 })
const DRAG_MOVE_THRESHOLD = 4
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
  'border rounded-2xl p-2 space-y-2 shadow bg-white dark:bg-gray-900 dark:border-gray-700 overflow-auto z-20',
  props.active ? 'ring-2 ring-blue-300' : '',
  dragState.dragging ? 'select-none cursor-grabbing z-50' : 'select-text cursor-default'
])

function onActivate() { emit('activate') }
function isInteractiveTarget(el: HTMLElement | null): boolean {
  if (!el) return false
  const tag = (el.tagName || '').toUpperCase()
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') return true
  if ((el as any).isContentEditable) return true
  return !!el.closest('input, textarea, select, button, [contenteditable="true"]')
}
function onWrapperMouseDown(e: MouseEvent) {
  if (e.button !== 0) return
  const target = e.target as HTMLElement | null
  if (isInteractiveTarget(target)) return
  dragState.startX = e.clientX
  dragState.startY = e.clientY
  dragState.originX = position.x
  dragState.originY = position.y
  pendingDrag.value = true
}
function startResize(e: MouseEvent) {
  resizeState.resizing = true
  resizeState.startX = e.clientX
  resizeState.startY = e.clientY
  resizeState.originW = size.w
  resizeState.originH = size.h
}

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
  if (props.snap) {
      const desired = gridStore.colRowFromPx(position.x, position.y)
      const base = gridStore.pxFromColRow(desired.col, desired.row)
      const cx = base.x + GRID.colWidth / 2
      const cy = base.y + GRID.rowHeight / 2
      const dxp = position.x - cx
      const dyp = position.y - cy
      const approach = Math.abs(dxp) >= Math.abs(dyp) ? (dxp < 0 ? 'right' : 'left') : (dyp < 0 ? 'down' : 'up')
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
    size.w = Math.max(320, resizeState.originW + (e.clientX - resizeState.startX))
    size.h = Math.max(260, resizeState.originH + (e.clientY - resizeState.startY))
  }
}
function onMouseUp() {
  pendingDrag.value = false
  dragState.dragging = false
  try { gridStore.setDragActive(false) } catch {}
  resizeState.resizing = false
  if (props.snap) {
    const desired = gridStore.colRowFromPx(position.x, position.y)
    const cell = gridStore.commitPreviewPlacement(props.uid, desired)
    const px = gridStore.pxFromColRow(cell.col, cell.row)
    position.x = px.x
    position.y = px.y
  } else {
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
</script>


