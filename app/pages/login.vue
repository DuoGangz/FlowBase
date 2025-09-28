<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="bg-white p-6 rounded-md shadow space-y-3 w-80">
      <h1 class="text-xl font-semibold">Sign in</h1>
      <ClientOnly>
        <div class="g-recaptcha" :data-sitekey="siteKey" data-action="LOGIN"></div>
      </ClientOnly>
      <button type="button" class="w-full border rounded px-3 py-2" @click="loginWithGoogle">Continue with Google</button>
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
const { public: { recaptchaSiteKey } } = useRuntimeConfig()
const siteKey = recaptchaSiteKey || '6Le2HNgrAAAAADnm45LaWcFMMwZksOw8Te80WN-c'

const { $googleLogin } = useNuxtApp()
async function loginWithGoogle() {
  error.value = ''
  try {
    // Execute reCAPTCHA Enterprise and verify on server before Firebase login
    const token = await executeRecaptcha('LOGIN')
    await $fetch('/api/auth/recaptcha', { method: 'POST', body: { token, action: 'LOGIN' } })

    const idToken = await $googleLogin()
    await $fetch('/api/auth/firebase', { method: 'POST', body: { idToken } })
    await navigateTo('/', { replace: true })
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || e?.code || 'Google sign-in failed'
  }
}

function executeRecaptcha(action: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('Window not available'))
    const gre = (window as any).grecaptcha
    if (!gre || !gre.enterprise) return reject(new Error('reCAPTCHA not loaded'))
    gre.enterprise.ready(() => {
      gre.enterprise.execute(siteKey, { action }).then(resolve).catch(reject)
    })
  })
}
</script>


