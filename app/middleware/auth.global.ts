export default defineNuxtRouteMiddleware(async (to) => {
  const publicPaths = new Set(['/login'])
  if (publicPaths.has(to.path)) return
  try {
    await $fetch('/api/auth/me')
  } catch {
    return navigateTo('/login')
  }
})


