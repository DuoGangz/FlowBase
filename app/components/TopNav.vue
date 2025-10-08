<template>
  <div class="border-b bg-white dark:bg-gray-900 dark:border-gray-700">
    <div class="w-full px-2 h-12 grid grid-cols-[1fr_auto_1fr] items-center">
      <div />
      <div class="flex items-center gap-4 justify-center">
        <NuxtLink v-if="!isHome" to="/" class="inline-flex items-center h-7">
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
        <div v-if="me" class="text-sm text-gray-700 dark:text-gray-200">{{ me.name }} ({{ me.role }})</div>

        <!-- Settings Menu -->
        <div v-if="me" ref="settingsRef" class="relative">
          <button
            class="px-2 py-1 border rounded text-sm inline-flex items-center gap-1 hover:bg-gray-50 dark:hover:bg-gray-800"
            aria-haspopup="menu"
            :aria-expanded="settingsOpen ? 'true' : 'false'"
            @click.stop="toggleSettings"
          >
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
              <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.02-1.66-1.02-2.04 0a1.532 1.532 0 01-2.286.84c-.93-.54-2.01.54-1.47 1.47.36.62.16 1.41-.46 1.78-1.02.58-1.02 2.06 0 2.64.62.36.82 1.16.46 1.78-.54.93.54 2.01 1.47 1.47.62-.36 1.41-.16 1.78.46.58 1.02 2.06 1.02 2.64 0 .36-.62 1.16-.82 1.78-.46.93.54 2.01-.54 1.47-1.47-.36-.62-.16-1.41.46-1.78 1.02-.58 1.02-2.06 0-2.64-.62-.36-.82-1.16-.46-1.78.54-.93-.54-2.01-1.47-1.47-.62.36-1.41.16-1.78-.46zM10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" clip-rule="evenodd" />
            </svg>
            <span>Settings</span>
          </button>

          <div
            v-if="settingsOpen"
            class="absolute right-0 mt-2 w-64 rounded-md border bg-white dark:bg-gray-800 dark:border-gray-700 shadow-lg z-20"
            role="menu"
            aria-label="Settings Menu"
          >
            <div class="px-3 py-2 border-b dark:border-gray-700">
              <div class="text-sm font-medium">Settings</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">Configure your preferences</div>
            </div>
            <div class="py-1">
              <label class="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer select-none">
                <input type="checkbox" class="h-4 w-4" v-model="isDark"/>
                <span>Dark theme</span>
              </label>
              <button disabled class="w-full text-left px-3 py-2 text-sm text-gray-400 cursor-not-allowed">Preferences</button>
              <button disabled class="w-full text-left px-3 py-2 text-sm text-gray-400 cursor-not-allowed">Notifications</button>
              <button disabled class="w-full text-left px-3 py-2 text-sm text-gray-400 cursor-not-allowed">Theme</button>
            </div>
          </div>
        </div>

        <button v-if="me" class="px-2 py-1 border rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-800" @click="logout">Logout</button>
      </div>
    </div>
  </div>
  
</template>

<script setup lang="ts">
import { useThemeStore } from '~~/stores/theme'
type Me = { id:number; name:string; email:string; role:'OWNER'|'ADMIN'|'MANAGER'|'USER' } | null
const me = ref<Me>(null)
const logoSrc = '/logo-flowbase.png'
const logoError = ref(false)
function onLogoError() { logoError.value = true }
const route = useRoute()
const isHome = computed(() => route.path === '/')
const themeStore = useThemeStore()
const isDark = computed({
  get: () => themeStore.theme === 'dark',
  set: (v: boolean) => themeStore.setTheme(v ? 'dark' : 'light')
})

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

// Settings menu state
const settingsOpen = ref(false)
const settingsRef = ref<HTMLElement | null>(null)
function toggleSettings() {
  settingsOpen.value = !settingsOpen.value
}

function onGlobalClick(e: MouseEvent) {
  if (!settingsOpen.value) return
  const el = settingsRef.value
  if (!el) return
  if (e.target instanceof Node && !el.contains(e.target)) {
    settingsOpen.value = false
  }
}

function onEsc(e: KeyboardEvent) {
  if (e.key === 'Escape') settingsOpen.value = false
}

onMounted(() => {
  load()
  window.addEventListener('click', onGlobalClick)
  window.addEventListener('keydown', onEsc)
})

onBeforeUnmount(() => {
  window.removeEventListener('click', onGlobalClick)
  window.removeEventListener('keydown', onEsc)
})
</script>
