<template>
  <div class="relative p-6 space-y-4">
    <div class="flex items-center justify-between gap-2 relative">
      <div class="w-full">
        <div class="relative mx-auto max-w-3xl border rounded-md h-40 flex items-end justify-center bg-gray-50 overflow-hidden">
          <img v-if="bannerUrl" :src="bannerUrl" alt="Banner" class="w-full h-full object-cover" />
          <div v-if="canEditBanner" class="absolute bottom-2 right-2">
            <button class="w-6 h-6 border rounded-full bg-white/80 hover:bg-white flex items-center justify-center" @click.stop="toggleBannerMenu" aria-label="Banner options">
              <span class="text-base leading-none">...</span>
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
      <div class="absolute right-4 -top-2 flex flex-col items-end gap-2">
        <div class="relative">
          <button class="bg-black text-white px-3 py-2 rounded" @click="toggleMenu" aria-label="Add module"><span class="font-bold text-xl leading-none">+</span></button>
          <div v-if="menuOpen" class="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow-md z-50">
            <button class="w-full text-left px-3 py-2 hover:bg-gray-50" @click="addModule('todo')">Todo</button>
            <button class="w-full text-left px-3 py-2 hover:bg-gray-50" @click="addModule('calendar')">Calendar</button>
            <button class="w-full text-left px-3 py-2 hover:bg-gray-50" @click="addModule('clock')">Time Clock</button>
            <button class="w-full text-left px-3 py-2 hover:bg-gray-50" @click="addModule('roadmap')">Road Map</button>
          </div>
        </div>
        <div class="relative">
          <button class="w-8 h-8 border rounded bg-white hover:bg-gray-50 flex items-center justify-center" @click.stop="togglePageMenu" aria-label="Switch page">
            <span class="text-xl leading-none">▾</span>
          </button>
          <div v-if="pageMenuOpen" class="absolute right-0 mt-2 w-56 bg-white border rounded-md shadow-md z-50">
            <div class="px-3 py-2 text-xs text-gray-500">Home Pages</div>
            <button v-for="p in pages" :key="p.id" class="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between" @click="switchPage(p.id)">
              <span :class="{ 'font-semibold': p.id === currentPageId }">{{ p.name }}</span>
              <span v-if="p.id === currentPageId" class="text-xs text-gray-500">current</span>
            </button>
            <div v-if="canManagePages" class="border-t">
              <button class="w-full text-left px-3 py-2 hover:bg-gray-50 disabled:opacity-50" :disabled="pages.length >= 4" @click="openCreatePage">+ New Page</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      class="relative mx-auto"
      ref="gridContainer"
      :class="snapMode ? '' : 'grid grid-cols-3 gap-4'"
      :style="snapMode ? { height: containerHeight + 'px', width: containerWidth + 'px' } : undefined"
    >
      
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
        :uid="mod.key"
        @remove="removeModule(mod.key)"
      />
    </div>

    <!-- Controls -->
    <div class="fixed bottom-4 right-4 z-50 flex items-center gap-3">
      <!-- Size preset (bottom-left of snapping per request) -->
      <div class="fixed bottom-4 left-4">
        <div class="inline-flex border rounded-full overflow-hidden shadow bg-white">
          <button class="px-3 py-1 text-sm" :class="sizePreset==='small' ? 'bg-black text-white' : 'text-gray-700'" @click="setPreset('small')">S</button>
          <button class="px-3 py-1 text-sm" :class="sizePreset==='medium' ? 'bg-black text-white' : 'text-gray-700'" @click="setPreset('medium')">M</button>
          <button class="px-3 py-1 text-sm" :class="sizePreset==='large' ? 'bg-black text-white' : 'text-gray-700'" @click="setPreset('large')">L</button>
        </div>
      </div>

      <!-- Snap/Free Form toggle (bottom-right) -->
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
      <!-- Create Page Modal -->
      <div v-if="showCreateModal" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
        <div class="bg-white rounded-md p-4 w-96 space-y-3">
          <h3 class="font-medium">Create New Home Page</h3>
          <input v-model="newPageName" placeholder="Page name" class="border rounded px-2 py-1 w-full" />
          <div class="flex justify-end gap-2">
            <button class="px-3 py-1 border rounded" @click="showCreateModal=false">Cancel</button>
            <button class="px-3 py-1 border rounded bg-black text-white" :disabled="!newPageName.trim()" @click="createPage">Create</button>
          </div>
        </div>
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
import { useSnapGridStore, GRID } from '~~/stores/snapGrid'

const modules = ref<{ key: string; type: 'todo' | 'calendar' | 'clock' | 'roadmap' }[]>([])
const menuOpen = ref(false)
const pageMenuOpen = ref(false)
const pages = ref<{ id:number; name:string; isDefault:boolean }[]>([])
const currentPageId = ref<number | null>(null)
const showCreateModal = ref(false)
const newPageName = ref('')

const me = useUserStore()
const meServer = ref<{ id:number; role:'OWNER'|'ADMIN'|'MANAGER'|'USER' } | null>(null)
const bannerUrl = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const canEditBanner = computed(() => (meServer.value ? (meServer.value.role === 'ADMIN' || meServer.value.role === 'OWNER') : (me.role === 'ADMIN' || me.role === 'OWNER')))
const siteTitle = ref('Home')
const editingTitle = ref(false)
const titleDraft = ref('Home')
const bannerWidth = 1024
const bannerHeight = 256
const cropFile = ref<File | null>(null)
const bannerMenuOpen = ref(false)
const snapMode = ref(false)
const gridStore = useSnapGridStore()
const sizePreset = ref<'small'|'medium'|'large'>('medium')
const gridContainer = ref<HTMLElement | null>(null)

// Debug grid dimensions (initialize to exact pixel grid without trailing gutter)
const containerWidth = ref(GRID.COLS * GRID.colWidth + (GRID.COLS - 1) * GRID.gutterX)
const containerHeight = ref(GRID.ROWS * GRID.rowHeight + (GRID.ROWS - 1) * GRID.gutterY)
const gridStepX = GRID.stepX
const gridStepY = GRID.stepY
const gridColWidth = GRID.colWidth
const gridRowHeight = GRID.rowHeight

function measureContainer() {
  if (!gridContainer.value) return
  const w = GRID.COLS * GRID.colWidth + (GRID.COLS - 1) * GRID.gutterX
  if (w > 0) {
    containerWidth.value = w
    // keep height as a multiple of row steps for the overlay
    containerHeight.value = GRID.ROWS * GRID.rowHeight + (GRID.ROWS - 1) * GRID.gutterY
    gridStore.updateMaxCols(w)
  }
}

onMounted(() => {
  measureContainer()
  window.addEventListener('resize', measureContainer)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', measureContainer)
})

function setPreset(preset: 'small'|'medium'|'large') {
  sizePreset.value = preset
  gridStore.setSizePreset(preset)
  // recompute container to reflect new grid size
  nextTick(() => measureContainer())
}


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

function togglePageMenu() {
  pageMenuOpen.value = !pageMenuOpen.value
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
  if (pageMenuOpen.value) {
    const btn = (e.target as HTMLElement)
    // naive close; in a more robust version we'd check refs
    pageMenuOpen.value = false
  }
}

function addModule(type: 'todo' | 'calendar' | 'clock' | 'roadmap') {
  modules.value.push({ key: Math.random().toString(36).slice(2), type })
  menuOpen.value = false
  saveLayout()
}
function removeModule(key: string) {
  modules.value = modules.value.filter(m => m.key !== key)
  saveLayout()
}

const canManagePages = computed(() => (meServer.value ? (meServer.value.role === 'OWNER' || meServer.value.role === 'ADMIN') : (me.role === 'OWNER' || me.role === 'ADMIN')))

async function loadPages() {
  pages.value = await $fetch('/api/home-pages')
  if (!currentPageId.value) {
    const def = pages.value.find(p => p.isDefault) || pages.value[0]
    if (def) currentPageId.value = def.id
  }
  if (currentPageId.value) await loadLayout(currentPageId.value)
}

async function loadLayout(id: number) {
  const page = await $fetch<{ id:number; name:string; layout:any }>(`/api/home-pages/${id}`)
  modules.value = Array.isArray(page.layout?.modules) ? page.layout.modules : []
}

async function saveLayout() {
  if (!currentPageId.value) return
  try {
    await $fetch(`/api/home-pages/${currentPageId.value}`, { method: 'PUT', body: { layout: { modules: modules.value } } })
  } catch {}
}

async function switchPage(id: number) {
  currentPageId.value = id
  await loadLayout(id)
}

async function createPage() {
  if (!newPageName.value.trim()) return
  const created = await $fetch<{ id:number }>(`/api/home-pages`, { method: 'POST', body: { name: newPageName.value.trim() } })
  newPageName.value = ''
  showCreateModal.value = false
  await loadPages()
  if (created?.id) await switchPage(created.id)
}

function openCreatePage() {
  if (pages.value.length >= 4) return
  newPageName.value = ''
  showCreateModal.value = true
  pageMenuOpen.value = false
}

async function loadMe() {
  try {
    meServer.value = await $fetch('/api/auth/me')
  } catch {
    meServer.value = null
  }
}

onMounted(async () => {
  await Promise.all([loadBanner(), loadTitle(), loadPages(), loadMe()])
  window.addEventListener('click', onClickOutside)
})

onBeforeUnmount(() => {
  window.removeEventListener('click', onClickOutside)
})
</script>
