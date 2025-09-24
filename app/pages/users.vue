<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Users</h1>
      <NuxtLink to="/" class="underline">Back</NuxtLink>
    </div>

    <div v-if="me.role === 'ADMIN' || me.role === 'OWNER'" class="border rounded-md p-4 space-y-2">
      <h2 class="font-medium">Create User</h2>
      <form class="grid gap-2 md:grid-cols-4" @submit.prevent="create">
        <input v-model="createForm.name" placeholder="Name" class="border rounded px-2 py-1" />
        <input v-model="createForm.email" placeholder="Email" class="border rounded px-2 py-1" />
        <select v-model="createForm.role" class="border rounded px-2 py-1">
          <option value="USER">USER</option>
          <option value="MANAGER">MANAGER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        <select v-model.number="createForm.managerId" class="border rounded px-2 py-1">
          <option :value="undefined">No Manager</option>
          <option v-for="u in managers" :key="u.id" :value="u.id">Manager: {{ u.name }}</option>
        </select>
        <div class="md:col-span-4">
          <button class="px-3 py-2 border rounded">Create</button>
        </div>
      </form>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="text-left border-b">
            <th class="py-2 pr-4">Name</th>
            <th class="py-2 pr-4">Email</th>
            <th class="py-2 pr-4">Role</th>
            <th class="py-2 pr-4">Manager</th>
            <th class="py-2 pr-4"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id" class="border-b">
            <td class="py-2 pr-4">{{ u.name }}</td>
            <td class="py-2 pr-4">{{ u.email }}</td>
            <td class="py-2 pr-4">
              <select v-model="u.role" :disabled="!canEdit(u)" class="border rounded px-2 py-1">
                <option value="USER">USER</option>
                <option value="MANAGER">MANAGER</option>
                <option v-if="me.role === 'ADMIN' || me.role === 'OWNER'" value="ADMIN">ADMIN</option>
              </select>
            </td>
            <td class="py-2 pr-4">
              <select v-model.number="u.managerId" :disabled="!canEdit(u)" class="border rounded px-2 py-1">
                <option :value="null">No Manager</option>
                <option v-for="m in managers" :key="m.id" :value="m.id">{{ m.name }}</option>
              </select>
            </td>
            <td class="py-2 pr-4">
              <button class="px-3 py-1 border rounded disabled:opacity-50" :disabled="!dirty[u.id] || !canEdit(u)" @click="save(u)">Save</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '~~/stores/user'

type User = { id:number; name:string; email:string; role:'OWNER'|'ADMIN'|'MANAGER'|'USER'; managerId:number|null }

const me = useUserStore()
const users = ref<User[]>([])
const managers = computed(() => users.value.filter(u => u.role === 'MANAGER'))
const dirty = reactive<Record<number, boolean>>({})

const createForm = reactive<{ name:string; email:string; role:'ADMIN'|'MANAGER'|'USER'; managerId?: number }>(
  { name: '', email: '', role: 'USER', managerId: undefined }
)

watch(users, (val) => {
  // track changes to enable Save button
  for (const u of val) dirty[u.id] = true
}, { deep: true })

function canEdit(target: User) {
  if (me.role === 'OWNER') return true
  if (me.role === 'ADMIN') return target.role !== 'OWNER'
  if (me.role === 'MANAGER') return target.managerId === me.id
  return false
}

async function load() {
  users.value = await $fetch<User[]>('/api/users')
  // reset dirty flags
  for (const u of users.value) dirty[u.id] = false
}

async function save(u: User) {
  await $fetch('/api/users', { method: 'PUT', body: { id: u.id, role: u.role, managerId: u.managerId } })
  dirty[u.id] = false
}

async function create() {
  await $fetch('/api/users', { method: 'POST', body: { ...createForm } })
  createForm.name = ''
  createForm.email = ''
  createForm.role = 'USER'
  createForm.managerId = undefined
  await load()
}

onMounted(load)
</script>


