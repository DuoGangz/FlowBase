import { getCurrentUser } from '~~/server/utils/auth'
import { promises as fs } from 'node:fs'
import path from 'node:path'

const PUBLIC_DIR = path.join(process.cwd(), 'public')
const BASENAME = 'banner'
const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp']

async function findExistingBanner() {
  for (const ext of ALLOWED_EXTS) {
    const p = path.join(PUBLIC_DIR, `${BASENAME}${ext}`)
    try {
      const stat = await fs.stat(p)
      return { path: p, url: `/${BASENAME}${ext}?v=${encodeURIComponent(stat.mtimeMs.toString())}` }
    } catch {}
  }
  return null as { path: string; url: string } | null
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  if (method === 'GET') {
    const found = await findExistingBanner()
    return { url: found ? found.url : null }
  }

  if (method === 'POST') {
    const me = await getCurrentUser(event)
    if (!me) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    if (me.role !== 'ADMIN' && me.role !== 'OWNER') throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

    const form = await readMultipartFormData(event)
    const file = form?.find((f: any) => f && f.filename && f.data)
    if (!file || !file.filename || !file.data) throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })

    const ext = ALLOWED_EXTS.includes(path.extname(file.filename).toLowerCase())
      ? path.extname(file.filename).toLowerCase()
      : '.jpg'

    // Remove any previous banner files with other extensions
    for (const e of ALLOWED_EXTS) {
      const p = path.join(PUBLIC_DIR, `${BASENAME}${e}`)
      try { await fs.unlink(p) } catch {}
    }

    const dest = path.join(PUBLIC_DIR, `${BASENAME}${ext}`)
    await fs.writeFile(dest, file.data)
    const stat = await fs.stat(dest)
    const v = stat.mtimeMs.toString()
    return { ok: true, url: `/${BASENAME}${ext}?v=${encodeURIComponent(v)}` }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
})


