<template>
  <div
    :class="wrapperClass"
    :style="wrapperStyle"
    @mousedown="onWrapperMouseDown"
  >
    <div class="space-y-2 relative">
    <div class="flex flex-wrap items-end justify-between gap-2 pl-14">
      <h3 class="font-medium mr-2">Assignments</h3>
      <div class="flex flex-wrap items-end gap-2 w-full md:w-auto order-3 md:order-2">
        <div v-if="canAssign" class="order-3 md:order-2 flex flex-wrap items-end gap-2 flex-1 min-w-[260px]">
          <div class="flex items-end gap-2 flex-1 min-w-[320px] flex-wrap md:flex-nowrap">
            <input v-model="newTitle" placeholder="New task" class="border rounded px-2 h-8 text-sm w-40 md:w-48 flex-1" />
            <div class="flex flex-col">
              <label class="text-[10px] leading-none uppercase tracking-wide text-gray-500 mb-1">Employee</label>
              <select v-model.number="assigneeId" class="border rounded px-2 h-8 text-sm min-w-[140px]">
                <option :value="0">Select user</option>
                <option v-for="u in filteredUsers" :key="u.id" :value="u.id">{{ u.name }}</option>
              </select>
            </div>
            <div class="flex items-end gap-2">
              <div class="flex flex-col">
                <label class="text-[10px] leading-none uppercase tracking-wide text-gray-500 mb-1">Date</label>
                <input type="date" v-model="dueDate" class="border rounded px-2 h-8 text-sm" />
              </div>
              <div class="flex flex-col">
                <label class="text-[10px] leading-none uppercase tracking-wide text-gray-500 mb-1">Time</label>
                <input type="time" v-model="dueTime" class="border rounded px-2 h-8 text-sm w-[110px]" />
              </div>
            </div>
          </div>
          <div class="w-full flex justify-end mt-1">
            <div class="w-28">
              <button class="px-3 h-8 text-sm border rounded w-full" :disabled="!canCreate" @click="create">Assign</button>
            </div>
          </div>
        </div>
        
      </div>
    </div>
    
    <!-- Keep Remove pinned top-left like other modules -->
    <div class="absolute top-1 left-2">
      <button class="text-sm text-red-600" @click="$emit('remove')">Remove</button>
    </div>

    <div class="mt-1">
      <div v-if="!canAssign || viewMode==='me'" class="flex items-end justify-between mb-1">
        <div class="text-sm font-medium">Assigned to me</div>
        <span class="text-xs font-bold text-gray-700 w-28 text-right">Due date</span>
      </div>
      <div v-else class="flex items-end justify-between mb-1">
        <div class="text-sm font-medium">Assignments</div>
        <div class="flex items-center gap-4">
          <span class="text-xs font-bold text-gray-700 w-40 text-right">Employee</span>
          <span class="text-xs font-bold text-gray-700 w-28 text-right">Due date</span>
        </div>
      </div>

      <ul v-if="!canAssign || viewMode==='me'" class="space-y-1">
        <li v-for="a in assignedToMe" :key="a.id" class="flex items-center gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <input type="checkbox" :checked="false" @change="complete(a.id)" />
            <span class="truncate">{{ a.title }}</span>
          </div>
          <span class="text-xs text-gray-500 ml-auto w-28 text-right">{{ fmtDate(a.dueDate) }}</span>
        </li>
        <li v-if="assignedToMe.length===0" class="text-sm text-gray-500">No assignments</li>
      </ul>

      <ul v-else class="space-y-1">
        <li v-for="a in authored" :key="a.id" class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <span>•</span>
            <span class="truncate">{{ a.title }}</span>
          </div>
          <div class="flex items-center gap-4">
            <span class="text-xs text-gray-500 w-40 text-right truncate">{{ userMap[a.assignedToId]?.name || a.assignedToId }}</span>
            <span class="text-xs text-gray-500 w-28 text-right">{{ fmtDate(a.dueDate) }}</span>
          </div>
        </li>
        <li v-if="authored.length===0" class="text-sm text-gray-500">No pending authored assignments</li>
      </ul>
    </div>

    </div>

    <!-- Bottom-left toggle pinned to module wrapper -->
    <div v-if="canAssign" class="absolute left-2 bottom-2">
      <div class="inline-flex border rounded-full overflow-hidden shadow bg-white pointer-events-auto">
        <button class="px-3 h-8 text-sm" :class="viewMode==='me' ? 'bg-black text-white' : 'bg-white'" @click="viewMode='me'">Assigned to me</button>
        <button class="px-3 h-8 text-sm" :class="viewMode==='authored' ? 'bg-black text-white' : 'bg-white'" @click="viewMode='authored'">Assignments</button>
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
import { useSnapGridStore, GRID } from '~~/stores/snapGrid'
type User = { id:number; name:string; role:'OWNER'|'ADMIN'|'ADMIN_MANAGER'|'MANAGER'|'USER' }
type Assignment = { id:number; title:string; assignedToId:number; dueDate?: string | null }

const gridStore = useSnapGridStore()
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
  'border rounded-2xl p-2 shadow bg-white overflow-x-hidden overflow-y-auto relative',
  dragState.dragging ? 'select-none cursor-grabbing z-50' : 'select-text cursor-default'
])

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
  if (props.snap) applySnap()
}
function onWrapperMouseDown(e: MouseEvent) {
  if (e.button !== 0) return
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

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
  if (props.snap) applySnap()
})
watch(() => gridStore.cells[props.uid], (cell) => {
  if (!props.snap || !cell) return
  if (dragState.dragging || resizeState.resizing) return
  size.w = GRID.colWidth
  size.h = Math.max(GRID.rowHeight, 320)
  const px = gridStore.pxFromColRow(cell.col, cell.row)
  position.x = px.x
  position.y = px.y
})
watch(() => gridStore.version, () => {
  if (!props.snap) return
  size.w = GRID.colWidth
  size.h = Math.max(GRID.rowHeight, 320)
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
const me = ref<{ id:number; role:'OWNER'|'ADMIN'|'MANAGER'|'USER' } | null>(null)
const assignedToMe = ref<Assignment[]>([])
const authored = ref<Assignment[]>([])
const users = ref<User[]>([])
const userMap = reactive<Record<number, User>>({})
const filteredUsers = computed(() => {
  if (!me.value) return [] as User[]
  if (!canAssign.value) return [] as User[]
  if (me.value.role === 'OWNER' || me.value.role === 'ADMIN_MANAGER') return users.value
  return users.value.filter(u => u.role !== 'ADMIN')
})

const newTitle = ref('')
const assigneeId = ref(0)
const viewMode = ref<'me'|'authored'>('me')
const dueDate = ref('')
const dueTime = ref('')

const canAssign = computed(() => me.value && (me.value.role === 'OWNER' || me.value.role === 'MANAGER' || me.value.role === 'ADMIN_MANAGER'))
const canCreate = computed(() => canAssign.value && newTitle.value.trim() && assigneeId.value > 0)

async function loadMe() {
  try { me.value = await $fetch('/api/auth/me') } catch { me.value = null }
}

async function loadUsers() {
  try {
    const list = await $fetch<any[]>('/api/users')
    users.value = list.map(u => ({ id: u.id, name: u.name, role: u.role }))
    for (const u of users.value) userMap[u.id] = u
  } catch {}
}

async function loadAssignments() {
  assignedToMe.value = await $fetch(`/api/assignments?view=me`)
  if (canAssign.value) {
    authored.value = await $fetch(`/api/assignments?view=authored`)
  } else {
    authored.value = []
  }
}

async function create() {
  if (!canCreate.value) return
  const dueISO = (() => {
    if (!dueDate.value) return undefined
    if (dueTime.value) return `${dueDate.value}T${dueTime.value}`
    return dueDate.value
  })()
  await $fetch('/api/assignments', { method: 'POST', body: { title: newTitle.value.trim(), assignedToId: assigneeId.value, dueDate: dueISO } })
  // Notify calendars to refresh
  try { window.dispatchEvent(new CustomEvent('assignment-created', { detail: { assignedToId: assigneeId.value } })) } catch {}
  newTitle.value = ''
  assigneeId.value = 0
  dueDate.value = ''
  dueTime.value = ''
  await loadAssignments()
}

async function complete(id: number) {
  await $fetch('/api/assignments', { method: 'PUT', body: { id, completed: true } })
  await loadAssignments()
}

onMounted(async () => {
  await loadMe()
  await Promise.all([loadUsers(), loadAssignments()])
})

watch(viewMode, async () => {
  await loadAssignments()
})

function fmtDate(d?: string | null) {
  if (!d) return ''
  try {
    const dd = new Date(d)
    const hasTime = dd.getHours() !== 0 || dd.getMinutes() !== 0 || dd.getSeconds() !== 0
    if (!hasTime) return dd.toLocaleDateString()
    return dd.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
  } catch { return '' }
}
</script>


