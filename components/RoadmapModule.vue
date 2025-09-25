<template>
  <div class="border rounded p-4 space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="font-medium">Road Map</h3>
      <button class="text-sm text-red-600" @click="$emit('remove')">Remove</button>
    </div>

    <form class="flex flex-col md:flex-row gap-2" @submit.prevent="addEntry">
      <input v-model="description" placeholder="Short description" class="border rounded px-2 py-1 flex-1" />
      <input v-model="dateStr" type="date" class="border rounded px-2 py-1" />
      <button class="bg-gray-800 text-white px-2 py-1 rounded">Add</button>
    </form>
    <div class="w-full overflow-x-auto">
      <svg :viewBox="`0 0 ${TW} ${TH}`" class="w-full min-w-[600px]" preserveAspectRatio="xMidYMid meet">
        <line :x1="P" :x2="TW-P" :y1="BASE" :y2="BASE" stroke="#111827" stroke-width="2" />
        <template v-for="e in entries" :key="e.id">
          <g :transform="`translate(${dateToX(e.date)},0)`" class="cursor-pointer" @click="remove(e.id)">
            <line :x1="0" :x2="0" :y1="BASE" :y2="BASE-32" stroke="#6b7280" stroke-width="2" />
            <circle :cx="0" :cy="BASE-34" r="5" fill="#111827" />
            <text :x="0" :y="BASE-44" text-anchor="middle" class="fill-gray-800" style="font-size: 10px;">
              {{ shortDate(e.date) }}
            </text>
            <text :x="0" :y="BASE-58" text-anchor="middle" class="fill-gray-700" style="font-size: 11px;">
              {{ e.description }}
            </text>
          </g>
        </template>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUserStore } from '~~/stores/user'

const props = defineProps<{ projectId: number }>()
const { id: userId } = storeToRefs(useUserStore())

type Entry = { id:number; description:string; date:string }
const entries = ref<Entry[]>([])
const description = ref('')
const dateStr = ref('')

// Timeline layout constants (SVG coordinates)
const TW = 800
const TH = 140
const P = 32
const BASE = 100

async function load() {
  entries.value = await $fetch(`/api/roadmap/${props.projectId}`)
}

onMounted(load)
watch(() => props.projectId, load)

async function addEntry() {
  if (!description.value || !dateStr.value) return
  await $fetch(`/api/roadmap/${props.projectId}`, { method: 'POST', body: { description: description.value, date: dateStr.value, userId: userId.value } })
  description.value = ''
  dateStr.value = ''
  await load()
}

async function remove(id: number) {
  await $fetch(`/api/roadmap/${props.projectId}?id=${id}`, { method: 'DELETE' })
  await load()
}

function formatDate(d: string | Date) {
  const dt = new Date(d)
  return dt.toLocaleDateString()
}

function shortDate(d: string | Date) {
  const dt = new Date(d)
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const minDate = computed(() => {
  if (entries.value.length === 0) return null as Date | null
  return new Date(Math.min(...entries.value.map(e => new Date(e.date).getTime())))
})
const maxDate = computed(() => {
  if (entries.value.length === 0) return null as Date | null
  return new Date(Math.max(...entries.value.map(e => new Date(e.date).getTime())))
})

function dateToX(d: string | Date) {
  const date = new Date(d)
  if (!minDate.value || !maxDate.value) return TW / 2
  const min = minDate.value.getTime()
  const max = maxDate.value.getTime()
  if (max === min) return (TW - 2 * P) / 2 + P
  const t = (date.getTime() - min) / (max - min)
  return P + t * (TW - 2 * P)
}
</script>




