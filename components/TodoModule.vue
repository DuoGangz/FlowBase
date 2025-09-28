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

    <ul class="space-y-1">
      <li v-for="it in items" :key="it.id" class="flex items-center gap-2">
        <input type="checkbox" v-model="it.done" @change="toggleItem(it)" />
        <span :class="{ 'line-through text-gray-500': it.done }">{{ it.content }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ projectId: number; listId?: number; title?: string }>()
const emit = defineEmits<{ (e:'created', listId:number):void; (e:'remove'):void }>()

const title = computed(() => props.title ?? 'Todo List')
const items = ref<{ id:number; content:string; done:boolean }[]>([])
const newItem = ref('')
const listId = ref<number | null>(props.listId ?? null)

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
  items.value = found?.items ?? []
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
</script>









