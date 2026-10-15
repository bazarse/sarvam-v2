import type { NextRequest } from 'next/server'

import { prisma } from '@/lib/db'
import { requireSession } from '@/lib/api-guard'
import { canAccessShop } from '@/lib/authz'
import { writeAudit } from '@/lib/audit'
import { createShopSchema } from '@/lib/validators'
import { Errors, apiOk } from '@/lib/errors'
import { clientIp } from '@/lib/utils'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requireSession()
  if (!guard.ok) return guard.response
  const { id } = await params

  const shop = await prisma.shop.findUnique({
    where: { id },
    include: { _count: { select: { devices: true, users: true } } },
  })
  if (!shop) return Errors.notFound('Shop')
  if (!canAccessShop(guard.session, shop.id)) return Errors.forbidden()

  return apiOk(shop)
}

export async function PUT(req: NextRequest, { params }: Params) {
  const guard = await requireSession('MANAGER')
  if (!guard.ok) return guard.response
  const { id } = await params

  const existing = await prisma.shop.findUnique({ where: { id } })
  if (!existing) return Errors.notFound('Shop')
  if (!canAccessShop(guard.session, existing.id)) return Errors.forbidden()

  const body = await req.json().catch(() => null)
  const parsed = createShopSchema.partial().safeParse(body)
  if (!parsed.success) return Errors.badRequest('Invalid shop data')

  const shop = await prisma.$transaction(async (tx) => {
    const updated = await tx.shop.update({ where: { id }, data: parsed.data })
    await writeAudit(tx, guard.session, {
      action: 'SHOP_UPDATED',
      targetType: 'SHOP',
      targetId: id,
      ipAddress: clientIp(req.headers),
    })
    return updated
  })

  return apiOk(shop)
}
