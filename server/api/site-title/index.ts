import { promises as fs } from 'node:fs'
import path from 'node:path'
import { getCurrentUser } from '~~/server/utils/auth'

const titlePath = path.join(process.cwd(), 'public', 'site-title.json')

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  if (method === 'GET') {
    try {
      const raw = await fs.readFile(titlePath, 'utf-8')
      const data = JSON.parse(raw) as { title?: string }
      return { title: data.title ?? 'Home' }
    } catch {
      return { title: 'Home' }
    }
  }
  if (method === 'POST') {
    const me = await getCurrentUser(event)
    if (!me) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    if (me.role !== 'ADMIN' && me.role !== 'OWNER') throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    const body = await readBody<{ title?: string }>(event)
    const title = (body?.title ?? '').toString().trim()
    if (!title) throw createError({ statusCode: 400, statusMessage: 'Title required' })
    await fs.writeFile(titlePath, JSON.stringify({ title }, null, 2), 'utf-8')
    return { ok: true, title }
  }
  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
})


