import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { requireSession } from '@/lib/api-guard'
import { canAccessShop } from '@/lib/authz'
import { hashPassword } from '@/lib/auth'
import { writeAudit } from '@/lib/audit'
import { Errors, apiOk } from '@/lib/errors'
import { clientIp } from '@/lib/utils'

type Params = { params: Promise<{ id: string }> }

const updateSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6).max(128).optional(),
  role: z.enum(['OWNER', 'MANAGER', 'STAFF']).optional(),
  isActive: z.boolean().optional(),
})

export async function PUT(req: NextRequest, { params }: Params) {
  const guard = await requireSession('OWNER')
  if (!guard.ok) return guard.response
  const { id } = await params

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return Errors.notFound('User')
  if (!canAccessShop(guard.session, user.shopId)) return Errors.forbidden()

  const body = await req.json().catch(() => null)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return Errors.badRequest('Invalid user data')

  const { password, ...rest } = parsed.data
  const data: Record<string, unknown> = { ...rest }
  if (password) data.passwordHash = await hashPassword(password)

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, username: true, role: true, isActive: true },
  })
  return apiOk(updated)
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const guard = await requireSession('OWNER')
  if (!guard.ok) return guard.response
  const { id } = await params
  if (id === guard.session.userId) {
    return Errors.badRequest('You cannot delete your own account')
  }

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return Errors.notFound('User')
  if (!canAccessShop(guard.session, user.shopId)) return Errors.forbidden()

  await prisma.$transaction(async (tx) => {
    await tx.user.delete({ where: { id } })
    await writeAudit(tx, guard.session, {
      action: 'USER_DELETED',
      targetType: 'USER',
      targetId: id,
      metadata: { username: user.username },
      ipAddress: clientIp(req.headers),
    })
  })
  return apiOk({ deleted: true })
}
