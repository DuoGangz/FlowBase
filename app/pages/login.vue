<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="bg-white p-6 rounded-md shadow space-y-3 w-80">
      <h1 class="text-xl font-semibold">Sign in</h1>
      <ClientOnly>
        <div class="g-recaptcha" :data-sitekey="siteKey" data-action="LOGIN"></div>
      </ClientOnly>
      <button type="button" class="w-full border rounded px-3 py-2" :disabled="loading" @click="loginWithGoogle">Continue with Google</button>
      <div v-if="error" class="text-red-600 text-sm">{{ error }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  script: [
    { src: 'https://www.google.com/recaptcha/enterprise.js', async: true, defer: true }
  ]
})
const error = ref('')
const loading = ref(false)
const { public: { recaptchaSiteKey } } = useRuntimeConfig()
const siteKey = recaptchaSiteKey || '6Le2HNgrAAAAADnm45LaWcFMMwZksOw8Te80WN-c'

const { $googleLogin } = useNuxtApp()
async function loginWithGoogle() {
  error.value = ''
  loading.value = true
  try {
    const token = await executeRecaptcha('LOGIN')
    await $fetch('/api/auth/recaptcha', { method: 'POST', body: { token, action: 'LOGIN' } })

    const idToken = await $googleLogin()
    await $fetch('/api/auth/firebase', { method: 'POST', body: { idToken } })
    await navigateTo('/', { replace: true })
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || e?.code || 'Google sign-in failed'
  } finally {
    loading.value = false
  }
}

function waitForRecaptchaReady(timeoutMs = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const check = () => {
      const gre = (window as any).grecaptcha
      if (gre && gre.enterprise) {
        gre.enterprise.ready(() => resolve())
        return
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error('reCAPTCHA failed to load'))
        return
      }
      setTimeout(check, 50)
    }
    if (typeof window === 'undefined') {
      reject(new Error('Window not available'))
      return
    }
    check()
  })
}

async function executeRecaptcha(action: string): Promise<string> {
  await waitForRecaptchaReady()
  const gre = (window as any).grecaptcha
  return await gre.enterprise.execute(siteKey, { action })
}
</script>


