import type { NextRequest } from 'next/server'

import { prisma } from '@/lib/db'
import { requireSession } from '@/lib/api-guard'
import { canAccessShop } from '@/lib/authz'
import { hashPassword } from '@/lib/auth'
import { writeAudit } from '@/lib/audit'
import { createUserSchema } from '@/lib/validators'
import { Errors, apiOk } from '@/lib/errors'
import { clientIp } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const guard = await requireSession('MANAGER')
  if (!guard.ok) return guard.response

  const shopId = req.nextUrl.searchParams.get('shopId') ?? guard.session.shopId
  if (!canAccessShop(guard.session, shopId)) return Errors.forbidden()

  const users = await prisma.user.findMany({
    where: { shopId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })
  return apiOk({ items: users })
}

export async function POST(req: NextRequest) {
  const guard = await requireSession('OWNER')
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => null)
  const parsed = createUserSchema.safeParse(body)
  if (!parsed.success) return Errors.badRequest('Invalid user data')
  if (!canAccessShop(guard.session, parsed.data.shopId)) {
    return Errors.forbidden()
  }

  const exists = await prisma.user.findUnique({
    where: { username: parsed.data.username },
  })
  if (exists) return Errors.conflict('Username already taken')

  const passwordHash = await hashPassword(parsed.data.password)
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        orgId: guard.session.orgId,
        shopId: parsed.data.shopId,
        username: parsed.data.username,
        email: parsed.data.email,
        role: parsed.data.role,
        passwordHash,
      },
      select: { id: true, username: true, role: true, shopId: true },
    })
    await writeAudit(tx, guard.session, {
      action: 'USER_CREATED',
      targetType: 'USER',
      targetId: created.id,
      metadata: { username: created.username, role: created.role },
      ipAddress: clientIp(req.headers),
    })
    return created
  })

  return apiOk(user, 201)
}
