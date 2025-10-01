<template>
  <div class="border rounded p-4 space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="font-medium">{{ title }}</h3>
      <button class="text-sm text-red-600" @click="$emit('remove')">Remove</button>
    </div>

    <form class="flex items-center gap-2" @submit.prevent="onUpload">
      <input ref="fileInput" type="file" :disabled="uploading" />
      <button class="bg-gray-800 text-white px-3 py-1 rounded disabled:opacity-50" :disabled="uploading">
        {{ uploading ? 'Uploading...' : 'Upload' }}
      </button>
    </form>

    <ul class="space-y-1">
      <li v-for="f in files" :key="f.id" class="flex items-center gap-2">
        <a class="text-blue-600 underline" :href="f.path" target="_blank">{{ fileName(f.path) }}</a>
        <span class="text-gray-400 text-xs" v-if="sizeOf(f)">({{ sizeOf(f) }})</span>
        <button class="text-red-600 text-sm ml-auto" @click="remove(f)">Delete</button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ projectId: number; title?: string; scope?: 'shared' | 'private' }>()
defineEmits<{ (e:'remove'): void }>()

const title = computed(() => props.title ?? (props.scope === 'private' ? 'My Attachments' : 'Shared Attachments'))
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const files = ref<any[]>([])

onMounted(load)
watch(() => props.projectId, () => load())

async function load() {
  if (!props.projectId) return
  const scope = props.scope || 'shared'
  files.value = await $fetch(`/api/files/${props.projectId}?scope=${scope}`)
}

async function onUpload() {
  if (!fileInput.value || !fileInput.value.files || fileInput.value.files.length === 0) return
  const file = fileInput.value.files[0]
  const fd = new FormData()
  fd.append('file', file)
  uploading.value = true
  try {
    const scope = props.scope || 'shared'
    const created = await $fetch(`/api/files/${props.projectId}?scope=${scope}`, { method: 'POST', body: fd })
    files.value.unshift(created)
    if (fileInput.value) fileInput.value.value = ''
  } finally {
    uploading.value = false
  }
}

function fileName(p: string) {
  try { return p.split('/').filter(Boolean).pop() || p } catch { return p }
}

function sizeOf(f: any) {
  const size = f?.metadata?.size
  if (!size || typeof size !== 'number') return ''
  if (size < 1024) return `${size} B`
  if (size < 1024*1024) return `${Math.round(size/1024)} KB`
  return `${(size/1024/1024).toFixed(1)} MB`
}

async function remove(f: any) {
  await $fetch(`/api/files/${props.projectId}?id=${f.id}`, { method: 'DELETE' })
  files.value = files.value.filter(x => x.id !== f.id)
}
</script>


