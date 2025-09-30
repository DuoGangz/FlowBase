<template>
  <div class="border rounded p-4 space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="font-medium">{{ title }}</h3>
      <button class="text-sm text-red-600" @click="$emit('remove')">Remove</button>
    </div>

    <form class="flex gap-2" @submit.prevent="addItem">
      <input v-model="newItem" placeholder="Add item" class="border rounded px-2 py-1 flex-1" />
      <button class="bg-gray-800 text-white px-2 py-1 rounded">Add</button>
    </form>

    <ul class="space-y-2">
      <li v-for="it in items" :key="it.id" class="space-y-1">
        <div class="flex items-center gap-2">
          <input type="checkbox" v-model="it.done" @change="toggleItem(it)" />
          <span :class="{ 'line-through text-gray-500': it.done }">{{ it.content }}</span>
        </div>
        <div class="pl-6 space-y-2">
          <button
            type="button"
            class="w-6 h-6 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center"
            :aria-label="showSubForm[it.id] ? 'Hide subtask' : 'Add subtask'"
            @click="toggleSubForm(it)"
            v-if="!it.done"
          >
            <span class="text-base leading-none">+</span>
          </button>
          <form v-if="showSubForm[it.id] && !it.done" class="flex gap-2" @submit.prevent="addSubItem(it)">
            <input v-model="subItemDraft[it.id]" placeholder="Add subtask" class="border rounded px-2 py-1 flex-1" />
            <button class="border px-2 py-1 rounded">Add</button>
          </form>
          <ul class="space-y-1">
            <li
              v-for="sub in visibleSubItems(it)"
              :key="sub.id"
              class="flex items-center gap-2"
            >
              <input type="checkbox" v-model="sub.done" @change="toggleSubItem(sub)" />
              <span :class="{ 'line-through text-gray-400': sub.done }">{{ sub.content }}</span>
            </li>
          </ul>
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
const newItem = ref('')
const listId = ref<number | null>(props.listId ?? null)
const subItemDraft = reactive<Record<number, string>>({})
const showSubForm = reactive<Record<number, boolean>>({})

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
  await load()
}

async function toggleSubItem(sub: SubItem) {
  await $fetch('/api/todo-subitems', { method: 'PUT', body: { id: sub.id, done: sub.done } })
}
</script>











