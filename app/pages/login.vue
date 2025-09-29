<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="bg-white p-6 rounded-md shadow space-y-3 w-80">
      <h1 class="text-xl font-semibold">Sign in</h1>
      <button type="button" class="w-full border rounded px-3 py-2" @click="loginWithGoogle">Continue with Google</button>
      <div v-if="error" class="text-red-600 text-sm">{{ error }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
const error = ref('')

const { $googleLogin } = useNuxtApp()
async function loginWithGoogle() {
  error.value = ''
  try {
    const idToken = await $googleLogin()
    await $fetch('/api/auth/firebase', { method: 'POST', body: { idToken } })
    await navigateTo('/', { replace: true })
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || e?.code || 'Google sign-in failed'
  }
}
</script>


