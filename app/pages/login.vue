<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <form class="bg-white p-6 rounded-md shadow space-y-3 w-80" @submit.prevent="login">
      <h1 class="text-xl font-semibold">Sign in</h1>
      <button type="button" class="w-full border rounded px-3 py-2" @click="loginWithGoogle">Continue with Google</button>
      <div class="flex items-center gap-2 text-xs text-gray-500"><div class="flex-1 h-px bg-gray-200"/><span>or use password</span><div class="flex-1 h-px bg-gray-200"/></div>
      <input v-model="username" placeholder="Username or email" class="border rounded px-3 py-2 w-full" />
      <input v-model="password" type="password" placeholder="Password" class="border rounded px-3 py-2 w-full" />
      <button type="button" class="w-full bg-black text-white rounded px-3 py-2 opacity-60 cursor-not-allowed">Password login disabled</button>
      <div v-if="error" class="text-red-600 text-sm">{{ error }}</div>
    </form>
  </div>
</template>

<script setup lang="ts">
const username = ref('')
const password = ref('')
const error = ref('')

const { $googleLogin } = useNuxtApp()
async function loginWithGoogle() {
  error.value = ''
  try {
    const idToken = await $googleLogin()
    await $fetch('/api/auth/firebase', { method: 'POST', body: { idToken } })
    await navigateTo('/', { replace: true })
  } catch (e: any) {
    error.value = e?.data?.message || 'Google sign-in failed'
  }
}

async function login() {
  error.value = 'Password login disabled. Use Google.'
}
</script>


