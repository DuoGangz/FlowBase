<template>
  <div class="relative p-6 space-y-4">
    <div class="flex items-center justify-between gap-2 relative">
      <div class="w-full">
        <div class="relative mx-auto max-w-3xl border rounded-md h-40 flex items-end justify-center bg-gray-50 overflow-hidden">
          <img v-if="bannerUrl" :src="bannerUrl" alt="Banner" class="w-full h-full object-cover" />
          <div v-if="canEditBanner" class="absolute bottom-2 right-2">
            <button class="w-6 h-6 border rounded-full bg-white/80 hover:bg-white flex items-center justify-center" @click.stop="toggleBannerMenu" aria-label="Banner options">
              <span class="text-base leading-none">⋮</span>
            </button>
            <div v-if="bannerMenuOpen" class="absolute right-0 bottom-8 w-40 bg-white border rounded-md shadow-md z-50">
              <button class="w-full text-left px-3 py-2 hover:bg-gray-50" @click="openUpload">Upload Image</button>
              <button class="w-full text-left px-3 py-2 hover:bg-gray-50" :disabled="!bannerUrl" @click="cropExisting">Properties</button>
            </div>
          </div>
          <input v-if="canEditBanner" ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
        </div>
        <BannerCropper
          v-if="cropFile"
          :file="cropFile"
          :target-width="bannerWidth"
          :target-height="bannerHeight"
          @cancel="cropFile=null"
          @confirm="onCropConfirm"
        />
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
          <button class="w-full text-left px-3 py-2 hover:bg-gray-50" @click="addModule('roadmap')">Road Map</button>
        </div>
      </div>
    </div>

    <div class="grid md:grid-cols-2 gap-6">
      <component
        v-for="mod in modules"
        :key="mod.key"
        :is="
          mod.type === 'todo' ? TodoModuleLocal :
          mod.type === 'calendar' ? CalendarModuleLocal :
          mod.type === 'clock' ? ClockModuleLocal :
          RoadmapModuleLocal
        "
        :snap="snapMode"
        @remove="removeModule(mod.key)"
      />
    </div>

    <!-- Snap/Free Form toggle (bottom-right) -->
    <div class="fixed bottom-4 right-4 z-50">
      <div class="inline-flex border rounded-full overflow-hidden shadow bg-white">
        <button
          class="px-3 py-1 text-sm"
          :class="snapMode ? 'text-gray-600' : 'bg-black text-white'"
          @click="snapMode=false"
        >Free Form</button>
        <button
          class="px-3 py-1 text-sm"
          :class="snapMode ? 'bg-black text-white' : 'text-gray-600'"
          @click="snapMode=true"
        >Snapping</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import TodoModuleLocal from '~/components/TodoModuleLocal.vue'
import CalendarModuleLocal from '~/components/CalendarModuleLocal.vue'
import ClockModuleLocal from '~/components/ClockModuleLocal.vue'
import RoadmapModuleLocal from '~/components/RoadmapModuleLocal.vue'
import { useUserStore } from '~~/stores/user'
import BannerCropper from '~/components/BannerCropper.vue'

const modules = ref<{ key: string; type: 'todo' | 'calendar' | 'clock' | 'roadmap' }[]>([])
const menuOpen = ref(false)

const me = useUserStore()
const bannerUrl = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const canEditBanner = computed(() => me.role === 'ADMIN' || me.role === 'OWNER')
const siteTitle = ref('Home')
const editingTitle = ref(false)
const titleDraft = ref('Home')
const bannerWidth = 1024
const bannerHeight = 256
const cropFile = ref<File | null>(null)
const bannerMenuOpen = ref(false)
const snapMode = ref(false)

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
  cropFile.value = input.files[0]
  input.value = ''
}

async function onCropConfirm(blob: Blob) {
  const fd = new FormData()
  const mime = blob.type || 'image/jpeg'
  const ext = mime.includes('png') ? 'png' : (mime.includes('webp') ? 'webp' : 'jpg')
  fd.append('file', new File([blob], `banner.${ext}`, { type: mime }))
  const res = await $fetch<{ ok: boolean; url: string }>('/api/banner', { method: 'POST', body: fd })
  bannerUrl.value = res.url
  cropFile.value = null
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

function toggleBannerMenu() {
  bannerMenuOpen.value = !bannerMenuOpen.value
}
function openUpload() {
  bannerMenuOpen.value = false
  fileInput.value?.click()
}
async function cropExisting() {
  bannerMenuOpen.value = false
  if (!bannerUrl.value) return
  // fetch current banner as blob then open in cropper
  try {
    const res = await fetch(bannerUrl.value)
    const blob = await res.blob()
    cropFile.value = new File([blob], 'banner-current.jpg', { type: blob.type || 'image/jpeg' })
  } catch {}
}

function onClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (bannerMenuOpen.value) {
    bannerMenuOpen.value = false
  }
}

function addModule(type: 'todo' | 'calendar' | 'clock' | 'roadmap') {
  modules.value.push({ key: Math.random().toString(36).slice(2), type })
  menuOpen.value = false
}
function removeModule(key: string) {
  modules.value = modules.value.filter(m => m.key !== key)
}

onMounted(async () => {
  await Promise.all([loadBanner(), loadTitle()])
  window.addEventListener('click', onClickOutside)
})

onBeforeUnmount(() => {
  window.removeEventListener('click', onClickOutside)
})
</script>


