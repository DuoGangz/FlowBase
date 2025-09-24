<template>
  <div class="p-6 space-y-6">
    <h1 class="text-2xl font-semibold">Projects</h1>
    <form class="flex gap-2" @submit.prevent="create">
      <input v-model="name" placeholder="New project name" class="border rounded px-3 py-2 w-64" />
      <input v-model="slug" placeholder="slug" class="border rounded px-3 py-2 w-48" />
      <button class="bg-black text-white px-4 py-2 rounded">Create</button>
    </form>
    <ul class="divide-y">
      <li v-for="p in projects" :key="p.id" class="py-2">
        <NuxtLink class="text-blue-600 hover:underline" :to="`/projects/${p.slug}`">{{ p.name }}</NuxtLink>
      </li>
    </ul>
  </div>
  
</template>

<script setup lang="ts">
const projects = ref<{ id:number; name:string; slug:string }[]>([])
const name = ref('')
const slug = ref('')

async function load() {
  try {
    projects.value = await $fetch('/api/projects')
  } catch (err) {
    console.warn('Failed to load projects (DB not configured yet?)')
    projects.value = []
  }
}

onMounted(load)

async function create() {
  if (!name.value || !slug.value) return
  try {
    await $fetch('/api/projects', { method: 'POST', body: { name: name.value, slug: slug.value } })
  } catch (err) {
    console.warn('Failed to create project (DB not configured yet?)')
  }
  name.value = ''
  slug.value = ''
  await load()
}
</script>




