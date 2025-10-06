import { getCurrentUser } from '~~/server/utils/auth'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { put } from '@vercel/blob'
import { getFirebaseBucket } from '~~/server/utils/firebaseAdmin'
import { getFirestore } from '~~/server/utils/firestore'

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
    // Prefer Firestore-stored banner URL (works on Vercel)
    try {
      const db = getFirestore()
      const snap = await db.collection('settings').doc('site').get()
      const url = (snap.exists ? (snap.data()?.bannerUrl as string | undefined) : undefined) || null
      if (url) return { url }
    } catch {}
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

    const incomingExt = path.extname(file.filename || '').toLowerCase()
    const ext = ALLOWED_EXTS.includes(incomingExt) ? incomingExt : (file.type && file.type.includes('png') ? '.png' : (file.type && file.type.includes('webp') ? '.webp' : '.jpg'))

    let publicUrl: string | null = null
    const storageMode = (process.env.FILES_STORAGE || '').toLowerCase()
    const isVercel = Boolean(process.env.VERCEL)
    try {
      if (storageMode === 'firebase') {
        const bucket = getFirebaseBucket()
        const pathname = `banner/${BASENAME}${ext}`
        const fileRef = bucket.file(pathname)
        await fileRef.save(file.data as Buffer, { contentType: file.type || undefined, resumable: false, public: true })
        publicUrl = `https://storage.googleapis.com/${bucket.name}/${pathname}`
      } else if (isVercel) {
        const token = process.env.BLOB_READ_WRITE_TOKEN
        if (!token) throw new Error('Missing BLOB_READ_WRITE_TOKEN')
        const pathname = `banner/${BASENAME}${ext}`
        const uploaded = await put(pathname, file.data as Buffer, { access: 'public', addRandomSuffix: false, token })
        publicUrl = uploaded.url
      } else {
        // Local/dev: write to public dir
        for (const e of ALLOWED_EXTS) {
          const p = path.join(PUBLIC_DIR, `${BASENAME}${e}`)
          try { await fs.unlink(p) } catch {}
        }
        const dest = path.join(PUBLIC_DIR, `${BASENAME}${ext}`)
        await fs.writeFile(dest, file.data)
        const stat = await fs.stat(dest)
        publicUrl = `/${BASENAME}${ext}?v=${encodeURIComponent(stat.mtimeMs.toString())}`
      }
    } catch (e) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to save banner. Configure storage (Firebase or Vercel Blob).' })
    }

    // Persist URL in Firestore so GET works on Vercel
    try {
      const db = getFirestore()
      await db.collection('settings').doc('site').set({ bannerUrl: publicUrl }, { merge: true })
    } catch {}

    return { ok: true, url: publicUrl }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
})

