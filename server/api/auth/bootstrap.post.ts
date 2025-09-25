export default defineEventHandler(async () => {
  throw createError({ statusCode: 400, statusMessage: 'Bootstrap disabled. Use Firebase sign-in.' })
})


