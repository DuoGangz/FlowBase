export default defineNuxtRouteMiddleware(async (to) => {
  const publicPaths = new Set(['/login'])
  if (publicPaths.has(to.path)) return
  // Prefer cookie check (works in SSR and CSR). 'uid' is HttpOnly; reading here on SSR is safe.
  const uid = useCookie('uid')
  if (uid.value) return
  // Fallback: client-side verify via API (in case cookies are blocked or just changed)
  if (process.client) {
    try { await $fetch('/api/auth/me') ; return } catch {}
  }
  return navigateTo('/login')
})


