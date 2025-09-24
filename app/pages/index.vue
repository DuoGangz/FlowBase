<template>
  <div class="relative p-6 space-y-4">
    <div class="flex items-center justify-between gap-2 relative">
      <div class="w-full">
        <div class="relative mx-auto max-w-3xl border rounded-md h-40 flex items-end justify-center bg-gray-50 overflow-hidden">
          <img v-if="bannerUrl" :src="bannerUrl" alt="Banner" class="w-full h-full object-cover" />
          <div v-if="canEditBanner" class="absolute bottom-2 right-2">
            <button class="px-3 py-1 border rounded bg-white/80 hover:bg-white" @click="fileInput!.click()">Upload banner</button>
          </div>
          <input v-if="canEditBanner" ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
        </div>
        <div class="mx-auto max-w-3xl text-center mt-2">
          <template v-if="canEditBanner && editingTitle">
            <form class="inline-flex items-center gap-2" @submit.prevent="saveTitle">
              <input v-model="titleDraft" class="border rounded px-2 py-1" />
              <button class="px-2 py-1 border rounded">Save</button>
              <button class="px-2 py-1 border rounded" type="button" @click="cancelEditTitle">Cancel</button>
            </form>
          </template>
          <template v-else>
            <h1 class="text-2xl font-semibold inline-flex items-center gap-2">
              {{ siteTitle }}
              <button v-if="canEditBanner" class="text-sm underline" @click="startEditTitle">Edit</button>
            </h1>
          </template>
        </div>
      </div>
      <div class="absolute right-4 -top-2">
        <button class="bg-black text-white px-3 py-2 rounded" @click="toggleMenu" aria-label="Add module"><span class="font-bold text-xl leading-none">+</span></button>
        <div v-if="menuOpen" class="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow-md z-50">
          <button class="w-full text-left px-3 py-2 hover:bg-gray-50" @click="addModule('todo')">Todo</button>
          <button class="w-full text-left px-3 py-2 hover:bg-gray-50" @click="addModule('calendar')">Calendar</button>
          <button class="w-full text-left px-3 py-2 hover:bg-gray-50" @click="addModule('clock')">Time Clock</button>
        </div>
      </div>
    </div>

    <div class="grid md:grid-cols-2 gap-6">
      <component
        v-for="mod in modules"
        :key="mod.key"
        :is="mod.type === 'todo' ? TodoModuleLocal : (mod.type === 'calendar' ? CalendarModuleLocal : ClockModuleLocal)"
        @remove="removeModule(mod.key)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import TodoModuleLocal from '~/components/TodoModuleLocal.vue'
import CalendarModuleLocal from '~/components/CalendarModuleLocal.vue'
import ClockModuleLocal from '~/components/ClockModuleLocal.vue'
import { useUserStore } from '~~/stores/user'

const modules = ref<{ key: string; type: 'todo' | 'calendar' | 'clock' }[]>([])
const menuOpen = ref(false)

const me = useUserStore()
const bannerUrl = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const canEditBanner = computed(() => me.role === 'ADMIN' || me.role === 'OWNER')
const siteTitle = ref('Home')
const editingTitle = ref(false)
const titleDraft = ref('Home')

async function loadBanner() {
  const res = await $fetch<{ url: string | null }>('/api/banner')
  bannerUrl.value = res.url
}
async function loadTitle() {
  const res = await $fetch<{ title: string }>('/api/site-title')
  siteTitle.value = res.title
}
async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  const fd = new FormData()
  fd.append('file', input.files[0])
  await $fetch('/api/banner', { method: 'POST', body: fd })
  await loadBanner()
  input.value = ''
}
function startEditTitle() {
  titleDraft.value = siteTitle.value
  editingTitle.value = true
}
function cancelEditTitle() {
  editingTitle.value = false
}
async function saveTitle() {
  await $fetch('/api/site-title', { method: 'POST', body: { title: titleDraft.value } })
  editingTitle.value = false
  await loadTitle()
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function addModule(type: 'todo' | 'calendar' | 'clock') {
  modules.value.push({ key: Math.random().toString(36).slice(2), type })
  menuOpen.value = false
}
function removeModule(key: string) {
  modules.value = modules.value.filter(m => m.key !== key)
}

onMounted(async () => {
  await Promise.all([loadBanner(), loadTitle()])
})
</script>


