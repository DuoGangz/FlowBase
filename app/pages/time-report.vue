<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Time Report</h1>
      <NuxtLink to="/" class="underline">Back</NuxtLink>
    </div>

    <div class="flex items-end gap-3">
      <div v-if="me.role !== 'USER'">
        <label class="block text-sm text-gray-600">User</label>
        <select v-model.number="selectedUserId" class="border rounded px-2 py-1 min-w-48">
          <option :value="me.id">Me ({{ me.name }})</option>
          <option v-for="u in allowedUsers" :key="u.id" :value="u.id">{{ u.name }} ({{ u.role }})</option>
        </select>
      </div>
      <div>
        <label class="block text-sm text-gray-600">Start</label>
        <input type="date" v-model="start" class="border rounded px-2 py-1" />
      </div>
      <div>
        <label class="block text-sm text-gray-600">End</label>
        <input type="date" v-model="end" class="border rounded px-2 py-1" />
      </div>
      <button class="px-3 py-2 border rounded-md" @click="load">Load</button>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="text-left border-b">
            <th class="py-2 pr-4">Date</th>
            <th class="py-2 pr-4">Clock In</th>
            <th class="py-2 pr-4">Lunch Out</th>
            <th class="py-2 pr-4">Lunch In</th>
            <th class="py-2 pr-4">Clock Out</th>
            <th class="py-2 pr-4">Hours</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in entries" :key="e.id" class="border-b">
            <td class="py-2 pr-4">{{ formatDate(e.date) }}</td>
            <td class="py-2 pr-4">{{ formatTime(e.clockIn) || '-' }}</td>
            <td class="py-2 pr-4">{{ formatTime(e.lunchOut) || '-' }}</td>
            <td class="py-2 pr-4">{{ formatTime(e.lunchIn) || '-' }}</td>
            <td class="py-2 pr-4">{{ formatTime(e.clockOut) || '-' }}</td>
            <td class="py-2 pr-4">{{ computeHours(e) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '~~/stores/user'

type Entry = {
  id: number
  userId: number
  date: string
  clockIn?: string | null
  lunchOut?: string | null
  lunchIn?: string | null
  clockOut?: string | null
}

const me = useUserStore()
const entries = ref<Entry[]>([])
const start = ref<string>('')
const end = ref<string>('')
const selectedUserId = ref<number>()
const allowedUsers = ref<Array<{ id:number; name:string; role:'OWNER'|'ADMIN'|'MANAGER'|'USER' }>>([])

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString()
}
function formatTime(iso?: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
function computeHours(e: Entry) {
  if (!e.clockIn) return '-'
  const start = new Date(e.clockIn).getTime()
  const end = new Date(e.clockOut || Date.now()).getTime()
  let totalMs = end - start
  if (e.lunchOut && e.lunchIn) {
    totalMs -= new Date(e.lunchIn).getTime() - new Date(e.lunchOut).getTime()
  }
  const hours = Math.max(0, totalMs) / 36e5
  return hours.toFixed(2)
}

async function loadUsers() {
  if (me.role === 'USER') return
  const users = await $fetch<Array<{ id:number; name:string; role:'ADMIN'|'MANAGER'|'USER'; managerId:number|null }>>('/api/users')
  if (me.role === 'MANAGER') {
    allowedUsers.value = users.filter(u => u.id !== me.id)
  } else {
    allowedUsers.value = users.filter(u => u.id !== me.id)
  }
}

async function load() {
  entries.value = await $fetch<Entry[]>('/api/time-entries', {
    query: { userId: selectedUserId.value || me.id, start: start.value || undefined, end: end.value || undefined }
  })
}

onMounted(async () => {
  selectedUserId.value = me.id
  await loadUsers()
  await load()
})
</script>


