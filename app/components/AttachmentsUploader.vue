<template>
  <form class="flex items-center gap-2" @submit.prevent="onSubmit">
    <input ref="fileInput" type="file" :disabled="uploading" />
    <button class="bg-black text-white px-3 py-2 rounded disabled:opacity-50" :disabled="uploading">
      {{ uploading ? 'Uploading...' : 'Upload' }}
    </button>
  </form>
</template>

<script setup lang="ts">
const props = defineProps<{ projectId: number }>()
const emit = defineEmits<{ (e: 'uploaded', file: any): void }>()

const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

async function onSubmit() {
  if (!fileInput.value || !fileInput.value.files || fileInput.value.files.length === 0) return
  const file = fileInput.value.files[0]
  const fd = new FormData()
  fd.append('file', file)
  uploading.value = true
  try {
    const created = await $fetch(`/api/files/${props.projectId}`, { method: 'POST', body: fd })
    emit('uploaded', created)
    if (fileInput.value) fileInput.value.value = ''
  } finally {
    uploading.value = false
  }
}
</script>


