<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Owner Tools</h1>
      <NuxtLink to="/" class="underline">Back</NuxtLink>
    </div>

    <div class="border rounded-md p-4 space-y-3">
      <h2 class="font-medium">Transfer Ownership</h2>
      <div class="text-sm text-gray-600">Select a user to become the new owner. Your role will become ADMIN.</div>
      <div class="flex items-end gap-3">
        <div>
          <label class="block text-sm text-gray-600">Target User</label>
          <select v-model.number="targetUserId" class="border rounded px-2 py-1 min-w-64">
            <option v-for="u in candidates" :key="u.id" :value="u.id">{{ u.name }} ({{ u.role }})</option>
          </select>
        </div>
        <button class="px-3 py-2 border rounded" :disabled="!targetUserId" @click="transfer">Transfer</button>
      </div>
      <div v-if="message" class="text-sm" :class="messageType === 'success' ? 'text-green-700' : 'text-red-700'">{{ message }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
type User = { id:number; name:string; role:'OWNER'|'ADMIN'|'MANAGER'|'USER' }
const targetUserId = ref<number>()
const candidates = ref<User[]>([])
const message = ref('')
const messageType = ref<'success'|'error'>('success')

async function load() {
  const users = await $fetch<Array<User & { managerId:number|null }>>('/api/users')
  candidates.value = users.filter(u => u.role !== 'OWNER')
}

async function transfer() {
  message.value = ''
  try {
    await $fetch('/api/owner/transfer', { method: 'POST', body: { targetUserId: targetUserId.value } })
    message.value = 'Ownership transferred. Please re-login.'
    messageType.value = 'success'
  } catch (e: any) {
    message.value = e?.data?.message || 'Transfer failed'
    messageType.value = 'error'
  }
}

onMounted(load)
</script>


