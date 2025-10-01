import { prisma } from '~~/server/utils/prisma'
import { getCurrentUser } from '~~/server/utils/auth'
import path from 'node:path'
import { promises as fs } from 'node:fs'
import { put, del } from '@vercel/blob'

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
    const me = await getCurrentUser(event)
    const scope = String((getQuery(event) as any).scope || 'shared')
    const where: any = { projectId: projectIdNum }
    if (scope === 'private') {
      if (!me) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      where.ownerUserId = me.id
    } else {
      where.ownerUserId = null
    }
    return prisma.file.findMany({ where, orderBy: { createdAt: 'desc' } })
  }

  if (method === 'POST') {
    const me = await getCurrentUser(event)
    if (!me) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    const query = getQuery(event)
    const scope = String((query as any).scope || 'shared')
    const form = await readMultipartFormData(event)
    const file = form?.find((f: any) => f && f.filename && f.data)
    if (!file || !file.filename || !file.data) throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })

    const safe = sanitizeFilename(file.filename)
    const isVercel = Boolean(process.env.VERCEL)
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN
    let publicPath = ''

    if (isVercel) {
      if (!blobToken) {
        throw createError({ statusCode: 500, statusMessage: 'Blob storage not configured. Create a Vercel Blob store.' })
      }
      const pathname = `projects/${projectIdNum}/${Date.now()}-${safe}`
      const uploaded = await put(pathname, file.data as Buffer, { access: 'public', addRandomSuffix: false, token: blobToken as string })
      publicPath = uploaded.url
    } else {
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
      publicPath = dest.replace(path.join(process.cwd(), 'public'), '').replace(/\\/g, '/')
    }

    const created = await prisma.file.create({
      data: {
        path: publicPath,
        metadata: { filename: safe, size: (file.data as Buffer).length, type: file.type || null, scope },
        projectId: projectIdNum,
        ownerUserId: scope === 'private' ? me.id : null
      }
    })
    return created
  }

  if (method === 'DELETE') {
    const me = await getCurrentUser(event)
    if (!me) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    const query = getQuery(event)
    const id = Number(query.id)
    if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

    const existing = await prisma.file.findUnique({ where: { id } })
    if (!existing) throw createError({ statusCode: 404, statusMessage: 'File not found' })
    // Only owner can delete private files; shared files deletable by admins/owners or anyone? Default: allow owner of private; shared allowed for any authenticated for now.
    if (existing.ownerUserId && existing.ownerUserId !== me.id) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    try {
      const isBlobUrl = typeof existing.path === 'string' && existing.path.startsWith('http')
      if (isBlobUrl) {
        const blobToken = process.env.BLOB_READ_WRITE_TOKEN
        await del(existing.path, blobToken ? { token: blobToken } : undefined as any)
      } else {
        const fileFsPath = path.join(process.cwd(), 'public', existing.path)
        await fs.unlink(fileFsPath)
      }
    } catch {}

    await prisma.file.delete({ where: { id } })
    return { ok: true }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
})


