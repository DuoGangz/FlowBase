import { prisma } from '~~/server/utils/prisma'

export default defineNitroPlugin(async () => {
  try {
    const enabled = process.env.SEED_OWNER_EMAIL && process.env.SEED_OWNER_PASSWORD
    if (!enabled) return

    // If a user with this email already exists, skip
    const existing = await prisma.user.findUnique({ where: { email: String(process.env.SEED_OWNER_EMAIL) } })
    if (existing) return

    // If there are any users at all, don't seed unless forced
    const force = String(process.env.SEED_FORCE || '').toLowerCase() === 'true'
    const userCount = await prisma.user.count()
    if (userCount > 0 && !force) return

    let account = await prisma.account.findFirst()
    if (!account) {
      account = await prisma.account.create({ data: { name: process.env.SEED_ACCOUNT_NAME || 'Default' } })
    }

    const name = process.env.SEED_OWNER_NAME || 'Owner'
    const usernameEnv = process.env.SEED_OWNER_USERNAME || (String(process.env.SEED_OWNER_EMAIL).split('@')[0])

    // NOTE: Demo only - storing plaintext password to match current login flow
    await prisma.user.create({
      data: {
        name,
        email: String(process.env.SEED_OWNER_EMAIL),
        username: usernameEnv,
        accountId: account.id,
        role: 'OWNER',
        passwordHash: String(process.env.SEED_OWNER_PASSWORD)
      }
    })
    console.log('[seed] OWNER user created via SEED_* envs')
  } catch (err) {
    console.error('[seed] failed:', err)
  }
})


