import { prisma } from './prisma'

export async function getCurrentUser(event: any) {
  const cookieVal = getCookie(event, 'uid')
  let id: number | null = cookieVal ? Number(cookieVal) : null
  if (!id) {
    // fallback to header for local testing
    const idHeader = getHeader(event, 'x-user-id')
    id = idHeader ? Number(idHeader) : null
  }
  if (!id) return null
  return prisma.user.findUnique({ where: { id } })
}

export function requireRole(user: any, roles: Array<'ADMIN' | 'MANAGER' | 'USER'>) {
  if (!user || !roles.includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
}

export function setUserSession(event: any, userId: number) {
  setCookie(event, 'uid', String(userId), { httpOnly: true, sameSite: 'lax', path: '/' })
  // Non-HttpOnly mirror for client-side middleware (demo only)
  setCookie(event, 'uid_js', String(userId), { httpOnly: false, sameSite: 'lax', path: '/' })
}

export function clearUserSession(event: any) {
  deleteCookie(event, 'uid', { path: '/' })
  deleteCookie(event, 'uid_js', { path: '/' })
}


