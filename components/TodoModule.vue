<template>
  <div class="border rounded p-4 space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="font-medium">{{ title }}</h3>
      <div class="flex items-center gap-2">
        <div class="inline-flex border rounded overflow-hidden">
          <button class="px-2 py-1 text-xs" :class="view==='inprogress' ? 'bg-black text-white' : ''" @click="view='inprogress'">In Progress</button>
          <button class="px-2 py-1 text-xs" :class="view==='completed' ? 'bg-black text-white' : ''" @click="view='completed'">Completed</button>
        </div>
        <button class="text-sm text-red-600" @click="$emit('remove')">Remove</button>
      </div>
    </div>

    <form class="flex gap-2" @submit.prevent="addItem">
      <input v-model="newItem" placeholder="Add item" class="border rounded px-2 py-1 flex-1" />
      <button class="bg-gray-800 text-white px-2 py-1 rounded">Add</button>
    </form>

    <ul class="space-y-2">
      <li
        v-for="it in items"
        :key="it.id"
        class="space-y-1"
        v-if="view==='inprogress' ? !it.done : it.done"
        draggable="true"
        @dragstart="onItemDragStart(it)"
        @dragover.prevent="onItemDragOver(it)"
        @drop.prevent="onItemDrop(it)"
        :class="{ 'bg-gray-50 rounded': dragOverItemId===it.id }"
      >
        <div class="flex items-center gap-2">
          <input type="checkbox" v-model="it.done" @change="toggleItem(it)" />
          <span :class="{ 'line-through text-gray-500': it.done }">{{ it.content }}</span>
          <div class="ml-auto inline-flex gap-1">
            <button class="px-2 py-0.5 border rounded text-xs" @click="moveItem(it, -1)">↑</button>
            <button class="px-2 py-0.5 border rounded text-xs" @click="moveItem(it, 1)">↓</button>
          </div>
        </div>
        <div class="pl-6 space-y-2">
          <ul class="space-y-1" @dragover.prevent @drop.prevent="onSubDropToEnd(it)">
            <li
              v-for="sub in visibleSubItems(it)"
              :key="sub.id"
              class="flex items-center gap-2"
              draggable="true"
              @dragstart="onSubDragStart(it, sub, $event)"
              @dragover.prevent="onSubDragOver(it, sub)"
              @drop.prevent="onSubDrop(it, sub)"
              :class="{ 'bg-gray-50 rounded': dragOverSubId===sub.id && dragOverParentId===it.id }"
            >
              <input type="checkbox" v-model="sub.done" @change="toggleSubItem(sub)" />
              <span :class="{ 'line-through text-gray-400': sub.done }">{{ sub.content }}</span>
              <div class="ml-auto inline-flex gap-1">
                <button class="px-2 py-0.5 border rounded text-xs" @click="moveSubItem(it, sub, -1)">↑</button>
                <button class="px-2 py-0.5 border rounded text-xs" @click="moveSubItem(it, sub, 1)">↓</button>
              </div>
            </li>
          </ul>
          <!-- Input appears after pressing plus -->
          <form v-if="showSubForm[it.id] && !it.done" class="flex gap-2" @submit.prevent="addSubItem(it)">
            <input v-model="subItemDraft[it.id]" placeholder="Add subtask" class="border rounded px-2 py-1 flex-1" />
            <button class="border px-2 py-1 rounded">Add</button>
          </form>
          <!-- Plus icon always rendered at the bottom (below list or input) -->
          <button
            v-if="!it.done"
            type="button"
            class="w-8 h-8 rounded-full border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center"
            :aria-label="showSubForm[it.id] ? 'Hide subtask input' : 'Add subtask'"
            @click="toggleSubForm(it)"
          >
            <span class="text-lg leading-none">+</span>
          </button>
        </div>
      </li>
    </ul>
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
const dragState = reactive<{ type:'item'|'sub'|null; itemId?:number; subId?:number; parentId?:number }>({ type: null })
const dragOverItemId = ref<number | null>(null)
const dragOverParentId = ref<number | null>(null)
const dragOverSubId = ref<number | null>(null)

onMounted(async () => {
  if (!listId.value) {
    const created = await $fetch(`/api/todos/${props.projectId}`, { method: 'POST', body: { title: title.value } })
    listId.value = created.id
    emit('created', created.id)
  }
  await load()
})

watch(() => props.listId, async (v) => {
  if (v && v !== listId.value) {
    listId.value = v
    await load()
  }
})

async function load() {
  if (!listId.value) return
  const lists = await $fetch(`/api/todos/${props.projectId}`)
  const found = lists.find((l:any) => l.id === listId.value)
  items.value = (found?.items ?? []) as Item[]
}

async function addItem() {
  if (!newItem.value || !listId.value) return
  await $fetch('/api/todo-items', { method: 'POST', body: { todoId: listId.value, content: newItem.value } })
  newItem.value = ''
  await load()
}

async function toggleItem(it: { id:number; done:boolean }) {
  await $fetch('/api/todo-items', { method: 'PUT', body: { id: it.id, done: it.done } })
}

function visibleSubItems(it: Item) {
  // Show all subtasks while parent is not done; after parent is done, they can be hidden
  // Requirement: "these will not disappear until the main task is complete"
  // We interpret as: keep showing until parent done; once done, show none.
  if (it.done) return []
  return (it.subItems ?? [])
}

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

function onItemDragStart(it: Item) {
  dragState.type = 'item'
  dragState.itemId = it.id
}
function onItemDragOver(it: Item) {
  dragOverItemId.value = it.id
}
async function onItemDrop(it: Item) {
  if (dragState.type !== 'item' || dragState.itemId === undefined) return
  if (dragState.itemId === it.id) return
  const fromIdx = items.value.findIndex(x => x.id === dragState.itemId)
  const toIdx = items.value.findIndex(x => x.id === it.id)
  if (fromIdx < 0 || toIdx < 0) return
  const copy = items.value.slice()
  const [moved] = copy.splice(fromIdx, 1)
  copy.splice(toIdx, 0, moved)
  items.value = copy
  dragOverItemId.value = null
  dragState.type = null
  const order = items.value.map((x, i) => ({ id: x.id, position: i }))
  await $fetch('/api/todo-items', { method: 'PUT', body: { order } })
}

function onSubDragStart(parent: Item, sub: SubItem, e?: DragEvent) {
  dragState.type = 'sub'
  dragState.parentId = parent.id
  dragState.subId = sub.id
  try { e?.dataTransfer?.setData('text/plain', String(sub.id)) } catch {}
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











