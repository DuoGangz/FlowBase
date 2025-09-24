<template>
  <div class="border-b bg-white">
    <div class="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <NuxtLink to="/" class="font-semibold">FlowBase</NuxtLink>
        <NuxtLink to="/time-report" class="text-sm underline">Time Report</NuxtLink>
        <NuxtLink v-if="me && me.role === 'OWNER'" to="/owner" class="text-sm underline">Owner</NuxtLink>
        <NuxtLink v-if="me && (me.role === 'OWNER' || me.role === 'ADMIN')" to="/audit-logs" class="text-sm underline">Audit Logs</NuxtLink>
        <NuxtLink v-if="me && (me.role === 'OWNER' || me.role === 'MANAGER' || me.role === 'ADMIN')" to="/users" class="text-sm underline">Users</NuxtLink>
      </div>
      <div class="flex items-center gap-3">
        <div v-if="me" class="text-sm text-gray-700">{{ me.name }} ({{ me.role }})</div>
        <button v-if="me" class="px-2 py-1 border rounded text-sm" @click="logout">Logout</button>
      </div>
    </div>
  </div>
  
</template>

<script setup lang="ts">
type Me = { id:number; name:string; email:string; role:'OWNER'|'ADMIN'|'MANAGER'|'USER' } | null
const me = ref<Me>(null)

async function load() {
  try {
    me.value = await $fetch<Me>('/api/auth/me')
  } catch {
    me.value = null
  }
}

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await navigateTo('/login')
}

onMounted(load)
</script>


