<template>
  <div class="space-y-4">
    <form class="space-y-2" @submit.prevent="create">
      <input v-model="title" placeholder="Title" class="border rounded px-3 py-2 w-full" />
      <textarea v-model="content" placeholder="Write a message..." class="border rounded px-3 py-2 w-full h-24"></textarea>
      <button class="bg-black text-white px-4 py-2 rounded">Post</button>
    </form>
    <ul class="divide-y">
      <li v-for="m in messages" :key="m.id" class="py-3">
        <p class="font-medium">{{ m.title }}</p>
        <p class="text-gray-700 whitespace-pre-line">{{ m.content }}</p>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'
const props = defineProps<{ projectId: number }>()
const { id: userId } = storeToRefs(useUserStore())

const messages = ref<any[]>([])
const title = ref('')
const content = ref('')

async function load() {
  messages.value = await $fetch(`/api/messages/${props.projectId}`)
}

onMounted(load)
watch(() => props.projectId, load)

async function create() {
  if (!title.value || !content.value) return
  await $fetch(`/api/messages/${props.projectId}`, { method: 'POST', body: { title: title.value, content: content.value, userId: userId.value } })
  title.value = ''
  content.value = ''
  await load()
}
</script>


