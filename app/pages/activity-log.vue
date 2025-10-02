<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Activity Log</h1>
      <NuxtLink to="/" class="underline">Back</NuxtLink>
    </div>

    <div v-if="!allowed" class="text-sm text-red-600">Forbidden</div>
    <div v-else class="space-y-4">
      <div class="flex gap-2 items-center">
        <select v-model.number="filterUserId" class="border rounded px-2 py-1">
          <option :value="0">Whole company</option>
          <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }}</option>
        </select>
        <select v-model="filterStatus" class="border rounded px-2 py-1">
          <option value="all">All</option>
          <option value="assigned">Assigned</option>
          <option value="completed">Completed</option>
        </select>
        <button class="px-3 py-1 border rounded" @click="load">Apply</button>
      </div>

      <ul class="divide-y">
        <li v-for="it in items" :key="it.id" class="py-2 flex items-center justify-between">
          <div>
            <div class="font-medium">{{ it.title }}</div>
            <div class="text-xs text-gray-500">Assigned {{ fmt(it.createdAt) }} by {{ it.assignedBy.name }} • <template v-if="it.completed">Completed {{ fmt(it.completedAt) }} by {{ it.assignedTo.name }}</template><template v-else>Not completed</template></div>
          </div>
          <span class="text-xs px-2 py-0.5 rounded-full" :class="it.completed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'">{{ it.completed ? 'Completed' : 'Assigned' }}</span>
        </li>
        <li v-if="items.length===0" class="py-2 text-sm text-gray-500">No activity</li>
      </ul>
    </div>
  </div>
  
</template>

<script setup lang="ts">
type Me = { id:number; role:'OWNER'|'ADMIN'|'MANAGER'|'USER' }
type User = { id:number; name:string }

const me = ref<Me | null>(null)
const allowed = computed(() => me.value && (me.value.role === 'OWNER' || me.value.role === 'MANAGER'))
const users = ref<User[]>([])
const filterUserId = ref(0)
const items = ref<any[]>([])
const filterStatus = ref<'all'|'assigned'|'completed'>('all')

function fmt(d: string | Date | null) {
  if (!d) return ''
  const dt = new Date(d)
  return dt.toLocaleString()
}

async function loadUsers() {
  try {
    const list = await $fetch<any[]>('/api/users')
    users.value = list.map(u => ({ id: u.id, name: u.name }))
  } catch {}
}

async function load() {
  const params: string[] = []
  if (filterUserId.value > 0) params.push(`userId=${filterUserId.value}`)
  if (filterStatus.value !== 'all') params.push(`status=${filterStatus.value}`)
  const q = params.length ? `?${params.join('&')}` : ''
  items.value = await $fetch(`/api/activity-log${q}`)
}

onMounted(async () => {
  try { me.value = await $fetch('/api/auth/me') } catch { me.value = null }
  if (!allowed.value) {
    return navigateTo('/')
  }
  await Promise.all([loadUsers(), load()])
})
</script>


