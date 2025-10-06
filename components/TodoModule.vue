<template>
  <div class="border rounded p-4 space-y-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <h3 class="font-medium">{{ title }}</h3>
        <!-- Add button: black bg with white plus -->
        <button
          type="button"
          class="w-7 h-7 rounded-md bg-black text-white flex items-center justify-center hover:opacity-90"
          title="Add todo"
          @click="toggleAddForm"
        >
          +
        </button>
      </div>
      <button class="text-sm text-red-600" @click="$emit('remove')">Remove</button>
    </div>

    <form v-if="showAdd" class="flex gap-2" @submit.prevent="addItem">
      <input v-model="newItem" placeholder="Add item" class="border rounded px-2 py-1 flex-1" />
      <button class="bg-gray-800 text-white px-2 py-1 rounded">Add</button>
    </form>

    <transition-group name="todo" tag="ul" class="space-y-2" @dragover.prevent @drop.prevent="onItemDropToEnd">
      <li
        v-for="it in filteredItems"
        :key="it.id"
        class="space-y-1 cursor-move"
        v-if="isItemRenderable(it)"
        draggable="true"
        @dragstart="onItemDragStart(it, $event)"
        @dragover.prevent="onItemDragOver(it, $event)"
        @drop.prevent="onItemDrop(it)"
        :class="{ 'bg-gray-50 rounded': dragOverItemId===it.id }"
        :ref="el => setItemRef(it.id, el as HTMLElement)"
      >
        <div class="flex items-center gap-2">
          <input type="checkbox" :checked="Boolean(it?.done)" @change="(e:any)=>toggleItemChecked(it, e?.target?.checked)" />
          <span :class="{ 'line-through text-gray-500': Boolean(it?.done) }">{{ it?.content ?? '' }}</span>
          <div class="ml-auto inline-flex gap-1">
            <button class="px-2 py-0.5 border rounded text-xs" @click="moveItem(it, -1)">↑</button>
            <button class="px-2 py-0.5 border rounded text-xs" @click="moveItem(it, 1)">↓</button>
          </div>
        </div>
        <div class="pl-6 space-y-2" v-if="Array.isArray(it.subItems)">
          <ul class="space-y-1" v-if="Array.isArray(it.subItems)" @dragover.prevent @drop.prevent="onSubDropToEnd(it)">
            <li
              v-for="sub in visibleSubItemsFiltered(it)"
              :key="sub?.id ?? Math.random()"
              class="flex items-center gap-2"
              draggable="true"
              @dragstart="onSubDragStart(it, sub, $event)"
              @dragover.prevent="onSubDragOver(it, sub)"
              @drop.prevent="onSubDrop(it, sub)"
              :class="{ 'bg-gray-50 rounded': dragOverSubId===sub.id && dragOverParentId===it.id }"
            >
              <input type="checkbox" :checked="Boolean(sub?.done)" @change="(e:any)=>toggleSubItemChecked(sub, e?.target?.checked)" />
              <span :class="{ 'line-through text-gray-400': Boolean(sub?.done) }">{{ sub?.content ?? '' }}</span>
              <div class="ml-auto inline-flex gap-1">
                <button class="px-2 py-0.5 border rounded text-xs" @click="moveSubItem(it, sub, -1)">↑</button>
                <button class="px-2 py-0.5 border rounded text-xs" @click="moveSubItem(it, sub, 1)">↓</button>
              </div>
            </li>
          </ul>
          <form v-if="showSubForm[it.id] && !it.done" class="flex gap-2" @submit.prevent="addSubItem(it)">
            <input v-model="subItemDraft[it.id]" placeholder="Add subtask" class="border rounded px-2 py-1 flex-1" />
            <button class="border px-2 py-1 rounded">Add</button>
          </form>
        </div>
      </li>
    </transition-group>
  <div class="mt-2">
      <div class="inline-flex border rounded overflow-hidden">
        <button class="px-2 py-1 text-xs" :class="view==='inprogress' ? 'bg-black text-white' : ''" @click="view='inprogress'">In Progress</button>
        <button class="px-2 py-1 text-xs" :class="view==='completed' ? 'bg-black text-white' : ''" @click="view='completed'">Completed</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ projectId: number; listId?: number; title?: string }>()
const emit = defineEmits<{ (e:'created', listId:number):void; (e:'remove'):void }>()

const title = computed(() => props.title ?? 'Todo List')
type SubItem = { id:number; content:string; done:boolean; todoItemId:number }
type Item = { id:number; content:string; done:boolean; subItems?: SubItem[] }
const items = ref<Item[]>([])
const view = ref<'inprogress' | 'completed'>('inprogress')
const newItem = ref('')
const listId = ref<number | null>(props.listId ?? null)
const subItemDraft = reactive<Record<number, string>>({})
const showSubForm = reactive<Record<number, boolean>>({})
const showAdd = ref(false)
const dragState = reactive<{ type:'item'|'sub'|null; itemId?:number; subId?:number; parentId?:number }>({ type: null })
const dragOverItemId = ref<number | null>(null)
const dragOverParentId = ref<number | null>(null)
const dragOverSubId = ref<number | null>(null)

const filteredItems = computed(() => {
  const arr = Array.isArray(items.value) ? items.value : []
  return arr.filter((it: any) => it && (view.value === 'inprogress' ? !Boolean(it.done) : Boolean(it.done)))
})

// Track item element refs for center-aware dragover targeting to reduce jitter
const itemEls = new Map<number, HTMLElement>()
function setItemRef(id: number, el: HTMLElement | null) {
  if (!el) { itemEls.delete(id); return }
  itemEls.set(id, el)
}

onMounted(async () => {
  await init()
})

watch(() => props.listId, async (v) => {
  if (v && v !== listId.value) {
    listId.value = v
    await load()
  }
})
watch(() => props.projectId, async (v) => {
  if (v && v > 0) {
    await init()
  }
})

async function load() {
  if (!listId.value) return
  const lists = await $fetch(`/api/todos/${props.projectId}`)
  const found = lists.find((l:any) => l.id === listId.value)
  const raw: any[] = Array.isArray(found?.items) ? found.items : []
  items.value = raw
    .filter((it: any) => it && typeof it.id === 'number')
    .map((it: any) => ({
      id: it.id,
      content: String(it.content ?? it.title ?? ''),
      done: Boolean(it.done),
      subItems: Array.isArray(it.subItems)
        ? it.subItems.filter((s:any)=>s&&typeof s.id==='number').map((s:any)=>({ id:s.id, content:String(s.content||''), done:Boolean(s.done), todoItemId:Number(s.todoItemId||it.id) }))
        : []
    })) as Item[]
}
async function init() {
  try {
    if (!props.projectId || props.projectId <= 0) return
    if (!listId.value) {
      const created = await $fetch(`/api/todos/${props.projectId}`, { method: 'POST', body: { title: title.value } })
      listId.value = created.id
      emit('created', created.id)
    }
    await load()
  } catch (e) {
    console.error('TodoModule init failed', e)
  }
}

async function addItem() {
  if (!newItem.value || !listId.value) return
  await $fetch('/api/todo-items', { method: 'POST', body: { todoId: listId.value, content: newItem.value } })
  newItem.value = ''
  showAdd.value = false
  await load()
}

async function toggleItem(it: { id:number; done:boolean }) {
  await $fetch('/api/todo-items', { method: 'PUT', body: { id: it.id, done: it.done } })
}

async function toggleItemChecked(it: any, checked: boolean) {
  if (!it || typeof it.id !== 'number') return
  it.done = Boolean(checked)
  await $fetch('/api/todo-items', { method: 'PUT', body: { id: it.id, done: it.done } })
  // Reload to ensure the list reflects server state and ordering
  await load()
}

function visibleSubItems(it: Item) {
  // Show all subtasks while parent is not done; after parent is done, they can be hidden
  // Requirement: "these will not disappear until the main task is complete"
  // We interpret as: keep showing until parent done; once done, show none.
  if (!it || typeof it !== 'object') return []
  if (it.done) return []
  return Array.isArray(it.subItems) ? it.subItems : []
}

function isItemRenderable(it: any) {
  return it && typeof it === 'object' && 'done' in it && 'id' in it
}

const visibleSubItemsFiltered = (it: Item) => (visibleSubItems(it) || []).filter(s => s && typeof s === 'object')

function toggleSubForm(it: Item) {
  showSubForm[it.id] = !showSubForm[it.id]
}

async function addSubItem(it: Item) {
  if (!subItemDraft[it.id]) return
  await $fetch('/api/todo-subitems', { method: 'POST', body: { todoItemId: it.id, content: subItemDraft[it.id] } })
  subItemDraft[it.id] = ''
  // hide input by default once a subtask exists
  showSubForm[it.id] = false
  await load()
}

async function toggleSubItem(sub: SubItem) {
  await $fetch('/api/todo-subitems', { method: 'PUT', body: { id: sub.id, done: sub.done } })
}

async function toggleSubItemChecked(sub: any, checked: boolean) {
  if (!sub || typeof sub.id !== 'number') return
  sub.done = Boolean(checked)
  await $fetch('/api/todo-subitems', { method: 'PUT', body: { id: sub.id, done: sub.done } })
}

function toggleAddForm() {
  showAdd.value = !showAdd.value
}

function reorder<T extends { id:number }>(arr: T[], id: number, dir: 1 | -1) {
  const idx = arr.findIndex(a => a.id === id)
  if (idx < 0) return arr
  const target = idx + dir
  if (target < 0 || target >= arr.length) return arr
  const copy = arr.slice()
  const [moved] = copy.splice(idx, 1)
  copy.splice(target, 0, moved)
  return copy
}

async function moveItem(it: Item, dir: 1 | -1) {
  items.value = reorder(items.value, it.id, dir)
  const order = items.value.map((x, i) => ({ id: x.id, position: i }))
  await $fetch('/api/todo-items', { method: 'PUT', body: { order } })
}

async function moveSubItem(parent: Item, sub: SubItem, dir: 1 | -1) {
  const current = parent.subItems ?? []
  parent.subItems = reorder(current, sub.id, dir)
  const order = (parent.subItems ?? []).map((x, i) => ({ id: x.id, position: i }))
  await $fetch('/api/todo-subitems', { method: 'PUT', body: { order } })
}

// Create a visual drag preview that matches the item so it follows the cursor
function setDragPreviewFromEl(targetEl: HTMLElement | null, e?: DragEvent) {
  try {
    if (!targetEl || !e || !e.dataTransfer) return
    const r = targetEl.getBoundingClientRect()
    const clone = targetEl.cloneNode(true) as HTMLElement
    Object.assign(clone.style, {
      position: 'fixed',
      left: '-10000px',
      top: '-10000px',
      width: Math.max(1, Math.round(r.width)) + 'px',
      height: Math.max(1, Math.round(r.height)) + 'px',
      boxSizing: 'border-box',
      background: 'white',
      opacity: '0.95',
      pointerEvents: 'none',
      borderRadius: '8px',
      boxShadow: '0 6px 16px rgba(0,0,0,0.15)'
    } as CSSStyleDeclaration)
    document.body.appendChild(clone)
    const ox = Math.max(0, Math.round((e.clientX || 0) - r.left))
    const oy = Math.max(0, Math.round((e.clientY || 0) - r.top))
    e.dataTransfer.setDragImage(clone, ox, oy)
    // Remove the node on next frame; browsers keep an internal snapshot
    requestAnimationFrame(() => { try { clone.parentNode?.removeChild(clone) } catch {} })
  } catch {}
}

function onItemDragStart(it: Item, e?: DragEvent) {
  dragState.type = 'item'
  dragState.itemId = it.id
  try {
    if (e && e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
      // Set custom MIME to avoid text/link drag icon in Safari
      e.dataTransfer.setData('application/x-drag', String(it.id))
    }
  } catch {}
  setDragPreviewFromEl(itemEls.get(it.id) || null, e)
}
function onItemDragOver(it: Item, e?: DragEvent) {
  dragOverItemId.value = it.id
  if (dragState.type !== 'item' || dragState.itemId === undefined || dragState.itemId === it.id) return
  const fromIdx = items.value.findIndex(x => x.id === dragState.itemId)
  const overIdx = items.value.findIndex(x => x.id === it.id)
  if (fromIdx < 0 || overIdx < 0) return
  let targetIdx = overIdx
  const el = itemEls.get(it.id)
  if (el && e) {
    const r = el.getBoundingClientRect()
    const center = r.top + r.height / 2
    const threshold = 6
    const delta = e.clientY - center
    const below = delta > threshold
    targetIdx = overIdx + (below ? 1 : 0)
  }
  if (targetIdx > fromIdx) targetIdx -= 1
  if (targetIdx === fromIdx || targetIdx < 0 || targetIdx > items.value.length - 1) return
  const copy = items.value.slice()
  const [moved] = copy.splice(fromIdx, 1)
  copy.splice(targetIdx, 0, moved)
  items.value = copy
  try { if (e && e.dataTransfer) e.dataTransfer.dropEffect = 'move' } catch {}
}
async function onItemDrop(it: Item) {
  if (dragState.type !== 'item' || dragState.itemId === undefined) return
  dragOverItemId.value = null
  dragState.type = null
  const order = items.value.map((x, i) => ({ id: x.id, position: i }))
  await $fetch('/api/todo-items', { method: 'PUT', body: { order } })
}

function onSubDragStart(parent: Item, sub: SubItem, e?: DragEvent) {
  dragState.type = 'sub'
  dragState.parentId = parent.id
  dragState.subId = sub.id
  try {
    if (e && e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('application/x-drag-sub', String(sub.id))
    }
  } catch {}
  // Optional: preview for sub-item as well
  const parentEl = itemEls.get(parent.id) || null
  setDragPreviewFromEl(parentEl, e)
}
function onSubDragOver(parent: Item, sub: SubItem) {
  dragOverParentId.value = parent.id
  dragOverSubId.value = sub.id
}
async function onSubDrop(parent: Item, sub: SubItem) {
  if (dragState.type !== 'sub' || dragState.parentId !== parent.id || dragState.subId === undefined) return
  if (dragState.subId === sub.id) return
  const list = parent.subItems ?? []
  const fromIdx = list.findIndex(x => x.id === dragState.subId)
  const toIdx = list.findIndex(x => x.id === sub.id)
  if (fromIdx < 0 || toIdx < 0) return
  const copy = list.slice()
  const [moved] = copy.splice(fromIdx, 1)
  const target = toIdx > fromIdx ? toIdx - 1 : toIdx
  copy.splice(target, 0, moved)
  parent.subItems = copy
  dragOverParentId.value = null
  dragOverSubId.value = null
  dragState.type = null
  const order = (parent.subItems ?? []).map((x, i) => ({ id: x.id, position: i }))
  await $fetch('/api/todo-subitems', { method: 'PUT', body: { order } })
}

async function onSubDropToEnd(parent: Item) {
  if (dragState.type !== 'sub' || dragState.parentId !== parent.id || dragState.subId === undefined) return
  const list = parent.subItems ?? []
  const fromIdx = list.findIndex(x => x.id === dragState.subId)
  if (fromIdx < 0) return
  const copy = list.slice()
  const [moved] = copy.splice(fromIdx, 1)
  copy.push(moved)
  parent.subItems = copy
  dragOverParentId.value = null
  dragOverSubId.value = null
  dragState.type = null
  const order = (parent.subItems ?? []).map((x, i) => ({ id: x.id, position: i }))
  await $fetch('/api/todo-subitems', { method: 'PUT', body: { order } })
}
</script>

<style scoped>
.todo-move { transition: transform 150ms ease; }
</style>
</style>
