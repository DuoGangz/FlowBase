import { getCurrentUser } from '~~/server/utils/auth'
import { promises as fs } from 'node:fs'
import path from 'node:path'

const bannerPath = path.join(process.cwd(), 'public', 'banner.jpg')

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  if (method === 'GET') {
    try {
      await fs.access(bannerPath)
      return { url: '/banner.jpg' }
    } catch {
      return { url: null }
    }
  }

  if (method === 'POST') {
    const me = await getCurrentUser(event)
    if (!me) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    if (me.role !== 'ADMIN' && me.role !== 'OWNER') throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

    const form = await readMultipartFormData(event)
    const file = form?.find(f => f.type === 'file')
    if (!file || !file.filename || !file.data) throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })

    await fs.writeFile(bannerPath, file.data)
    return { ok: true, url: '/banner.jpg' }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
})


