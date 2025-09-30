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
      <li v-for="(it, idx) in items" :key="idx" class="space-y-1">
        <div class="flex items-center gap-2">
          <input type="checkbox" v-model="it.done" />
          <span :class="{ 'line-through text-gray-500': it.done }">{{ it.content }}</span>
        </div>
        <div class="pl-6 space-y-2">
          <button
            type="button"
            class="mt-1 w-8 h-8 rounded-full border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center"
            :aria-label="showSubForm[idx] ? 'Hide subtask' : 'Add subtask'"
            @click="toggleSubForm(idx)"
            v-if="!it.done"
          >
            <span class="text-lg leading-none">+</span>
          </button>
          <form v-if="showSubForm[idx] && !it.done" class="flex gap-2" @submit.prevent="addSubItem(idx)">
            <input v-model="subDraft[idx]" placeholder="Add subtask" class="border rounded px-2 py-1 flex-1" />
            <button class="border px-2 py-1 rounded">Add</button>
          </form>
          <ul class="space-y-1">
            <li v-for="(sub, sIdx) in visibleSubItems(it)" :key="sIdx" class="flex items-center gap-2">
              <input type="checkbox" v-model="sub.done" />
              <span :class="{ 'line-through text-gray-400': sub.done }">{{ sub.content }}</span>
            </li>
          </ul>
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
}

function toggleSubForm(idx: number) {
  showSubForm[idx] = !showSubForm[idx]
}
</script>











