import { prisma } from '~~/server/utils/prisma'
import path from 'node:path'
import { promises as fs } from 'node:fs'

const UPLOADS_ROOT = path.join(process.cwd(), 'public', 'uploads', 'projects')

async function ensureDir(dir: string) {
  try { await fs.mkdir(dir, { recursive: true }) } catch {}
}

function sanitizeFilename(name: string) {
  const base = path.basename(name)
  return base.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export default defineEventHandler(async (event) => {
  const { projectId } = getRouterParams(event)
  const projectIdNum = Number(projectId)
  if (!projectId || Number.isNaN(projectIdNum)) {
    throw createError({ statusCode: 400, statusMessage: 'projectId must be a number' })
  }

  const method = getMethod(event)

  if (method === 'GET') {
    return prisma.file.findMany({ where: { projectId: projectIdNum }, orderBy: { createdAt: 'desc' } })
  }

  if (method === 'POST') {
    const form = await readMultipartFormData(event)
    const file = form?.find((f: any) => f && f.filename && f.data)
    if (!file || !file.filename || !file.data) throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })

    const safe = sanitizeFilename(file.filename)
    const projectDir = path.join(UPLOADS_ROOT, String(projectIdNum))
    await ensureDir(projectDir)

    // Avoid overwriting by appending a short timestamp if exists
    let dest = path.join(projectDir, safe)
    try {
      await fs.stat(dest)
      const ext = path.extname(safe)
      const nameOnly = path.basename(safe, ext)
      const unique = `${nameOnly}-${Date.now()}${ext || ''}`
      dest = path.join(projectDir, unique)
    } catch {}

    await fs.writeFile(dest, file.data)

    const publicPath = dest.replace(path.join(process.cwd(), 'public'), '').replace(/\\/g, '/')

    const created = await prisma.file.create({
      data: {
        path: publicPath,
        metadata: { filename: safe, size: (file.data as Buffer).length, type: file.type || null },
        projectId: projectIdNum
      }
    })
    return created
  }

  if (method === 'DELETE') {
    const query = getQuery(event)
    const id = Number(query.id)
    if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

    const existing = await prisma.file.findUnique({ where: { id } })
    if (!existing) throw createError({ statusCode: 404, statusMessage: 'File not found' })

    try {
      const fileFsPath = path.join(process.cwd(), 'public', existing.path)
      await fs.unlink(fileFsPath)
    } catch {}

    await prisma.file.delete({ where: { id } })
    return { ok: true }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
})


