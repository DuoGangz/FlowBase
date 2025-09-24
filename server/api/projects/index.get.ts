import { prisma } from '~~/server/utils/prisma'

export default defineEventHandler(async () => {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: 'desc' }
  })
  return projects
})


