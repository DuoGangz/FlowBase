<template>
  <div class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
    <div class="bg-white rounded-lg shadow-xl w-[92vw] max-w-5xl p-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-medium">Adjust Banner</h3>
        <button class="px-2 py-1 border rounded" @click="$emit('cancel')">Cancel</button>
      </div>

      <div class="flex flex-col md:flex-row gap-4">
        <div class="flex-1">
          <div
            ref="frame"
            class="relative bg-gray-200 overflow-hidden mx-auto"
            :style="{ width: displayWidth + 'px', height: displayHeight + 'px' }"
            @mousedown="onMouseDown"
            @touchstart.prevent="onTouchStart"
          >
            <img
              v-if="imgUrl"
              :src="imgUrl"
              :style="imgStyle"
              class="select-none pointer-events-none"
              @load="onImgLoad"
            />

            <!-- Crop rectangle overlay -->
            <div
              class="absolute border-2 border-white/90 shadow-[0_0_0_10000px_rgba(0,0,0,0.35)] cursor-move"
              :style="cropStyle"
              @mousedown.stop="startCropMove($event)"
            >
              <template v-for="h in handles" :key="h.key">
                <div
                  class="absolute bg-white border border-gray-400"
                  :style="h.style"
                  @mousedown.stop="startCropResize(h.pos, $event)"
                />
              </template>
            </div>
          </div>
          <div class="mt-3 flex flex-wrap items-center gap-2 md:gap-3 justify-end w-full">
            <label class="text-sm text-gray-600">Zoom</label>
            <input type="range" min="0" max="200" v-model.number="zoomUi" class="w-40 h-1.5" />
            <button class="px-3 py-1 border rounded" @click="centerImage">Center</button>
            <button class="px-3 py-1 border rounded" @click="pickNewImage">Change Image</button>
            <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onPickNew" />
            <button class="px-3 py-1 rounded bg-black text-white disabled:opacity-50" :disabled="!ready" @click="confirm">Save</button>
          </div>
        </div>

        
      </div>
    </div>
  </div>
  
</template>

<script setup lang="ts">
const props = defineProps<{ file: File; targetWidth: number; targetHeight: number }>()
const emit = defineEmits<{ (e:'cancel'): void; (e:'confirm', blob: Blob): void }>()

const imgUrl = ref<string | null>(null)
const naturalWidth = ref(0)
const naturalHeight = ref(0)

// Display frame follows the target aspect ratio but constrained to viewport
const ratio = computed(() => props.targetWidth / props.targetHeight)
const displayWidth = computed(() => Math.min(1000, Math.max(480, Math.min(window.innerWidth * 0.9, props.targetWidth))))
const displayHeight = computed(() => Math.round(displayWidth.value / ratio.value))

// Transform state
const scale = ref(1)
const minScale = ref(0.2) // allow zooming out to 20%
const translate = reactive({ x: 0, y: 0 }) // image top-left in frame space
const ready = ref(false)

const frame = ref<HTMLDivElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const zoomUi = computed({
  get: () => Math.round((scale.value - minScale.value) * 100),
  set: (v: number) => setScale(minScale.value + v / 100)
})

function setScale(next: number) {
  scale.value = Math.max(minScale.value, Math.min(5, next))
  clampTranslate()
}

function clampTranslate() {
  const sw = naturalWidth.value * scale.value
  const sh = naturalHeight.value * scale.value
  const fw = displayWidth.value
  const fh = displayHeight.value
  const minX = Math.min(0, fw - sw)
  const minY = Math.min(0, fh - sh)
  translate.x = Math.min(0, Math.max(minX, translate.x))
  translate.y = Math.min(0, Math.max(minY, translate.y))
}

const imgStyle = computed(() => ({
  position: 'absolute',
  left: translate.x + 'px',
  top: translate.y + 'px',
  width: naturalWidth.value * scale.value + 'px',
  height: naturalHeight.value * scale.value + 'px'
}))

// Crop rectangle state (frame space)
const crop = reactive({ x: 0, y: 0, w: 300, h: 100 })
const handles = [
  { key: 'tl', pos: 'tl', style: { left: '-6px', top: '-6px', width: '12px', height: '12px', cursor: 'nwse-resize' } },
  { key: 'tr', pos: 'tr', style: { right: '-6px', top: '-6px', width: '12px', height: '12px', cursor: 'nesw-resize' } },
  { key: 'bl', pos: 'bl', style: { left: '-6px', bottom: '-6px', width: '12px', height: '12px', cursor: 'nesw-resize' } },
  { key: 'br', pos: 'br', style: { right: '-6px', bottom: '-6px', width: '12px', height: '12px', cursor: 'nwse-resize' } },
]
const cropStyle = computed(() => ({
  left: crop.x + 'px',
  top: crop.y + 'px',
  width: crop.w + 'px',
  height: crop.h + 'px'
}))

function onImgLoad(e: Event) {
  const img = e.target as HTMLImageElement
  naturalWidth.value = img.naturalWidth
  naturalHeight.value = img.naturalHeight
  const sFit = Math.max(displayWidth.value / naturalWidth.value, displayHeight.value / naturalHeight.value)
  // do not force-fit; allow zooming out, but start at fit for convenience
  scale.value = Math.max(minScale.value, sFit)
  centerImage()
  // initialize crop to full frame
  crop.x = 0
  crop.y = 0
  crop.w = displayWidth.value
  crop.h = displayHeight.value
  ready.value = true
}

function centerImage() {
  const sw = naturalWidth.value * scale.value
  const sh = naturalHeight.value * scale.value
  translate.x = (displayWidth.value - sw) / 2
  translate.y = (displayHeight.value - sh) / 2
  clampTranslate()
}

// Dragging
const dragState = reactive({ on: false, sx: 0, sy: 0, ox: 0, oy: 0 })
function onMouseDown(e: MouseEvent) {
  dragState.on = true
  dragState.sx = e.clientX
  dragState.sy = e.clientY
  dragState.ox = translate.x
  dragState.oy = translate.y
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}
function onMouseMove(e: MouseEvent) {
  if (!dragState.on) return
  translate.x = dragState.ox + (e.clientX - dragState.sx)
  translate.y = dragState.oy + (e.clientY - dragState.sy)
  clampTranslate()
}
function onMouseUp() {
  dragState.on = false
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
}
function onTouchStart(e: TouchEvent) {
  const t = e.touches[0]
  dragState.on = true
  dragState.sx = t.clientX
  dragState.sy = t.clientY
  dragState.ox = translate.x
  dragState.oy = translate.y
  window.addEventListener('touchmove', onTouchMove)
  window.addEventListener('touchend', onTouchEnd)
}
function onTouchMove(e: TouchEvent) {
  if (!dragState.on) return
  const t = e.touches[0]
  translate.x = dragState.ox + (t.clientX - dragState.sx)
  translate.y = dragState.oy + (t.clientY - dragState.sy)
  clampTranslate()
}
function onTouchEnd() {
  dragState.on = false
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('touchend', onTouchEnd)
}

// Crop interactions
const cropDrag = reactive({ on: false, mode: 'move' as 'move' | 'tl' | 'tr' | 'bl' | 'br', sx: 0, sy: 0, ox: 0, oy: 0, ow: 0, oh: 0 })
function startCropMove(e: MouseEvent) {
  cropDrag.on = true
  cropDrag.mode = 'move'
  cropDrag.sx = e.clientX
  cropDrag.sy = e.clientY
  cropDrag.ox = crop.x
  cropDrag.oy = crop.y
  window.addEventListener('mousemove', onCropMove)
  window.addEventListener('mouseup', stopCropDrag)
}
function startCropResize(mode: 'tl' | 'tr' | 'bl' | 'br', e: MouseEvent) {
  cropDrag.on = true
  cropDrag.mode = mode
  cropDrag.sx = e.clientX
  cropDrag.sy = e.clientY
  cropDrag.ox = crop.x
  cropDrag.oy = crop.y
  cropDrag.ow = crop.w
  cropDrag.oh = crop.h
  window.addEventListener('mousemove', onCropMove)
  window.addEventListener('mouseup', stopCropDrag)
}
function onCropMove(e: MouseEvent) {
  if (!cropDrag.on) return
  const dx = e.clientX - cropDrag.sx
  const dy = e.clientY - cropDrag.sy
  const fw = displayWidth.value
  const fh = displayHeight.value
  if (cropDrag.mode === 'move') {
    crop.x = Math.min(fw - crop.w, Math.max(0, cropDrag.ox + dx))
    crop.y = Math.min(fh - crop.h, Math.max(0, cropDrag.oy + dy))
    return
  }
  // resize
  let x = cropDrag.ox
  let y = cropDrag.oy
  let w = cropDrag.ow
  let h = cropDrag.oh
  if (cropDrag.mode === 'tl') { x = cropDrag.ox + dx; y = cropDrag.oy + dy; w = cropDrag.ow - dx; h = cropDrag.oh - dy }
  if (cropDrag.mode === 'tr') { y = cropDrag.oy + dy; w = cropDrag.ow + dx; h = cropDrag.oh - dy }
  if (cropDrag.mode === 'bl') { x = cropDrag.ox + dx; w = cropDrag.ow - dx; h = cropDrag.oh + dy }
  if (cropDrag.mode === 'br') { w = cropDrag.ow + dx; h = cropDrag.oh + dy }
  // constrain within frame and minimum size
  w = Math.max(32, Math.min(fw - x, w))
  h = Math.max(32, Math.min(fh - y, h))
  x = Math.max(0, Math.min(fw - w, x))
  y = Math.max(0, Math.min(fh - h, y))
  crop.x = x; crop.y = y; crop.w = w; crop.h = h
}
function stopCropDrag() {
  cropDrag.on = false
  window.removeEventListener('mousemove', onCropMove)
  window.removeEventListener('mouseup', stopCropDrag)
}

async function confirm() {
  if (!ready.value) return
  const canvas = document.createElement('canvas')
  canvas.width = props.targetWidth
  canvas.height = props.targetHeight
  const ctx = canvas.getContext('2d')!
  const img = new Image()
  img.src = imgUrl.value as string
  await img.decode()

  // Map crop rect (frame space) to image space
  const scaleDisplayToImage = 1 / scale.value
  const sx = Math.max(0, (crop.x - translate.x) * scaleDisplayToImage)
  const sy = Math.max(0, (crop.y - translate.y) * scaleDisplayToImage)
  const sWidth = Math.min(naturalWidth.value - sx, crop.w * scaleDisplayToImage)
  const sHeight = Math.min(naturalHeight.value - sy, crop.h * scaleDisplayToImage)

  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height)
  const blob: Blob = await new Promise((res) => canvas.toBlob(b => res(b as Blob), 'image/jpeg', 0.92)!)
  emit('confirm', blob)
}

onMounted(() => {
  loadFromFile(props.file)
})
onBeforeUnmount(() => {
  if (imgUrl.value) URL.revokeObjectURL(imgUrl.value)
})

function pickNewImage() {
  fileInput.value?.click()
}
function onPickNew(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  loadFromFile(input.files[0])
  input.value = ''
}
function loadFromFile(file: File) {
  if (imgUrl.value) URL.revokeObjectURL(imgUrl.value)
  imgUrl.value = URL.createObjectURL(file)
  // reset state until image loads
  ready.value = false
  naturalWidth.value = 0
  naturalHeight.value = 0
  scale.value = 1
  minScale.value = 1
  translate.x = 0
  translate.y = 0
}
</script>



