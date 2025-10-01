<template>
  <div class="p-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold">{{ project?.name }}</h1>
        <p class="text-gray-500">/{{ route.params.slug }}</p>
      </div>
      <div class="flex gap-2">
        <button @click="activeTab='messages'" :class="tabClass('messages')">Messages</button>
        <button @click="activeTab='todos'" :class="tabClass('todos')">Todos</button>
        <button @click="activeTab='roadmap'" :class="tabClass('roadmap')">Road Map</button>
        <button @click="activeTab='files'" :class="tabClass('files')">Files</button>
      </div>
    </div>

    <div class="mt-6">
      <MessageBoard v-if="activeTab==='messages'" :project-id="project?.id || 0" />

      <div v-else-if="activeTab==='todos'" class="space-y-4">
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-semibold">Todo Modules</h2>
          <button class="bg-black text-white px-3 py-2 rounded" @click="addModule">Add module</button>
        </div>
        <div class="grid md:grid-cols-2 gap-6">
          <TodoModule
            v-for="mod in todoModules"
            :key="mod.key"
            :project-id="project?.id || 0"
            :list-id="mod.listId"
            :title="mod.title"
            @created="(id)=>updateModuleListId(mod.key,id)"
            @remove="removeModule(mod.key)"
          />
        </div>
      </div>

      <div v-else-if="activeTab==='roadmap'" class="space-y-4">
        <h2 class="text-xl font-semibold">Road Map</h2>
        <RoadmapModule :project-id="project?.id || 0" />
      </div>

      <div v-else class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold">Files</h2>
          <AttachmentsUploader v-if="project" :project-id="project.id" @uploaded="onUploaded" />
        </div>
        <ul class="list-disc list-inside">
          <li v-for="f in files" :key="f.id" class="flex items-center gap-2">
            <a class="text-blue-600 underline" :href="f.path" target="_blank">{{ fileName(f.path) }}</a>
            <button class="text-red-600" @click="removeFile(f.id)">Delete</button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MessageBoard from '~/components/MessageBoard.vue'
import TodoModule from '~~/components/TodoModule.vue'
import RoadmapModule from '~~/components/RoadmapModule.vue'
import AttachmentsUploader from '~~/app/components/AttachmentsUploader.vue'

const route = useRoute()
const activeTab = ref<'messages' | 'todos' | 'roadmap' | 'files'>('messages')

const project = ref<any>(null)
const files = ref<any[]>([])
const todoModules = ref<{ key:string; listId:number|null; title:string }[]>([])
const newFilePath = ref('')

function tabClass(tab: string) {
  return [
    'px-3 py-2 rounded border',
    activeTab.value === tab ? 'bg-black text-white' : 'bg-white'
  ]
}

async function load() {
  project.value = await $fetch(`/api/projects/${route.params.slug}`)
  files.value = await $fetch(`/api/files/${project.value.id}`)
}

onMounted(load)

function addModule() {
  todoModules.value.push({ key: Math.random().toString(36).slice(2), listId: null, title: 'Todo List' })
}
function removeModule(key: string) {
  todoModules.value = todoModules.value.filter(m => m.key !== key)
}
function updateModuleListId(key: string, id: number) {
  const m = todoModules.value.find(m => m.key === key)
  if (m) m.listId = id
}

function onUploaded(file: any) {
  files.value.unshift(file)
}

function fileName(p: string) {
  try {
    return p.split('/').filter(Boolean).pop() || p
  } catch {
    return p
  }
}

async function removeFile(id: number) {
  await $fetch(`/api/files/${project.value.id}?id=${id}`, { method: 'DELETE' })
  files.value = files.value.filter(f => f.id !== id)
}
</script>



