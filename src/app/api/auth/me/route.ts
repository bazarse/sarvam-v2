import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import { Errors, apiOk } from '@/lib/errors'

export async function GET() {
  const session = await getSession()
  if (!session) return Errors.unauthorized()

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      shopId: true,
      shop: { select: { name: true } },
    },
  })
  if (!user) return Errors.unauthorized()

  return apiOk({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    shopId: user.shopId,
    shopName: user.shop.name,
  })
}
