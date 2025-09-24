<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Audit Logs</h1>
      <NuxtLink to="/" class="underline">Back</NuxtLink>
    </div>

    <div class="flex items-end gap-3">
      <div>
        <label class="block text-sm text-gray-600">Action</label>
        <select v-model="action" class="border rounded px-2 py-1">
          <option value="">All</option>
          <option value="USER_CREATE">USER_CREATE</option>
          <option value="ROLE_CHANGE">ROLE_CHANGE</option>
          <option value="OWNERSHIP_TRANSFER">OWNERSHIP_TRANSFER</option>
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
      <button class="px-3 py-2 border rounded" @click="load">Filter</button>
      <button class="px-3 py-2 border rounded" @click="downloadCsv">Download CSV</button>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="text-left border-b">
            <th class="py-2 pr-4">When</th>
            <th class="py-2 pr-4">Action</th>
            <th class="py-2 pr-4">Actor</th>
            <th class="py-2 pr-4">Target</th>
            <th class="py-2 pr-4">Details</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="l in logs" :key="l.id" class="border-b">
            <td class="py-2 pr-4">{{ formatDate(l.createdAt) }}</td>
            <td class="py-2 pr-4">{{ l.action }}</td>
            <td class="py-2 pr-4">{{ l.actor?.name || l.actorUserId }}</td>
            <td class="py-2 pr-4">{{ l.target?.name || l.targetUserId || '-' }}</td>
            <td class="py-2 pr-4"><pre class="whitespace-pre-wrap">{{ formatDetails(l.details) }}</pre></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
type Log = { id:number; action:'ROLE_CHANGE'|'OWNERSHIP_TRANSFER'|'USER_CREATE'; actorUserId:number; targetUserId:number|null; details:any; createdAt:string; actor?:{ id:number; name:string }; target?:{ id:number; name:string } }
const logs = ref<Log[]>([])
const action = ref<string>('')
const start = ref<string>('')
const end = ref<string>('')

function formatDate(iso: string) {
  return new Date(iso).toLocaleString()
}
function formatDetails(obj: any) {
  try { return JSON.stringify(obj, null, 2) } catch { return String(obj) }
}

async function load() {
  logs.value = await $fetch<Log[]>('/api/audit-logs', { query: { action: action.value || undefined, start: start.value || undefined, end: end.value || undefined } })
}

onMounted(load)

async function downloadCsv() {
  const params = new URLSearchParams()
  if (action.value) params.set('action', action.value)
  if (start.value) params.set('start', start.value)
  if (end.value) params.set('end', end.value)
  params.set('format', 'csv')
  const url = `/api/audit-logs?${params.toString()}`
  const res = await fetch(url)
  const blob = await res.blob()
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'audit-logs.csv'
  document.body.appendChild(link)
  link.click()
  link.remove()
}
</script>


