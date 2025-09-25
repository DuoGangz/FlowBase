<template>
  <div class="border-b bg-white">
    <div class="w-full px-2 h-12 grid grid-cols-[1fr_auto_1fr] items-center">
      <div />
      <div class="flex items-center gap-4 justify-center">
        <NuxtLink to="/" class="inline-flex items-center h-7">
          <template v-if="!logoError">
            <img :src="logoSrc" alt="Flowbase" class="h-7" @error="onLogoError" />
          </template>
          <template v-else>
            <span class="font-semibold text-base leading-none">Flowbase</span>
          </template>
        </NuxtLink>
        <NuxtLink to="/time-report" class="text-sm underline">Time Report</NuxtLink>
        <NuxtLink v-if="me && me.role === 'OWNER'" to="/owner" class="text-sm underline">Owner</NuxtLink>
        <NuxtLink v-if="me && (me.role === 'OWNER' || me.role === 'ADMIN')" to="/audit-logs" class="text-sm underline">Audit Logs</NuxtLink>
        <NuxtLink v-if="me && (me.role === 'OWNER' || me.role === 'MANAGER')" to="/activity-log" class="text-sm underline">Activity Log</NuxtLink>
        <NuxtLink v-if="me && (me.role === 'OWNER' || me.role === 'MANAGER' || me.role === 'ADMIN')" to="/users" class="text-sm underline">Users</NuxtLink>
      </div>
      <div class="flex items-center gap-3 justify-end pr-4">
        <div v-if="me" class="text-sm text-gray-700">{{ me.name }} ({{ me.role }})</div>
        <button v-if="me" class="px-2 py-1 border rounded text-sm" @click="logout">Logout</button>
      </div>
    </div>
  </div>
  
</template>

<script setup lang="ts">
type Me = { id:number; name:string; email:string; role:'OWNER'|'ADMIN'|'MANAGER'|'USER' } | null
const me = ref<Me>(null)
const logoSrc = '/logo-flowbase.png'
const logoError = ref(false)
function onLogoError() { logoError.value = true }

async function load() {
  try {
    me.value = await $fetch<Me>('/api/auth/me')
  } catch {
    me.value = null
  }
}

async function logout() {
  try { await $fetch('/api/auth/logout', { method: 'POST' }) } catch {}
  const { $googleLogout } = useNuxtApp()
  try { await $googleLogout() } catch {}
  await navigateTo('/login')
}

onMounted(load)
</script>


