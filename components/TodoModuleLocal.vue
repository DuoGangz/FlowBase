<template>
  <div class="border rounded p-4 space-y-3">
    <div class="flex items-center justify-between">
      <input v-model="title" class="font-medium w-full mr-2 border-b" />
      <button class="text-sm text-red-600" @click="$emit('remove')">Remove</button>
    </div>
    <form class="flex gap-2" @submit.prevent="addItem">
      <input v-model="newItem" placeholder="Add item" class="border rounded px-2 py-1 flex-1" />
      <button class="bg-gray-800 text-white px-2 py-1 rounded">Add</button>
    </form>
    <ul class="space-y-2">
      <li
        v-for="(it, idx) in items"
        :key="idx"
        class="space-y-1"
        draggable="true"
        @dragstart="onItemDragStart(idx)"
        @dragover.prevent="onItemDragOver(idx)"
        @drop.prevent="onItemDrop(idx)"
        :class="{ 'bg-gray-50 rounded': dragOverItemIdx===idx }"
      >
        <div class="flex items-center gap-2">
          <input type="checkbox" v-model="it.done" />
          <span :class="{ 'line-through text-gray-500': it.done }">{{ it.content }}</span>
          <div class="ml-auto inline-flex gap-1">
            <button class="px-2 py-0.5 border rounded text-xs" @click="moveItem(idx, -1)">↑</button>
            <button class="px-2 py-0.5 border rounded text-xs" @click="moveItem(idx, 1)">↓</button>
          </div>
        </div>
        <div class="pl-6 space-y-2">
          <ul class="space-y-1">
            <li
              v-for="(sub, sIdx) in visibleSubItems(it)"
              :key="sIdx"
              class="flex items-center gap-2"
              draggable="true"
              @dragstart="onSubDragStart(idx, sIdx)"
              @dragover.prevent="onSubDragOver(idx, sIdx)"
              @drop.prevent="onSubDrop(idx, sIdx)"
              :class="{ 'bg-gray-50 rounded': dragOverParentIdx===idx && dragOverSubIdx===sIdx }"
            >
              <input type="checkbox" v-model="sub.done" />
              <span :class="{ 'line-through text-gray-400': sub.done }">{{ sub.content }}</span>
              <div class="ml-auto inline-flex gap-1">
                <button class="px-2 py-0.5 border rounded text-xs" @click="moveSubItem(idx, sIdx, -1)">↑</button>
                <button class="px-2 py-0.5 border rounded text-xs" @click="moveSubItem(idx, sIdx, 1)">↓</button>
              </div>
            </li>
          </ul>
          <!-- Input shows after plus pressed -->
          <form v-if="showSubForm[idx] && !it.done" class="flex gap-2" @submit.prevent="addSubItem(idx)">
            <input v-model="subDraft[idx]" placeholder="Add subtask" class="border rounded px-2 py-1 flex-1" />
            <button class="border px-2 py-1 rounded">Add</button>
          </form>
          <!-- Plus icon always at the bottom -->
          <button
            v-if="!it.done"
            type="button"
            class="w-8 h-8 rounded-full border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center"
            :aria-label="showSubForm[idx] ? 'Hide subtask input' : 'Add subtask'"
            @click="toggleSubForm(idx)"
          >
            <span class="text-lg leading-none">+</span>
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
const title = ref('Todo List')
type LocalSub = { content:string; done:boolean }
type LocalItem = { content:string; done:boolean; subItems?: LocalSub[] }
const items = ref<LocalItem[]>([])
const newItem = ref('')
const subDraft = reactive<Record<number, string>>({})
const showSubForm = reactive<Record<number, boolean>>({})
const dragOverItemIdx = ref<number | null>(null)
const dragOverParentIdx = ref<number | null>(null)
const dragOverSubIdx = ref<number | null>(null)
const dragState = reactive<{ type:'item'|'sub'|null; itemIdx?:number; parentIdx?:number; subIdx?:number }>({ type: null })

function addItem() {
  if (!newItem.value) return
  items.value.push({ content: newItem.value, done: false, subItems: [] })
  newItem.value = ''
}

function visibleSubItems(it: LocalItem) {
  if (it.done) return []
  return it.subItems ?? []
}

function addSubItem(idx: number) {
  const txt = subDraft[idx]
  if (!txt) return
  const it = items.value[idx]
  if (!it.subItems) it.subItems = []
  it.subItems.push({ content: txt, done: false })
  subDraft[idx] = ''
  showSubForm[idx] = false
}

function toggleSubForm(idx: number) {
  showSubForm[idx] = !showSubForm[idx]
}

function moveItem(idx: number, dir: 1 | -1) {
  const target = idx + dir
  if (target < 0 || target >= items.value.length) return
  const copy = items.value.slice()
  const [moved] = copy.splice(idx, 1)
  copy.splice(target, 0, moved)
  items.value = copy
}

function moveSubItem(parentIdx: number, subIdx: number, dir: 1 | -1) {
  const parent = items.value[parentIdx]
  if (!parent.subItems) parent.subItems = []
  const target = subIdx + dir
  if (target < 0 || target >= parent.subItems.length) return
  const arr = parent.subItems.slice()
  const [moved] = arr.splice(subIdx, 1)
  arr.splice(target, 0, moved)
  parent.subItems = arr
}

function onItemDragStart(idx: number) {
  dragState.type = 'item'
  dragState.itemIdx = idx
}
function onItemDragOver(idx: number) {
  dragOverItemIdx.value = idx
}
function onItemDrop(idx: number) {
  if (dragState.type !== 'item' || dragState.itemIdx === undefined) return
  if (dragState.itemIdx === idx) return
  moveItem(dragState.itemIdx, idx > dragState.itemIdx ? 1 : -1)
  const copy = items.value.slice()
  const [moved] = copy.splice(dragState.itemIdx, 1)
  copy.splice(idx, 0, moved)
  items.value = copy
  dragOverItemIdx.value = null
  dragState.type = null
}

function onSubDragStart(parentIdx: number, subIdx: number) {
  dragState.type = 'sub'
  dragState.parentIdx = parentIdx
  dragState.subIdx = subIdx
}
function onSubDragOver(parentIdx: number, subIdx: number) {
  dragOverParentIdx.value = parentIdx
  dragOverSubIdx.value = subIdx
}
function onSubDrop(parentIdx: number, subIdx: number) {
  if (dragState.type !== 'sub' || dragState.parentIdx !== parentIdx || dragState.subIdx === undefined) return
  if (dragState.subIdx === subIdx) return
  moveSubItem(parentIdx, dragState.subIdx, subIdx > dragState.subIdx ? 1 : -1)
  const parent = items.value[parentIdx]
  const arr = (parent.subItems ?? []).slice()
  const [moved] = arr.splice(dragState.subIdx, 1)
  arr.splice(subIdx, 0, moved)
  parent.subItems = arr
  dragOverParentIdx.value = null
  dragOverSubIdx.value = null
  dragState.type = null
}
</script>











