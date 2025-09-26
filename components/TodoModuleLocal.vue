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
    <ul class="space-y-1">
      <li v-for="(it, idx) in items" :key="idx" class="flex items-center gap-2">
        <input type="checkbox" v-model="it.done" />
        <span :class="{ 'line-through text-gray-500': it.done }">{{ it.content }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
const title = ref('Todo List')
const items = ref<{ content:string; done:boolean }[]>([])
const newItem = ref('')

function addItem() {
  if (!newItem.value) return
  items.value.push({ content: newItem.value, done: false })
  newItem.value = ''
}
</script>






