export default defineNuxtRouteMiddleware(async () => {
  if (process.server) return
  try {
    const me = await $fetch<{ id:number; role:'OWNER'|'ADMIN'|'MANAGER'|'USER' }>('/api/auth/me')
    if (me.role !== 'OWNER') {
      return navigateTo('/')
    }
  } catch {
    return navigateTo('/login')
  }
})


