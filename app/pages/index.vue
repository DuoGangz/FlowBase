<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between gap-2 relative">
      <h1 class="text-2xl font-semibold">Home</h1>
      <div class="relative">
        <button class="bg-black text-white px-3 py-2 rounded" @click="toggleMenu">Add module</button>
        <div v-if="menuOpen" class="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow-md z-50">
          <button class="w-full text-left px-3 py-2 hover:bg-gray-50" @click="addModule('todo')">Todo</button>
          <button class="w-full text-left px-3 py-2 hover:bg-gray-50" @click="addModule('calendar')">Calendar</button>
        </div>
      </div>
    </div>

    <div class="grid md:grid-cols-2 gap-6">
      <component
        v-for="mod in modules"
        :key="mod.key"
        :is="mod.type === 'todo' ? TodoModuleLocal : CalendarModuleLocal"
        @remove="removeModule(mod.key)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import TodoModuleLocal from '~/components/TodoModuleLocal.vue'
import CalendarModuleLocal from '~/components/CalendarModuleLocal.vue'

const modules = ref<{ key: string; type: 'todo' | 'calendar' }[]>([])
const menuOpen = ref(false)

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function addModule(type: 'todo' | 'calendar') {
  modules.value.push({ key: Math.random().toString(36).slice(2), type })
  menuOpen.value = false
}
function removeModule(key: string) {
  modules.value = modules.value.filter(m => m.key !== key)
}
</script>


