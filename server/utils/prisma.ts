// Prisma has been removed from this project.
// This stub prevents build-time imports from failing for legacy routes.
// Any route still importing `~~/server/utils/prisma` should be migrated to Firestore.

export const prisma = new Proxy({}, {
  get() {
    throw new Error('Prisma is not available. This route must be migrated to Firestore.')
  }
}) as any

