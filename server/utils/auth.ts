import { getFirestore } from './firestore'

export async function getCurrentUser(event: any) {
  const cookieVal = getCookie(event, 'uid')
  const uid = cookieVal ? String(cookieVal) : null
  if (!uid) return null
  const db = getFirestore()
  const doc = await db.collection('users').doc(uid).get()
  if (!doc.exists) return null
  return { id: uid, ...(doc.data() as any) }
}

export function requireRole(user: any, roles: Array<'ADMIN' | 'MANAGER' | 'USER'>) {
  if (!user || !roles.includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
}

export function setUserSession(event: any, userId: string) {
  setCookie(event, 'uid', String(userId), { httpOnly: true, sameSite: 'lax', path: '/' })
  // Non-HttpOnly mirror for client-side middleware (demo only)
  setCookie(event, 'uid_js', String(userId), { httpOnly: false, sameSite: 'lax', path: '/' })
}

export function clearUserSession(event: any) {
  deleteCookie(event, 'uid', { path: '/' })
  deleteCookie(event, 'uid_js', { path: '/' })
}


