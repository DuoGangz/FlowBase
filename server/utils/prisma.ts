import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn']
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Best-effort remap of SQLite path for serverless (e.g., Vercel) when using serverAssets.
// If DATABASE_URL is a file: URL but the file is not found at runtime, try common Nitro asset paths.
(() => {
  try {
    const url = process.env.DATABASE_URL || ''
    if (!url.startsWith('file:')) return
    const currentPath = url.replace('file:', '')
    if (existsSync(currentPath)) return
    const candidates = [
      join(process.cwd(), 'server', 'assets', 'prisma', 'dev.db'),
      join(process.cwd(), '.output', 'server', 'assets', 'prisma', 'dev.db'),
      join(process.cwd(), 'prisma', 'dev.db')
    ]
    for (const p of candidates) {
      if (existsSync(p)) {
        process.env.DATABASE_URL = 'file:' + p
        break
      }
    }
  } catch {}
})()





