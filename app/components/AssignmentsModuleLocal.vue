<template>
  <div class="border rounded-2xl p-2 space-y-2 shadow bg-white overflow-hidden relative pb-10">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <h3 class="font-medium mr-2">Assignments</h3>
      <div class="flex flex-wrap items-end gap-2 w-full md:w-auto">
        <div v-if="canAssign" class="order-3 md:order-2 flex items-end gap-2 flex-1 min-w-[260px]">
          <input v-model="newTitle" placeholder="New task" class="border rounded px-2 h-8 text-sm w-40 md:w-48 flex-1" />
          <div class="flex flex-col">
            <label class="text-[10px] leading-none uppercase tracking-wide text-gray-500 mb-1">Employee</label>
            <select v-model.number="assigneeId" class="border rounded px-2 h-8 text-sm min-w-[140px]">
              <option :value="0">Select user</option>
              <option v-for="u in filteredUsers" :key="u.id" :value="u.id">{{ u.name }}</option>
            </select>
          </div>
          <div class="flex flex-col">
            <label class="text-[10px] leading-none uppercase tracking-wide text-gray-500 mb-1">Date</label>
            <input type="date" v-model="dueDate" class="border rounded px-2 h-8 text-sm" />
          </div>
          <button class="px-3 h-8 text-sm border rounded shrink-0" :disabled="!canCreate" @click="create">Assign</button>
        </div>
      </div>
    </div>

    <div class="mt-1">
      <div v-if="!canAssign || viewMode==='me'" class="text-sm font-medium mb-1">Assigned to me</div>
      <div v-else class="flex items-end justify-between mb-1">
        <div class="text-sm font-medium">Assignments</div>
        <div class="flex items-center gap-4">
          <span class="text-xs font-semibold text-gray-700 w-40 text-right">Employee</span>
          <span class="text-xs font-semibold text-gray-700 w-28 text-right">Due date</span>
        </div>
      </div>

      <ul v-if="!canAssign || viewMode==='me'" class="space-y-1">
        <li v-for="a in assignedToMe" :key="a.id" class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <input type="checkbox" :checked="false" @change="complete(a.id)" />
            <span class="truncate">{{ a.title }}</span>
          </div>
          <span class="text-xs text-gray-500 w-28 text-right">{{ fmtDate(a.dueDate) }}</span>
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

    <!-- Bottom-right compact toggle for owners/managers -->
    <div v-if="canAssign" class="absolute bottom-2 right-2 z-10">
      <div class="inline-flex border rounded-full overflow-hidden shadow bg-white transform origin-bottom-right scale-[0.6]">
        <button class="px-3 h-8 text-sm" :class="viewMode==='me' ? 'bg-black text-white' : 'bg-white'" @click="viewMode='me'">Assigned to me</button>
        <button class="px-3 h-8 text-sm" :class="viewMode==='authored' ? 'bg-black text-white' : 'bg-white'" @click="viewMode='authored'">Assignments</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type User = { id:number; name:string; role:'OWNER'|'ADMIN'|'ADMIN_MANAGER'|'MANAGER'|'USER' }
type Assignment = { id:number; title:string; assignedToId:number; dueDate?: string | null }

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

const canAssign = computed(() => me.value && (me.value.role === 'OWNER' || me.value.role === 'MANAGER'))
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
  await $fetch('/api/assignments', { method: 'POST', body: { title: newTitle.value.trim(), assignedToId: assigneeId.value, dueDate: dueDate.value || undefined } })
  // Notify calendars to refresh
  try { window.dispatchEvent(new CustomEvent('assignment-created', { detail: { assignedToId: assigneeId.value } })) } catch {}
  newTitle.value = ''
  assigneeId.value = 0
  dueDate.value = ''
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
    return dd.toLocaleDateString()
  } catch { return '' }
}
</script>


