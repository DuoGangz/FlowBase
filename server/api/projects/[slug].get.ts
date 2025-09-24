import { prisma } from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const { slug } = getRouterParams(event)
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'slug is required' })
  }
  const project = await prisma.project.findUnique({
    where: { slug },
    include: {
      messages: { orderBy: { createdAt: 'desc' } },
      todos: { include: { items: true }, orderBy: { createdAt: 'desc' } },
      files: { orderBy: { createdAt: 'desc' } }
    }
  })
  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }
  return project
})


