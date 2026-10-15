import { PrismaClient } from '@prisma/client'

import { hashPassword } from '../src/lib/auth'

// One-off: create a platform SUPER_ADMIN. Attached to the first org/shop
// nominally; authorization ignores scoping for SUPER_ADMIN.
const prisma = new PrismaClient()

async function main() {
  const org = await prisma.organization.findFirst({ orderBy: { createdAt: 'asc' } })
  const shop = await prisma.shop.findFirst({ orderBy: { createdAt: 'asc' } })
  if (!org || !shop) throw new Error('Seed base data first')

  const username = 'superadmin'
  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) {
    console.log('Super admin already exists:', username)
    return
  }

  await prisma.user.create({
    data: {
      orgId: org.id,
      shopId: shop.id,
      username,
      email: 'superadmin@platform.local',
      passwordHash: await hashPassword('super123'),
      role: 'SUPER_ADMIN',
    },
  })
  console.log('Super admin created. Login: superadmin / super123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
