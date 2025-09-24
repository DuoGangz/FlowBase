export default defineNuxtRouteMiddleware((to) => {
  if (process.server) return
  const publicPaths = new Set(['/login'])
  if (publicPaths.has(to.path)) return
  const uid = useCookie('uid_js')
  if (!uid.value) {
    return navigateTo('/login')
  }
})


