<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <form class="bg-white p-6 rounded-md shadow space-y-3 w-80" @submit.prevent="login">
      <h1 class="text-xl font-semibold">Sign in</h1>
      <input v-model="username" placeholder="Username" class="border rounded px-3 py-2 w-full" />
      <input v-model="password" type="password" placeholder="Password" class="border rounded px-3 py-2 w-full" />
      <button class="w-full bg-black text-white rounded px-3 py-2">Sign in</button>
      <div v-if="error" class="text-red-600 text-sm">{{ error }}</div>
    </form>
  </div>
</template>

<script setup lang="ts">
const username = ref('admin')
const password = ref('1234')
const error = ref('')

async function login() {
  error.value = ''
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: { username: username.value, password: password.value } })
    await navigateTo('/', { replace: true })
  } catch (e: any) {
    error.value = e?.data?.message || 'Login failed'
  }
}
</script>


