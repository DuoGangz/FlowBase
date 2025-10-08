<template>
  <div class="flex flex-col gap-3 min-h-[22rem] h-full">
    <div ref="listRef" class="border rounded flex-1 min-h-0 overflow-auto no-scrollbar p-3 pb-4 bg-gray-50 dark:bg-gray-900 dark:border-gray-700" @scroll="onListScroll">
      <div v-if="!peerId" class="text-gray-500 text-sm">Select a user to start chatting.</div>
      <div v-else class="space-y-2">
        <div v-for="m in messages" :key="m.id" class="flex" :class="isMe(m) ? 'justify-end' : 'justify-start'">
          <div class="relative max-w-[75%] rounded-2xl px-3 py-2 shadow-sm"
               :class="isMe(m) ? 'bg-[#0b93f6] text-white' : 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100'">
            <div class="text-[10px] mb-1" :class="isMe(m) ? 'text-white/70' : 'text-gray-500 dark:text-gray-300/70'">{{ time(m.createdAt) }}</div>
            <div class="whitespace-pre-wrap break-words text-sm leading-snug" v-html="renderMessage(m.content)"></div>
            <span v-if="isMe(m)" class="absolute -right-1.5 bottom-1 w-3 h-3 bg-[#0b93f6] rotate-45"></span>
            <span v-else class="absolute -left-1.5 bottom-1 w-3 h-3 bg-gray-200 dark:bg-gray-700 rotate-45"></span>
          </div>
        </div>
      </div>
    </div>

    <div class="space-y-2">
      <div v-if="error" class="text-sm text-red-600">{{ error }}</div>
      <div class="relative">
        <textarea ref="inputRef" v-model="draft" @mousedown.stop @keydown.enter.exact.prevent="onEnter" @input="onInput" placeholder="Type a message. Type @name to choose a person." class="border rounded px-3 py-2 w-full h-20"></textarea>
        <ul v-if="mention.active && mention.results.length" class="absolute z-50 bottom-full left-0 mb-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded shadow-md w-64 max-w-full max-h-56 overflow-auto">
          <li v-for="u in mention.results" :key="u.id" class="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" @click="applyMention(u)">@{{ u.name }}</li>
        </ul>
      </div>
      <div class="flex justify-between items-center">
        <div class="text-xs text-gray-500">Press Enter to send</div>
        <button class="bg-black text-white px-4 py-2 rounded" :disabled="!canSend" @click="send">Send</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type User = { id:string; name:string }

const me = ref<{ id:number } | null>(null)
const users = ref<User[]>([])
const peerId = ref<string>('')
const peerQuery = ref('')
const showUserList = ref(false)
const messages = ref<any[]>([])
const draft = ref('')
const polling = ref(true)
const inputRef = ref<HTMLTextAreaElement | null>(null)
const listRef = ref<HTMLDivElement | null>(null)
const atBottom = ref(true)
const error = ref('')

const filteredUsers = computed(() => {
  const q = peerQuery.value.trim().toLowerCase()
  if (!q) return users.value
  return users.value.filter(u => u.name.toLowerCase().includes(q))
})

const canSend = computed(() => Boolean(peerId.value && draft.value.trim()))

const mention = reactive<{ active:boolean; anchor:number; results:User[] }>({ active: false, anchor: -1, results: [] })

function isMe(m: any) {
  return String(m?.fromUserId) === String(me.value?.id)
}

function openUserList() { showUserList.value = true }
function onPeerQuery() { showUserList.value = true }
function selectPeer(u: User) {
  peerId.value = u.id
  peerQuery.value = u.name
  showUserList.value = false
  load(true)
}

function time(d: string) {
  const dt = new Date(d)
  return dt.toLocaleString()
}

function renderMessage(text: string) {
  // Convert @mentions to bold for now
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return escaped.replace(/@([A-Za-z0-9_\- ]{1,40})/g, '<strong>@$1</strong>')
}

async function loadMe() {
  try { me.value = await $fetch('/api/auth/me') as any } catch { me.value = null }
}
async function loadUsers() {
  try {
    const list = await $fetch<any[]>('/api/users/mentions')
    users.value = list.map(u => ({ id: String(u.id), name: u.name }))
  } catch {}
}

async function load(forceScroll = false) {
  if (!peerId.value) return
  const fetched = await $fetch<any[]>(`/api/im/${peerId.value}`)
  messages.value = fetched.slice().sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')))
  await nextTick()
  // Auto-scroll only within the list container, not the page
  try {
    if (forceScroll || atBottom.value) {
      const el = listRef.value
      if (el) { el.scrollTop = el.scrollHeight }
    }
  } catch {}
}

function firstMentionUserId(): string | null {
  const m = draft.value.match(/@([A-Za-z0-9_\- ]{1,40})/)
  if (!m) return null
  const name = (m[1] || '').trim().toLowerCase()
  const u = users.value.find(x => x.name.toLowerCase() === name)
  return u ? u.id : null
}

async function send() {
  error.value = ''
  // If no peer selected, try to infer from first @mention
  if (!peerId.value) {
    const inferred = firstMentionUserId()
    if (inferred) {
      const u = users.value.find(x => x.id === inferred)
      if (u) {
        peerId.value = u.id
        peerQuery.value = u.name
        await load()
      }
    }
  }
  if (!peerId.value) {
    error.value = 'Select a recipient or @mention someone to start a chat.'
    return
  }
  if (!draft.value.trim()) return
  try {
    await $fetch(`/api/im/${peerId.value}`, { method: 'POST', body: { content: draft.value } })
    draft.value = ''
    await load(true)
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Failed to send message'
  }
}

function onEnter(e: KeyboardEvent) {
  if (mention.active && mention.results.length) {
    e.preventDefault()
    applyMention(mention.results[0])
    return
  }
  send()
}

function onInput(e: Event) {
  const el = e.target as HTMLTextAreaElement
  const val = el.value
  const caret = el.selectionStart || val.length
  const at = val.lastIndexOf('@', caret - 1)
  if (at >= 0 && (at === 0 || /\s/.test(val[at - 1] || ''))) {
    const query = val.slice(at + 1, caret)
    if (query.length >= 0) {
      const q = query.toLowerCase()
      mention.active = true
      mention.anchor = at
      mention.results = users.value.filter(u => u.name.toLowerCase().includes(q)).slice(0, 8)
      return
    }
  }
  mention.active = false
  mention.anchor = -1
  mention.results = []
  if (error.value) error.value = ''
}

function applyMention(u: User) {
  if (!inputRef.value) return
  const el = inputRef.value
  const val = el.value
  const caret = el.selectionStart || val.length
  if (mention.anchor < 0) return
  const before = val.slice(0, mention.anchor)
  const after = val.slice(caret)
  if (!peerId.value) {
    // Use @mention to select the chat recipient; remove the mention from the draft
    peerId.value = u.id
    peerQuery.value = u.name
    el.value = `${before}${after}`
    draft.value = el.value
    load(true)
    // Restore focus and caret just after the removed mention
    nextTick(() => {
      el.focus()
      const pos = before.length
      el.setSelectionRange(pos, pos)
    })
  } else {
    // Already in a conversation; keep @mention as content
    el.value = `${before}@${u.name} ${after}`
    draft.value = el.value
    nextTick(() => {
      el.focus()
      const pos = (before + '@' + u.name + ' ').length
      el.setSelectionRange(pos, pos)
    })
  }
  mention.active = false
  mention.anchor = -1
  mention.results = []
}

function onListScroll() {
  const el = listRef.value
  if (!el) return
  const threshold = 12
  atBottom.value = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold
}

let timer: number | null = null
function togglePolling() {
  polling.value = !polling.value
  if (polling.value) startPolling()
  else stopPolling()
}
function startPolling() {
  stopPolling()
  timer = window.setInterval(() => { load() }, 3000)
}
function stopPolling() {
  if (timer) { window.clearInterval(timer); timer = null }
}

onMounted(async () => {
  await Promise.all([loadMe(), loadUsers()])
  startPolling()
})
onBeforeUnmount(() => stopPolling())
</script>


