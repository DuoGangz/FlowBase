<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Users</h1>
      <NuxtLink to="/" class="underline">Back</NuxtLink>
    </div>

    <div v-if="me && (me.role === 'ADMIN' || me.role === 'OWNER')" class="border rounded-md p-4 space-y-2">
      <h2 class="font-medium">Create User</h2>
      <form class="grid gap-2 md:grid-cols-5" @submit.prevent="create">
        <input v-model="createForm.name" placeholder="Name" class="border rounded px-2 py-1" />
        <input v-model="createForm.email" placeholder="Email" class="border rounded px-2 py-1" />
        <input v-model="createForm.username" placeholder="Username (optional)" class="border rounded px-2 py-1" />
        <select v-model="createForm.role" class="border rounded px-2 py-1">
          <option value="USER">USER</option>
          <option value="MANAGER">MANAGER</option>
          <option value="ADMIN">ADMIN</option>
          <option v-if="me && me.role==='OWNER'" value="ADMIN_MANAGER">ADMIN_MANAGER</option>
        </select>
        <select v-model.number="createForm.managerId" class="border rounded px-2 py-1">
          <option :value="undefined">No Manager</option>
          <option v-for="u in managers" :key="u.id" :value="u.id">Manager: {{ u.name }}</option>
        </select>
        <div class="md:col-span-5">
          <button class="px-3 py-2 border rounded">Create</button>
        </div>
      </form>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="text-left border-b">
            <th class="py-2 pr-4">Username</th>
            <th class="py-2 pr-4">Name</th>
            <th class="py-2 pr-4">Email</th>
            <th class="py-2 pr-4">Role</th>
            <th class="py-2 pr-4">Manager</th>
            <th class="py-2 pr-4"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id" class="border-b">
            <td class="py-2 pr-4">
              <input v-model="u.username" :disabled="!canEdit(u)" class="border rounded px-2 py-1 w-40" />
            </td>
            <td class="py-2 pr-4">
              <input v-model="u.name" :disabled="!canEdit(u)" class="border rounded px-2 py-1 w-40" />
            </td>
            <td class="py-2 pr-4">{{ u.email }}</td>
            <td class="py-2 pr-4">
              <select v-model="u.role" :disabled="!canEditRole(u)" class="border rounded px-2 py-1">
                <option value="USER">USER</option>
                <option value="MANAGER">MANAGER</option>
                <option v-if="me && (me.role === 'ADMIN' || me.role === 'OWNER')" value="ADMIN">ADMIN</option>
                <option v-if="me && me.role === 'OWNER'" value="ADMIN_MANAGER">ADMIN_MANAGER</option>
              </select>
            </td>
            <td class="py-2 pr-4">
              <select v-model.number="u.managerId" :disabled="!canChangeManager(u)" class="border rounded px-2 py-1">
                <option :value="null">No Manager</option>
                <option v-for="m in managers" :key="m.id" :value="m.id">{{ m.name }}</option>
              </select>
            </td>
            <td class="py-2 pr-4">
              <button class="px-3 py-1 border rounded disabled:opacity-50" :disabled="!dirty[u.id] || !canEdit(u)" @click="save(u)">Save</button>
              <button class="ml-2 px-3 py-1 border rounded" :disabled="!canReset(u)" @click="openReset(u)">Reset Password</button>
              <button v-if="me && (me.role==='OWNER' || me.role==='ADMIN')" class="ml-2 px-3 py-1 border rounded" @click="openPageAccess(u)">Page Access</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="resetTarget" class="fixed inset-0 bg-black/30 flex items-center justify-center">
      <div class="bg-white rounded-md p-4 w-96 space-y-2">
        <h3 class="font-medium">Reset Password for {{ resetTarget.name }}</h3>
        <input type="password" v-model="pwd1" placeholder="New password" class="border rounded px-2 py-1 w-full" />
        <input type="password" v-model="pwd2" placeholder="Confirm password" class="border rounded px-2 py-1 w-full" />
        <div class="text-sm text-red-600" v-if="pwdError">{{ pwdError }}</div>
        <div class="flex justify-end gap-2 pt-2">
          <button class="px-3 py-1 border rounded" @click="closeReset">Cancel</button>
          <button class="px-3 py-1 border rounded bg-black text-white" :disabled="!canSubmitPwd" @click="submitReset">Update</button>
        </div>
      </div>
    </div>

    <div v-if="accessTarget" class="fixed inset-0 bg-black/30 flex items-center justify-center">
      <div class="bg-white rounded-md p-4 w-[520px] space-y-3">
        <h3 class="font-medium">Home Page Access for {{ accessTarget.name }}</h3>
        <div class="space-y-2 max-h-80 overflow-auto">
          <div v-for="p in accessPages" :key="p.id" class="flex items-center justify-between border rounded px-2 py-1">
            <div class="flex items-center gap-2">
              <input type="checkbox" v-model="accessAssignments[p.id].enabled" />
              <span>{{ p.name }}</span>
            </div>
            <label class="text-sm flex items-center gap-1">
              <input type="checkbox" v-model="accessAssignments[p.id].canEdit" :disabled="!accessAssignments[p.id].enabled" />
              Can edit layout
            </label>
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button class="px-3 py-1 border rounded" @click="closePageAccess">Cancel</button>
          <button class="px-3 py-1 border rounded bg-black text-white" @click="savePageAccess">Save</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type User = { id:number; name:string; username:string|null; email:string; role:'OWNER'|'ADMIN'|'ADMIN_MANAGER'|'MANAGER'|'USER'; managerId:number|null }
type Me = { id:number; role:'OWNER'|'ADMIN'|'ADMIN_MANAGER'|'MANAGER'|'USER'; name:string; email:string }

const me = ref<Me | null>(null)
const users = ref<User[]>([])
const managers = computed(() => users.value.filter(u => u.role === 'MANAGER' || u.role === 'ADMIN_MANAGER'))
const dirty = reactive<Record<number, boolean>>({})

const createForm = reactive<{ name:string; email:string; username?:string; role:'ADMIN'|'ADMIN_MANAGER'|'MANAGER'|'USER'; managerId?: number }>(
  { name: '', email: '', username: '', role: 'USER', managerId: undefined }
)

watch(users, (val) => {
  for (const u of val) dirty[u.id] = true
}, { deep: true })

function canEdit(target: User) {
  if (!me.value) return false
  if (me.value.role === 'OWNER') return true
  if (me.value.role === 'ADMIN') return target.role !== 'OWNER'
  if (me.value.role === 'MANAGER' || me.value.role === 'ADMIN_MANAGER') return target.managerId === me.value.id
  return false
}

function canChangeManager(target: User) {
  if (!me.value) return false
  if (me.value.role === 'OWNER') return true
  if (me.value.role === 'ADMIN') return target.role !== 'OWNER'
  return false
}

function canReset(target: User) {
  if (!me.value) return false
  if (me.value.role === 'OWNER') return true
  if (me.value.role === 'ADMIN') return target.role !== 'OWNER'
  if (me.value.role === 'MANAGER' || me.value.role === 'ADMIN_MANAGER') return target.managerId === me.value.id
  return me.value.id === target.id
}

function canEditRole(target: User) {
  if (!me.value) return false
  if (me.value.role === 'OWNER') return true
  if (me.value.role === 'ADMIN') return target.role !== 'OWNER'
  // Managers cannot change roles; admin-managers same restriction
  return false
}

async function load() {
  try {
    me.value = await $fetch<Me>('/api/auth/me')
  } catch {
    me.value = null
  }
  users.value = await $fetch<User[]>('/api/users')
  // reset dirty flags
  for (const u of users.value) dirty[u.id] = false
}

async function save(u: User) {
  await $fetch('/api/users', { method: 'PUT', body: { id: u.id, role: u.role, managerId: u.managerId, username: u.username, name: u.name } })
  dirty[u.id] = false
}

async function create() {
  await $fetch('/api/users', { method: 'POST', body: { ...createForm } })
  createForm.name = ''
  createForm.email = ''
  createForm.username = ''
  createForm.role = 'USER'
  createForm.managerId = undefined
  await load()
}

onMounted(load)

// Password reset modal state
const resetTarget = ref<User | null>(null)
const pwd1 = ref('')
const pwd2 = ref('')
const pwdError = ref('')
const canSubmitPwd = computed(() => pwd1.value.length > 0 && pwd1.value === pwd2.value)

function openReset(u: User) {
  pwd1.value = ''
  pwd2.value = ''
  pwdError.value = ''
  resetTarget.value = u
}
function closeReset() {
  resetTarget.value = null
}
async function submitReset() {
  if (!canSubmitPwd.value || !resetTarget.value) {
    pwdError.value = 'Passwords must match'
    return
  }
  await $fetch('/api/users/password', { method: 'POST', body: { id: resetTarget.value.id, password: pwd1.value } })
  resetTarget.value = null
}

// Page access modal (owners/admins)
const accessTarget = ref<User | null>(null)
const accessPages = ref<{ id:number; name:string }[]>([])
const accessAssignments = ref<Record<number, { enabled:boolean; canEdit:boolean }>>({})

async function openPageAccess(u: User) {
  accessTarget.value = u
  const all = await $fetch<{ id:number; name:string }[]>('/api/home-pages')
  accessPages.value = all
  // Load current permissions
  const pagePerms = await Promise.all(all.map(async (p) => {
    const perms = await $fetch<any[]>(`/api/home-pages/permissions?homePageId=${p.id}`)
    const entry = perms.find(x => x.userId === u.id)
    return { pageId: p.id, enabled: !!entry, canEdit: entry?.canEdit ?? false }
  }))
  const map: Record<number, { enabled:boolean; canEdit:boolean }> = {}
  for (const it of pagePerms) map[it.pageId] = { enabled: it.enabled, canEdit: it.canEdit }
  accessAssignments.value = map
}

function closePageAccess() {
  accessTarget.value = null
  accessPages.value = []
  accessAssignments.value = {}
}

async function savePageAccess() {
  if (!accessTarget.value) return
  // For each page, submit a consolidated assignments list
  for (const p of accessPages.value) {
    const a = accessAssignments.value[p.id] || { enabled: false, canEdit: false }
    await $fetch('/api/home-pages/permissions', {
      method: 'POST',
      body: { homePageId: p.id, assignments: [{ userId: accessTarget.value.id, enabled: a.enabled, canEdit: a.canEdit }] }
    })
  }
  closePageAccess()
}
</script>
